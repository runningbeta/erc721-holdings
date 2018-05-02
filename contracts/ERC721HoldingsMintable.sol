pragma solidity ^0.4.23;

import "./ERC721HoldingsBasic.sol";


/**
 * @title Holdings of ERC-721 Non-Fungible Token Standard, optional mintable extension
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 */
contract ERC721HoldingsMintable is ERC721HoldingsBasic {

  /**
   * @dev Function to mint a new token
   * @dev Reverts if the given token ID already exists
   * @param _to The holder ID that will hold the minted token
   * @param _toOrigin address of the holder's origin
   * @param _tokenId uint256 ID of the token to be minted by the msg.sender
   */
  function mint(uint256 _to, address _toOrigin, uint256 _tokenId) public;

  /**
   * @dev Internal function to burn a specific token
   * @dev Reverts if the token does not exist
   * @param _owner owner of the token
   * @param _tokenId uint256 ID of the token being burned by the msg.sender
   */
  function burn(address _owner, uint256 _tokenId) public;
}
