pragma solidity ^0.4.23;

import "../ERC721HoldingsBasicToken.sol";

/**
 * @title ERC721HoldingsBasicTokenMock
 * This mock just provides a public mint and burn functions for testing purposes
 */
contract ERC721HoldingsBasicTokenMock is ERC721HoldingsBasicToken {

  constructor (address _nftAddress) ERC721HoldingsBasicToken(_nftAddress) public {
    require(_nftAddress != address(0));
    tokens = ERC721(_nftAddress);
  }

  function mint(uint256 _to, address _toOrigin, uint256 _tokenId) public {
    _mint(_to, _toOrigin, _tokenId);
  }

  function burn(address _owner, uint256 _tokenId) public {
    _burn(_owner, _tokenId);
  }
}
