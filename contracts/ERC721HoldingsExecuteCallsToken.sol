pragma solidity ^0.4.23;

import "./ERC721HoldingsBasicToken.sol";

contract ERC721HoldingsExecuteCallsToken is ERC721HoldingsBasicToken {
  
  function approveAndCall(address _spender, uint256 _tokenId, bytes _data)
    public payable returns (bool) 
  {
    super.approve(_spender, _tokenId);

    // solium-disable-next-line security/no-call-value
    require(_spender.call.value(msg.value)(_data));

    return true;
  }

  // ERC721 doesn't implement transfer function

  function transferFromAndCall(
    address _from,
    uint256 _to,
    address _toOrigin,
    uint256 _tokenId,
    bytes _data
  )
    public payable returns (bool)
  {
    address _holderOwner = _ownerOf(_to, _toOrigin);
    require(_holderOwner != address(this));

    super.transferFrom(_from, _to, _toOrigin, _tokenId);

    // solium-disable-next-line security/no-call-value
    require(_holderOwner.call.value(msg.value)(_data));
    return true;
  }
}
