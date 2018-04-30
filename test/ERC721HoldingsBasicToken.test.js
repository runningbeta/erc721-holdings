import shouldBehaveLikeERC721HoldingsBasicToken from './ERC721HoldingsBasicToken.behaviour';
import shouldMintAndBurnERC721HoldingsToken from './ERC721HoldingsMintBurn.behaviour';

const BigNumber = web3.BigNumber;
const ERC721BasicToken = artifacts.require('mocks/ERC721BasicTokenMock');
const ERC721HoldingsBasicToken = artifacts.require('mocks/ERC721HoldingsBasicTokenMock.sol');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC721HoldingsBasicToken', function (accounts) {
  beforeEach(async function () {
    this.avatars = await ERC721BasicToken.new({ from: accounts[0] });
    this.token = await ERC721HoldingsBasicToken.new(this.avatars.address, { from: accounts[0] });
  });

  shouldBehaveLikeERC721HoldingsBasicToken(accounts);
  shouldMintAndBurnERC721HoldingsToken(accounts);
});
