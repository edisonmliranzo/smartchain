
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Graffiti {
    // Event emitted when a pixel is painted
    event PixelPainted(uint16 x, uint16 y, string color, address artist);

    // Mappings to store pixel data
    // Optimizing storage: packing x, y into a single key might be cheaper, but native mapping is fine for our gas limit.
    // x -> y -> color
    mapping(uint16 => mapping(uint16 => string)) public canvas;

    // Price to paint a pixel (0.1 SMC)
    uint256 public constant PIXEL_PRICE = 0.1 ether;

    // Owner to withdraw funds
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    /**
     * Paint a pixel on the wall
     * @param x The x coordinate (0-100)
     * @param y The y coordinate (0-100)
     * @param color The hex color code (e.g. "#FF0000")
     */
    function paint(uint16 x, uint16 y, string calldata color) external payable {
        require(msg.value >= PIXEL_PRICE, "Insufficient payment");
        require(x <= 100 && y <= 100, "Coordinates out of bounds");
        
        canvas[x][y] = color;
        
        emit PixelPainted(x, y, color, msg.sender);
    }

    /**
     * Withdraw collected funds
     */
    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        payable(owner).transfer(address(this).balance);
    }
}
