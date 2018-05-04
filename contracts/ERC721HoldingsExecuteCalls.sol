pragma solidity ^0.4.23;

import "./ERC721HoldingsBasic.sol";

contract ERC721HoldingsExecuteCalls is ERC721HoldingsBasic {
  function approveAndCall(
    address _spender,
    uint256 _tokenId,
    bytes _data
  ) public payable returns (bool);

  function transferFromAndCall(
    address _from,
    uint256 _to,
    address _toOrigin,
    uint256 _tokenId,
    bytes _data
  ) public payable returns (bool);
}