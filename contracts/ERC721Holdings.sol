pragma solidity ^0.4.23;

import "./ERC721HoldingsBasic.sol";

/**
 * @title Holdings of ERC-721 Non-Fungible Token Standard, optional enumeration extension
 * @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract ERC721HoldingsEnumerable is ERC721HoldingsBasic {
  function totalSupply() public view returns (uint256);
  function tokenOfHolderByIndex(uint256 _holder, address _holderOrigin, uint256 _index) public view returns (uint256 _tokenId);
  function tokenByIndex(uint256 _index) public view returns (uint256);
}

/**
 * @title Holdings of ERC-721 Non-Fungible Token Standard, optional metadata extension
 * @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract ERC721HoldingsMetadata is ERC721HoldingsBasic {
  function name() public view returns (string _name);
  function symbol() public view returns (string _symbol);
  function tokenURI(uint256 _tokenId) public view returns (string);
}

/**
 * @title Holdings of ERC-721 Non-Fungible Token Standard, full implementation interface
 * @dev See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract ERC721Holdings is ERC721HoldingsBasic, ERC721HoldingsEnumerable, ERC721HoldingsMetadata {}
