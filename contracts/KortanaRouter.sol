// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./KortanaFactory.sol";
import "./KortanaPair.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract KortanaRouter {
    address public immutable factory;
    address public immutable WDNR;

    constructor(address _factory, address _WDNR) {
        factory = _factory;
        WDNR = _WDNR;
    }

    receive() external payable {
        assert(msg.sender == WDNR); // only accept DNR via falling back from the WDNR contract
    }

    // **** ADD LIQUIDITY ****
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) internal virtual returns (uint amountA, uint amountB) {
        if (KortanaFactory(factory).getPair(tokenA, tokenB) == address(0)) {
            KortanaFactory(factory).createPair(tokenA, tokenB);
        }
        (uint reserveA, uint reserveB,) = KortanaPair(KortanaFactory(factory).getPair(tokenA, tokenB)).getReserves();
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint amountBOptimal = amountADesired * reserveB / reserveA;
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "KortanaRouter: INSUFFICIENT_B_AMOUNT");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = amountBDesired * reserveA / reserveB;
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, "KortanaRouter: INSUFFICIENT_A_AMOUNT");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external virtual returns (uint amountA, uint amountB, uint liquidity) {
        require(deadline >= block.timestamp, "KortanaRouter: EXPIRED");
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = KortanaFactory(factory).getPair(tokenA, tokenB);
        IERC20(tokenA).transferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).transferFrom(msg.sender, pair, amountB);
        liquidity = KortanaPair(pair).mint(to);
    }

    // **** SWAP ****
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) public pure virtual returns (uint amountOut) {
        require(amountIn > 0, "KortanaRouter: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "KortanaRouter: INSUFFICIENT_LIQUIDITY");
        uint amountInWithFee = amountIn * 997;
        uint numerator = amountInWithFee * reserveOut;
        uint denominator = reserveIn * 1000 + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external virtual returns (uint[] memory amounts) {
        require(deadline >= block.timestamp, "KortanaRouter: EXPIRED");
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        
        // Simple 1-hop swap for now, can be extended to multi-hop
        address pair = KortanaFactory(factory).getPair(path[0], path[1]);
        (uint reserve0, uint reserve1,) = KortanaPair(pair).getReserves();
        (uint reserveIn, uint reserveOut) = path[0] < path[1] ? (reserve0, reserve1) : (reserve1, reserve0);
        
        amounts[1] = getAmountOut(amountIn, reserveIn, reserveOut);
        require(amounts[1] >= amountOutMin, "KortanaRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        
        IERC20(path[0]).transferFrom(msg.sender, pair, amounts[0]);
        if (path[0] < path[1]) {
            KortanaPair(pair).swap(0, amounts[1], to);
        } else {
            KortanaPair(pair).swap(amounts[1], 0, to);
        }
    }
}
