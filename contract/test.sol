// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CustomERC20 is ERC20, Ownable {

    uint8 private constant _customDecimals = 16;

    constructor(
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {}

    // Override decimals to 16
    function decimals() public pure override returns (uint8) {
        return _customDecimals;
    }

    // Mint function (auto adds 16 decimals)
    function mint(address to, uint256 amount) external onlyOwner {
        uint256 scaledAmount = amount * (10 ** _customDecimals);
        _mint(to, scaledAmount);
    }
}