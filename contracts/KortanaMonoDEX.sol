// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

uint256 constant PREC              = 1e9;        // 9-dec internal precision (Bug 7 fix)
uint256 constant MINIMUM_LIQUIDITY = 1000;       // locked to address(0) on first deposit
uint256 constant REBASE_PRECISION  = 1e9;        // rebase index base
uint256 constant REBASE_BAND       = 5;          // 5% deviation threshold
uint256 constant MAX_REBASE_DELTA  = 10;         // max 10% supply change per rebase
uint256 constant REBASE_COOLDOWN   = 86400;      // 24 hours

contract KortanaMonoDEX {
    // Ownership & Access
    address public owner;
    address public operator;
    address public token0;      // DNR
    address public factory;     // Official Factory
    mapping(address => bool) private _isOperator;

    // ktUSD ERC-20
    mapping(address => uint256) private _bal;       // 9-decimal base units
    mapping(address => mapping(address => uint256)) private _allow;
    uint256 private _totalSupply;                   // 9-decimal base units

    // KLP LP Token — stored INTERNALLY to avoid cross-contract CALL gas overhead
    mapping(address => uint256) private _lpBal;
    uint256 public lpTotalSupply;
    mapping(address => mapping(address => uint256)) private _lpAllow;

    // AMM Reserves
    uint256 private _rDNR;    // 9-decimal
    uint256 private _rKTUSD;  // 9-decimal

    // Reentrancy guard
    uint8 private _lock;

    // Rebase engine
    uint256 private _rebaseIndex;       // starts at 1e9 (= 1.0 in 9-dec)
    uint256 private _lastRebaseTime;
    uint256 private _mintedToday;
    uint256 private _mintWindowStart;
    uint256 public  mintCap;            // max ktUSD mintable per 24h (18-decimal)
    uint256 public  minCollateralRatio; // e.g. 150 = 150%
    mapping(address => uint256) private _dnrCollateral;  // locked DNR per address

    // ERC-20 standard
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // Uniswap V2 Pair standard — DEX Screener reads these EXACTLY
    // token0 = DNR (amount0), token1 = ktUSD (amount1)
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);  // reserve0=DNR, reserve1=ktUSD

    // Rebase
    event Rebase(uint256 oldIndex, uint256 newIndex, uint256 ktUSDPriceUSD18);

    constructor(address _operator, address _wdnr, address _factory, uint256 _mintCap, uint256 _minCollRatio) {
        owner             = msg.sender;
        operator          = _operator;
        _isOperator[_operator] = true;
        token0            = _wdnr;
        factory           = _factory;
        mintCap           = _mintCap;
        minCollateralRatio = _minCollRatio;
        _rebaseIndex      = REBASE_PRECISION;   // start at 1.0
        _mintWindowStart  = block.timestamp;
        _lock             = 1;
    }

    modifier lock() {
        require(_lock == 1, "DEX: LOCKED");
        _lock = 2;
        _;
        _lock = 1;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "DEX: NOT_OWNER");
        _;
    }

    modifier onlyOperator() {
        require(_isOperator[msg.sender] || msg.sender == owner, "DEX: NOT_OPERATOR");
        _;
    }

    string public constant name     = "Kortana Convertible Dollar";
    string public constant symbol   = "ktUSD";
    uint8  public constant decimals = 18;

    function totalSupply() external view returns (uint256) {
        return (_totalSupply * _rebaseIndex / REBASE_PRECISION) * PREC;
    }

    function balanceOf(address a) external view returns (uint256) {
        return (_bal[a] * _rebaseIndex / REBASE_PRECISION) * PREC;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _move(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 base = amount / PREC;
        require(_allow[from][msg.sender] >= base, "DEX: ALLOWANCE");
        _allow[from][msg.sender] -= base;
        _move(from, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allow[msg.sender][spender] = amount / PREC;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function allowance(address owner_, address spender) external view returns (uint256) {
        return _allow[owner_][spender] * PREC;
    }

    // Internal: move in base units (rebase-adjusted)
    function _move(address from, address to, uint256 amount18) private {
        uint256 base = (amount18 / PREC) * REBASE_PRECISION / _rebaseIndex;
        require(_bal[from] >= base, "DEX: BALANCE");
        unchecked { _bal[from] -= base; }
        _bal[to] += base;
        emit Transfer(from, to, amount18);
    }

    // Legacy operator mint — used for faucet/bootstrapping (no collateral required)
    function mint(address to, uint256 amount18) external onlyOperator {
        _mintInternal(to, amount18);
    }

    // Collateralized mint — production minting path on mainnet
    // msg.value = DNR collateral. Must satisfy minCollateralRatio.
    function mintWithCollateral(uint256 ktUSDAmount18, address to) external payable lock {
        require(msg.value > 0, "DEX: NO_COLLATERAL");
        // Collateral check (simplified — integrate DNR/USD price from operator oracle in v2)
        // For now, enforce 1 DNR : 1 ktUSD minimum (adjust with oracle price feed later)
        require(msg.value * 100 >= ktUSDAmount18 * minCollateralRatio / 100, "DEX: UNDERCOLLATERALIZED");

        // Mint cap enforcement
        if (block.timestamp >= _mintWindowStart + 86400) {
            _mintWindowStart = block.timestamp;
            _mintedToday = 0;
        }
        require(_mintedToday + ktUSDAmount18 <= mintCap, "DEX: MINT_CAP");
        _mintedToday += ktUSDAmount18;

        _dnrCollateral[msg.sender] += msg.value;
        _mintInternal(to, ktUSDAmount18);
    }

    function _mintInternal(address to, uint256 amount18) private {
        uint256 base = (amount18 / PREC) * REBASE_PRECISION / _rebaseIndex;
        _bal[to] += base;
        _totalSupply += base;
        emit Transfer(address(0), to, amount18);
    }

    function setOperator(address addr, bool enabled) external onlyOwner {
        _isOperator[addr] = enabled;
    }

    function isOperator(address addr) external view returns (bool) {
        return _isOperator[addr];
    }

    // KLP LP Token — Internal accounting (no cross-contract calls)
    function lpBalanceOf(address a) external view returns (uint256) {
        return _lpBal[a];
    }

    function lpApprove(address spender, uint256 amount) external returns (bool) {
        _lpAllow[msg.sender][spender] = amount;
        return true;
    }

    function lpAllowance(address owner_, address spender) external view returns (uint256) {
        return _lpAllow[owner_][spender];
    }

    function lpTransfer(address to, uint256 amount) external {
        require(_lpBal[msg.sender] >= amount, "DEX: LP_BALANCE");
        unchecked { _lpBal[msg.sender] -= amount; }
        _lpBal[to] += amount;
    }

    function lpTransferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(_lpAllow[from][msg.sender] >= amount, "DEX: LP_ALLOWANCE");
        require(_lpBal[from] >= amount, "DEX: LP_BALANCE");
        unchecked { _lpAllow[from][msg.sender] -= amount; }
        unchecked { _lpBal[from] -= amount; }
        _lpBal[to] += amount;
        return true;
    }

    // DEX Screener View Functions
    // token1 = ktUSD = address(this)
    function token1() external view returns (address) {
        return address(this);
    }

    // Uniswap V2 exact signature — DEX Screener reads this
    // reserve0 = DNR, reserve1 = ktUSD
    function getReserves() external view returns (
        uint112 reserve0,
        uint112 reserve1,
        uint32  blockTimestampLast
    ) {
        reserve0           = uint112(_rDNR   * PREC);
        reserve1           = uint112(_rKTUSD * PREC);
        blockTimestampLast = uint32(block.timestamp);
    }

    // Aggregator-compatible price quote (Uniswap V2 Router interface)
    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external view returns (uint256[] memory amounts)
    {
        require(path.length == 2, "DEX: INVALID_PATH");
        amounts    = new uint256[](2);
        amounts[0] = amountIn;
        bool dnrIn = (path[0] == token0);
        uint256 sIn = amountIn / PREC;
        uint256 sOut;
        if (dnrIn) sOut = _amtOut(sIn, _rDNR,   _rKTUSD);
        else       sOut = _amtOut(sIn, _rKTUSD, _rDNR);
        amounts[1] = sOut * PREC;
    }

    // Frontend price quote helper
    function getAmountOut(uint256 amountIn18, bool dnrIn) external view returns (uint256) {
        uint256 sIn = amountIn18 / PREC;
        uint256 sOut = dnrIn
            ? _amtOut(sIn, _rDNR,   _rKTUSD)
            : _amtOut(sIn, _rKTUSD, _rDNR);
        return sOut * PREC;
    }

    // AMM Core Functions
    // Add liquidity — DNR via msg.value, ktUSD from caller balance
    function addLiquidity(
        uint256 amountKTUSD18,
        uint256 minKTUSD18,
        uint256 minDNR18,
        address to
    ) external payable lock {
        uint256 dnrIn  = msg.value / PREC;
        uint256 usdIn  = amountKTUSD18 / PREC;
        uint256 usedDNR; uint256 usedUSD;

        if (_rDNR == 0 && _rKTUSD == 0) {
            // First deposit — use full amounts
            usedDNR = dnrIn;
            usedUSD = usdIn;
        } else {
            // Maintain pool ratio
            uint256 optUSD = dnrIn * _rKTUSD / _rDNR;
            if (optUSD <= usdIn) {
                usedDNR = dnrIn;
                usedUSD = optUSD;
            } else {
                usedUSD = usdIn;
                usedDNR = usdIn * _rDNR / _rKTUSD;
            }
        }

        require(usedDNR * PREC >= minDNR18,   "DEX: INSUFFICIENT_DNR");
        require(usedUSD * PREC >= minKTUSD18, "DEX: INSUFFICIENT_KTUSD");

        // Move ktUSD from sender to contract (internal accounting)
        uint256 usdBase = usedUSD * REBASE_PRECISION / _rebaseIndex;
        require(_bal[msg.sender] >= usdBase, "DEX: BALANCE");
        unchecked { _bal[msg.sender] -= usdBase; }
        // ktUSD is now inside the pool (accounted by reserves)

        // Mint LP tokens — internal storage, no cross-contract CALL
        uint256 lp;
        if (lpTotalSupply == 0) {
            // Genesis: fixed 1M LP tokens, lock 1000 to dead address
            lp = 1_000_000 * 1e18;
            _lpBal[address(0x000000000000000000000000000000000000dEaD)] += 1000;
            lpTotalSupply += 1000;
            lp -= 1000;
        } else {
            uint256 lpA = (usedDNR * lpTotalSupply) / _rDNR;
            uint256 lpB = (usedUSD * lpTotalSupply) / _rKTUSD;
            lp = lpA < lpB ? lpA : lpB;
        }
        require(lp > 0, "DEX: ZERO_LP");
        _lpBal[to] += lp;
        lpTotalSupply += lp;

        // Update reserves
        _rDNR   += usedDNR;
        _rKTUSD += usedUSD;

        // Refund excess DNR
        uint256 refund = (dnrIn - usedDNR) * PREC;
        if (refund > 0) _sendDNR(msg.sender, refund);

        // Emit Uniswap V2 standard events (DEX Screener compatible)
        emit Mint(msg.sender, usedDNR * PREC, usedUSD * PREC);
        emit Sync(uint112(_rDNR * PREC), uint112(_rKTUSD * PREC));
    }

    // Remove liquidity — burn KLP, receive DNR + ktUSD
    function removeLiquidity(
        uint256 lpAmount18,
        uint256 minKTUSD18,
        uint256 minDNR18,
        address to
    ) external lock {
        uint256 lpTotal = lpTotalSupply;
        uint256 outDNR = (lpAmount18 * _rDNR)   / lpTotal;
        uint256 outUSD = (lpAmount18 * _rKTUSD) / lpTotal;

        require(outDNR * PREC >= minDNR18,   "DEX: SLIPPAGE_DNR");
        require(outUSD * PREC >= minKTUSD18, "DEX: SLIPPAGE_KTUSD");

        // Burn LP — internal storage
        require(_lpBal[msg.sender] >= lpAmount18, "DEX: LP_BALANCE");
        unchecked { _lpBal[msg.sender] -= lpAmount18; }
        lpTotalSupply -= lpAmount18;

        // Update reserves
        _rDNR   -= outDNR;
        _rKTUSD -= outUSD;

        // Return ktUSD to recipient (rebase-adjusted)
        uint256 usdBase = outUSD * REBASE_PRECISION / _rebaseIndex;
        _bal[to] += usdBase;
        emit Transfer(address(0), to, outUSD * PREC);

        // Return DNR
        _sendDNR(to, outDNR * PREC);

        // Emit Uniswap V2 standard events
        emit Burn(msg.sender, outDNR * PREC, outUSD * PREC, to);
        emit Sync(uint112(_rDNR * PREC), uint112(_rKTUSD * PREC));
    }

    // Swap: DNR → ktUSD
    function swapExactDNRForKTUSD(uint256 minOut18, address to) external payable lock {
        require(msg.value > 0, "DEX: ZERO_INPUT");
        uint256 sIn  = msg.value / PREC;
        uint256 sOut = _amtOut(sIn, _rDNR, _rKTUSD);
        require(sOut * PREC >= minOut18, "DEX: SLIPPAGE");

        _rDNR   += sIn;
        _rKTUSD -= sOut;

        uint256 usdBase = sOut * REBASE_PRECISION / _rebaseIndex;
        _bal[to] += usdBase;
        emit Transfer(address(0), to, sOut * PREC);

        emit Swap(msg.sender, msg.value, 0, 0, sOut * PREC, to);
        emit Sync(uint112(_rDNR * PREC), uint112(_rKTUSD * PREC));
    }

    // Swap: ktUSD → DNR
    function swapExactKTUSDForDNR(uint256 amountIn18, uint256 minOut18, address to) external lock {
        uint256 sIn  = amountIn18 / PREC;
        require(sIn > 0, "DEX: ZERO_INPUT");
        uint256 sOut = _amtOut(sIn, _rKTUSD, _rDNR);
        require(sOut * PREC >= minOut18, "DEX: SLIPPAGE");

        uint256 usdBase = sIn * REBASE_PRECISION / _rebaseIndex;
        require(_bal[msg.sender] >= usdBase, "DEX: BALANCE");
        unchecked { _bal[msg.sender] -= usdBase; }
        emit Transfer(msg.sender, address(0), amountIn18);

        _rKTUSD += sIn;
        _rDNR   -= sOut;

        _sendDNR(to, sOut * PREC);

        emit Swap(msg.sender, 0, amountIn18, sOut * PREC, 0, to);
        emit Sync(uint112(_rDNR * PREC), uint112(_rKTUSD * PREC));
    }

    // Rebase Engine
    // Called by trusted operator once per 24h maximum
    // ktUSDPriceUSD18 = current market price of ktUSD in USD, 18-decimal
    function rebase(uint256 ktUSDPriceUSD18) external onlyOperator {
        require(
            block.timestamp >= _lastRebaseTime + REBASE_COOLDOWN,
            "DEX: REBASE_COOLDOWN"
        );
        _lastRebaseTime = block.timestamp;

        // Price in basis points relative to $1.00
        // 1e18 = $1.00. If price = 1.05e18, that's 5% above peg.
        uint256 oldIndex = _rebaseIndex;

        if (ktUSDPriceUSD18 > (1e18 * (100 + REBASE_BAND) / 100)) {
            // Above band — positive rebase (expand supply)
            uint256 deviation = (ktUSDPriceUSD18 - 1e18) * 100 / 1e18;
            uint256 delta = deviation > MAX_REBASE_DELTA ? MAX_REBASE_DELTA : deviation;
            _rebaseIndex = _rebaseIndex * (100 + delta) / 100;
        } else if (ktUSDPriceUSD18 < (1e18 * (100 - REBASE_BAND) / 100)) {
            // Below band — negative rebase (contract supply)
            uint256 deviation = (1e18 - ktUSDPriceUSD18) * 100 / 1e18;
            uint256 delta = deviation > MAX_REBASE_DELTA ? MAX_REBASE_DELTA : deviation;
            _rebaseIndex = _rebaseIndex * (100 - delta) / 100;
        } else {
            return; // Within band — no rebase
        }

        emit Rebase(oldIndex, _rebaseIndex, ktUSDPriceUSD18);
    }

    function rebaseInfo() external view returns (
        uint256 index,
        uint256 lastRebaseTime,
        uint256 nextRebaseWindow,
        uint256 mintedToday,
        uint256 cap
    ) {
        index           = _rebaseIndex;
        lastRebaseTime  = _lastRebaseTime;
        nextRebaseWindow = _lastRebaseTime + REBASE_COOLDOWN;
        mintedToday     = _mintedToday;
        cap             = mintCap;
    }

    function collateralOf(address a) external view returns (uint256) {
        return _dnrCollateral[a];
    }

    // Internal Helpers
    function _amtOut(uint256 aIn, uint256 rIn, uint256 rOut) private pure returns (uint256) {
        require(rIn > 0 && rOut > 0, "DEX: NO_LIQUIDITY");
        uint256 aInFee = aIn * 997;
        return (aInFee * rOut) / (rIn * 1000 + aInFee);
    }

    function _sendDNR(address to, uint256 amount18) private {
        (bool ok,) = to.call{value: amount18}("");
        require(ok, "DEX: DNR_TRANSFER_FAILED");
    }

    function _sqrt(uint256 x) private pure returns (uint256 z) {
        if (x == 0) return 0;
        z = x;
        uint256 y = x;
        if (y >= 0x100000000000000000000000000000000) { y >>= 128; z >>= 64; }
        if (y >= 0x10000000000000000)                 { y >>= 64;  z >>= 32; }
        if (y >= 0x100000000)                         { y >>= 32;  z >>= 16; }
        if (y >= 0x10000)                             { y >>= 16;  z >>= 8;  }
        if (y >= 0x100)                               { y >>= 8;   z >>= 4;  }
        if (y >= 0x10)                                {            z >>= 2;  }
        z = (z + x / z) >> 1;
        z = (z + x / z) >> 1;
        z = (z + x / z) >> 1;
        z = (z + x / z) >> 1;
        z = (z + x / z) >> 1;
        z = (z + x / z) >> 1;
        z = (z + x / z) >> 1;
        return z > x / z ? x / z : z;
    }

    receive() external payable {}
}
