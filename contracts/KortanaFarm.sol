// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Kortana Farm 🌾
 * @notice Distributes Native DNR rewards to users who stake their Liquidity Provider (LP) tokens.
 * This contract solves the "Bootstrap Problem" by incentivizing external users to bring capital 
 * onto the Kortana Network in exchange for high-yield DNR emissions.
 */
contract KortanaFarm is Ownable {
    using SafeERC20 for IERC20;

    // Info of each user.
    struct UserInfo {
        uint256 amount;     // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt calculation baseline.
    }

    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken;           // Address of LP token contract (e.g., KLP or bridged-USDT pairs).
        uint256 allocPoint;       // How many allocation points assigned to this pool.
        uint256 lastRewardTime;   // Last timestamp that DNRs distribution occurred.
        uint256 accDnrPerShare;   // Accumulated DNRs per share, times 1e12.
    }

    // Reward emission mechanics
    uint256 public dnrPerSecond;
    uint256 public totalAllocPoint = 0;
    uint256 public startTime;

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event RewardPaid(address indexed user, uint256 amount);

    constructor(uint256 _dnrPerSecond) Ownable(msg.sender) {
        dnrPerSecond = _dnrPerSecond;
        startTime = block.timestamp;
    }

    // Fund the farm with Native DNR rewards
    receive() external payable {}

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    function addPool(uint256 _allocPoint, IERC20 _lpToken, bool _withUpdate) public onlyOwner {
        if (_withUpdate) massUpdatePools();
        
        uint256 lastRewardTime = block.timestamp > startTime ? block.timestamp : startTime;
        totalAllocPoint += _allocPoint;
        
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardTime: lastRewardTime,
            accDnrPerShare: 0
        }));
    }

    // Update the given pool's DNR allocation point. Can only be called by the owner.
    function setPool(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner {
        if (_withUpdate) massUpdatePools();
        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    // View function to see pending DNR rewards for a user
    function pendingDNR(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accPerShare = pool.accDnrPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        
        if (block.timestamp > pool.lastRewardTime && lpSupply != 0) {
            uint256 multiplier = block.timestamp - pool.lastRewardTime;
            uint256 dnrReward = (multiplier * dnrPerSecond * pool.allocPoint) / totalAllocPoint;
            accPerShare += (dnrReward * 1e12) / lpSupply;
        }
        
        return (user.amount * accPerShare / 1e12) - user.rewardDebt;
    }

    // Update reward variables for all pools
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.timestamp <= pool.lastRewardTime) return;
        
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardTime = block.timestamp;
            return;
        }
        
        uint256 multiplier = block.timestamp - pool.lastRewardTime;
        uint256 dnrReward = (multiplier * dnrPerSecond * pool.allocPoint) / totalAllocPoint;
        
        pool.accDnrPerShare += (dnrReward * 1e12) / lpSupply;
        pool.lastRewardTime = block.timestamp;
    }

    // Deposit LP tokens to Farm for DNR allocation
    function deposit(uint256 _pid, uint256 _amount) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accDnrPerShare / 1e12) - user.rewardDebt;
            if (pending > 0) safeDnrTransfer(msg.sender, pending);
        }
        
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            user.amount += _amount;
        }
        
        user.rewardDebt = user.amount * pool.accDnrPerShare / 1e12;
        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from Farm
    function withdraw(uint256 _pid, uint256 _amount) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        
        uint256 pending = (user.amount * pool.accDnrPerShare / 1e12) - user.rewardDebt;
        if (pending > 0) safeDnrTransfer(msg.sender, pending);
        
        if (_amount > 0) {
            user.amount -= _amount;
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        
        user.rewardDebt = user.amount * pool.accDnrPerShare / 1e12;
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Safe DNR native transfer function, just in case if rounding error causes pool to not have enough DNRs.
    function safeDnrTransfer(address _to, uint256 _amount) internal {
        uint256 dnrBal = address(this).balance;
        if (_amount > dnrBal) {
            payable(_to).transfer(dnrBal);
            emit RewardPaid(_to, dnrBal);
        } else {
            payable(_to).transfer(_amount);
            emit RewardPaid(_to, _amount);
        }
    }

    // Admin commands
    function setEmissionRate(uint256 _dnrPerSecond) external onlyOwner {
        massUpdatePools();
        dnrPerSecond = _dnrPerSecond;
    }

    // Withdraw accidentally sent Native DNR (Owner only emergency)
    function emergencyWithdrawDNR(uint256 amount) external onlyOwner {
        payable(msg.sender).transfer(amount);
    }
}
