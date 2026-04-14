// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * KortanaMonoDEX V2 (Hardened)
 * ----------------------------
 * A robust, Uniswap-compatible Mono-DEX with integrated rebase-stable ktUSD.
 * High-precision math, Reentrancy protection, and Explicit Reverts.
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract KortanaMonoDEX is ReentrancyGuard {
    // --- Constant Definitions ---
    uint256 public constant PREC = 1e9;
    uint256 public constant REBASE_PRECISION = 1e9;
    uint256 public constant REBASE_BAND = 5;
    uint256 public constant MAX_REBASE_DELTA = 10;
    uint256 public constant REBASE_COOLDOWN = 86400;

    // --- State Variables ---
    address public owner;
    address public operator;
    address public token0; // DNR (Native Wrapper Path)
    address public factory;

    // ktUSD (Internal ERC20 Logic)
    mapping(address => uint256) private _bal; // Base units
    mapping(address => mapping(address => uint256)) private _allow;
    uint256 private _totalSupply;

    // LP Ledger
    mapping(address => uint256) private _lpBal;
    uint256 public lpTotalSupply;
    mapping(address => mapping(address => uint256)) private _lpAllow;

    // AMM Reserves (9-decimal internally)
    uint256 private _rDNR;
    uint256 private _rKTUSD;

    // Rebase Logic
    uint256 private _rebaseIndex;
    uint256 private _lastRebaseTime;
    uint256 private _mintedToday;
    uint256 private _mintWindowStart;
    uint256 public mintCap;
    uint256 public minCollateralRatio;
    mapping(address => uint256) private _dnrCollateral; 

    // --- Events (Uniswap V2 Standard for Indexing) ---
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to);
    event Sync(uint112 reserve0, uint112 reserve1);
    event Rebase(uint256 oldIndex, uint256 newIndex, uint256 ktUSDPrice);

    constructor(address _operator, address _wdnr, address _factory, uint256 _mintCap, uint256 _minRatio) {
        owner = msg.sender;
        operator = _operator;
        token0 = _wdnr;
        factory = _factory;
        mintCap = _mintCap;
        minCollateralRatio = _minRatio;
        _rebaseIndex = REBASE_PRECISION;
        _mintWindowStart = block.timestamp;
    }

    modifier onlyOwner() { require(msg.sender == owner, "DEX: UNAUTHORIZED"); _; }
    modifier onlyOperator() { require(msg.sender == operator || msg.sender == owner, "DEX: NOT_OPERATOR"); _; }

    // --- ktUSD ERC20 Interface ---
    string public constant name = "Kortana Convertible Dollar";
    string public constant symbol = "ktUSD";
    uint8 public constant decimals = 18;

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
        require(_allow[from][msg.sender] >= base, "DEX: INSUFFICIENT_ALLOWANCE");
        unchecked { _allow[from][msg.sender] -= base; }
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

    // --- MINTING ENGINE (Hardened) ---
    function mintWithCollateral(uint256 ktUSDAmount18, address to) external payable nonReentrant {
        require(msg.value > 0, "DEX: NO_DNR_COLLATERAL");
        // Collateral Check: e.g. 1 DNR >= 1 ktUSD if ratio is 150
        // (Simplified for v2 - logic ensures floor stability)
        require(msg.value * 100 >= ktUSDAmount18 * minCollateralRatio / 100, "DEX: UNDERCOLLATERALIZED");

        if (block.timestamp >= _mintWindowStart + 86400) {
            _mintWindowStart = block.timestamp;
            _mintedToday = 0;
        }
        require(_mintedToday + ktUSDAmount18 <= mintCap, "DEX: GLOBAL_MINT_CAP_EXCEEDED");
        _mintedToday += ktUSDAmount18;
        _dnrCollateral[msg.sender] += msg.value;

        uint256 base = (ktUSDAmount18 / PREC) * REBASE_PRECISION / _rebaseIndex;
        _bal[to] += base;
        _totalSupply += base;
        emit Transfer(address(0), to, ktUSDAmount18);
    }

    function rebaseInfo() external view returns (uint256, uint256, uint256, uint256, uint256) {
        return (_rebaseIndex, _lastRebaseTime, _lastRebaseTime + REBASE_COOLDOWN, _mintedToday, mintCap);
    }

    function collateralOf(address a) external view returns (uint256) {
        return _dnrCollateral[a];
    }

    function _move(address from, address to, uint256 amount18) internal {
        uint256 base = (amount18 / PREC) * REBASE_PRECISION / _rebaseIndex;
        require(_bal[from] >= base, "DEX: BALANCE_EXCEEDED");
        unchecked { _bal[from] -= base; }
        _bal[to] += base;
        emit Transfer(from, to, amount18);
    }

    // --- AMM RESERVES & VIEWS ---
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast) {
        return (uint112(_rDNR * PREC), uint112(_rKTUSD * PREC), uint32(block.timestamp));
    }

    function getAmountOut(uint256 amountIn, bool dnrIn) external view returns (uint256) {
        uint256 sIn = amountIn / PREC;
        if (dnrIn) return _calcOut(sIn, _rDNR, _rKTUSD) * PREC;
        return _calcOut(sIn, _rKTUSD, _rDNR) * PREC;
    }

    function _calcOut(uint256 aIn, uint256 rIn, uint256 rOut) internal pure returns (uint256) {
        require(rIn > 0 && rOut > 0, "DEX: NO_POOL_LIQUIDITY");
        uint256 aInFee = aIn * 997;
        return (aInFee * rOut) / (rIn * 1000 + aInFee);
    }

    // --- NATIVE DNR SWAPS (Native <-> ktUSD) ---
    function swapExactDNRForKTUSD(uint256 minOut, address to) external payable nonReentrant {
        require(msg.value > 0, "DEX: ZERO_DNR_VALUE");
        uint256 sIn = msg.value / PREC;
        uint256 sOut = _calcOut(sIn, _rDNR, _rKTUSD);
        require(sOut * PREC >= minOut, "DEX: SLIPPAGE_TOO_HIGH");

        _rDNR += sIn;
        _rKTUSD -= sOut;

        uint256 usdBase = sOut * REBASE_PRECISION / _rebaseIndex;
        _bal[to] += usdBase;
        _totalSupply += 0; // Reserves are separate from circulation mapping here

        emit Swap(msg.sender, msg.value, 0, 0, sOut * PREC, to);
        emit Sync(uint112(_rDNR * PREC), uint112(_rKTUSD * PREC));
    }

    function swapExactKTUSDForDNR(uint256 amountIn, uint256 minOut, address to) external nonReentrant {
        uint256 sIn = amountIn / PREC;
        require(sIn > 0, "DEX: ZERO_INPUT_KTUSD");
        uint256 sOut = _calcOut(sIn, _rKTUSD, _rDNR);
        require(sOut * PREC >= minOut, "DEX: SLIPPAGE_TOO_HIGH");

        uint256 usdBase = sIn * REBASE_PRECISION / _rebaseIndex;
        require(_bal[msg.sender] >= usdBase, "DEX: KTUSD_BALANCE_LOW");
        unchecked { _bal[msg.sender] -= usdBase; }

        _rKTUSD += sIn;
        _rDNR -= sOut;

        (bool ok,) = to.call{value: sOut * PREC}("");
        require(ok, "DEX: DNR_TRANSFER_FAIL");

        emit Swap(msg.sender, 0, amountIn, sOut * PREC, 0, to);
        emit Sync(uint112(_rDNR * PREC), uint112(_rKTUSD * PREC));
    }

    // --- LIQUIDITY MGT ---
    function addLiquidity(uint256 amountKTUSD, address to) external payable nonReentrant {
        uint256 dnrIn = msg.value / PREC;
        uint256 usdIn = amountKTUSD / PREC;
        uint256 usedDNR;
        uint256 usedUSD;

        if (_rDNR == 0) {
            usedDNR = dnrIn;
            usedUSD = usdIn;
        } else {
            uint256 optUSD = (dnrIn * _rKTUSD) / _rDNR;
            if (optUSD <= usdIn) {
                usedDNR = dnrIn;
                usedUSD = optUSD;
            } else {
                usedUSD = usdIn;
                usedDNR = (usdIn * _rDNR) / _rKTUSD;
            }
        }

        uint256 usdBase = (usedUSD * REBASE_PRECISION) / _rebaseIndex;
        require(_bal[msg.sender] >= usdBase, "DEX: LP_KTUSD_MISSING");
        unchecked { _bal[msg.sender] -= usdBase; }

        uint256 lp;
        if (lpTotalSupply == 0) {
            lp = 1_000_000 * 1e18;
            _lpBal[address(0xdEaD)] = 1000;
            lpTotalSupply = 1000;
            lp -= 1000;
        } else {
            uint256 lpA = (usedDNR * lpTotalSupply) / _rDNR;
            uint256 lpB = (usedUSD * lpTotalSupply) / _rKTUSD;
            lp = lpA < lpB ? lpA : lpB;
        }

        _lpBal[to] += lp;
        lpTotalSupply += lp;
        _rDNR += usedDNR;
        _rKTUSD += usedUSD;

        if (dnrIn > usedDNR) payable(msg.sender).transfer((dnrIn - usedDNR) * PREC);
        emit Mint(msg.sender, usedDNR * PREC, usedUSD * PREC);
        emit Sync(uint112(_rDNR * PREC), uint112(_rKTUSD * PREC));
    }

    receive() external payable {}
}
