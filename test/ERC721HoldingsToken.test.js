import shouldBehaveLikeERC721HoldingsToken from './ERC721HoldingsToken.behaviour';
import shouldMintAndBurnERC721HoldingsToken from './ERC721HoldingsMintBurn.behaviour';
import shouldExecuteCallsERC721HoldingsToken from './ERC721HoldingsExecuteCalls.behaviour';

const BigNumber = web3.BigNumber;
const ERC721BasicToken = artifacts.require('mocks/ERC721BasicTokenMock');
const ERC721HoldingsToken = artifacts.require('mocks/ERC721HoldingsTokenMock.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721HoldingsToken', function (accounts) {
  beforeEach(async function () {
    this.avatars = await ERC721BasicToken.new({ from: accounts[0] });
    this.token = await ERC721HoldingsToken.new(this.avatars.address, { from: accounts[0] });
  });

  shouldBehaveLikeERC721HoldingsToken(accounts);
  shouldMintAndBurnERC721HoldingsToken(accounts);
  shouldExecuteCallsERC721HoldingsToken(accounts);
});
