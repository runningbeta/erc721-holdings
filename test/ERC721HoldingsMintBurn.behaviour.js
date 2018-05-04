import assertRevert from './helpers/assertRevert';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

export default function shouldMintAndBurnERC721HoldingsToken (accounts) {
  const firstTokenId = 1;
  const secondTokenId = 2;
  const unknownTokenId = 3;
  
  const firstAvatarId = 1;
  const secondAvatarId = 2;
  
  const creator = accounts[0];
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  describe('like a mintable and burnable ERC721HoldingsToken', function () {
    beforeEach(async function () {
      await this.avatars.mint(creator, firstAvatarId, { from: creator });
      await this.avatars.mint(creator, secondAvatarId, { from: creator });

      await this.token.mint(firstAvatarId, this.avatars.address, firstTokenId, { from: creator });
      await this.token.mint(firstAvatarId, this.avatars.address, secondTokenId, { from: creator });
    });

    describe('mint', function () {
      const to = secondAvatarId;
      const tokenId = unknownTokenId;
      let logs = null;
      
      describe('when successful', function () {
        beforeEach(async function () {
          const result = await this.token.mint(to, this.avatars.address, tokenId);
          logs = result.logs;
        });

        it('assigns the token to the new holder', async function () {
          let holderId;
          let holderOrigin;
          [holderId, holderOrigin] = await this.token.holderOf(tokenId);
          holderId.should.be.bignumber.equal(to);
          holderOrigin.should.be.equal(this.avatars.address);
        });

        it('increases the balance of its owner', async function () {
          const balance = await this.token.balanceOf(to, this.avatars.address);
          balance.should.be.bignumber.equal(1);
        });

        it('emits a transfer event', async function () {
          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('Transfer');
          logs[0].args._from.should.bignumber.be.equal(0);
          logs[0].args._fromOrigin.should.be.equal(ZERO_ADDRESS);
          logs[0].args._to.should.be.bignumber.equal(to);
          logs[0].args._toOrigin.should.be.equal(this.avatars.address);
          logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
        });
      });

      describe('when the given holder origin address is the zero address', function () {
        it('reverts', async function () {
          await assertRevert(this.token.mint(to, ZERO_ADDRESS, tokenId));
        });
      });

      describe('when the given token ID was already tracked by this contract', function () {
        it('reverts', async function () {
          await assertRevert(this.token.mint(to, this.avatars.address, firstTokenId));
        });
      });
    });

    describe('burn', function () {
      const tokenId = firstTokenId;
      const sender = creator;
      let logs = null;

      describe('when successful', function () {
        beforeEach(async function () {
          const result = await this.token.burn(sender, tokenId, { from: sender });
          logs = result.logs;
        });

        it('burns the given token ID and adjusts the balance of the owner', async function () {
          await assertRevert(this.token.holderOf(tokenId));
          const balance = await this.token.balanceOf(firstAvatarId, this.avatars.address);
          balance.should.be.bignumber.equal(1);
        });

        it('emits a burn event', async function () {
          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('Transfer');
          logs[0].args._from.should.be.bignumber.equal(firstAvatarId);
          logs[0].args._fromOrigin.should.be.equal(this.avatars.address);
          logs[0].args._to.should.be.bignumber.equal(0);
          logs[0].args._toOrigin.should.be.equal(ZERO_ADDRESS);
          logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
        });
      });

      describe('when there is a previous approval', function () {
        beforeEach(async function () {
          await this.token.approve(accounts[1], tokenId, { from: sender });
          const result = await this.token.burn(sender, tokenId, { from: sender });
          logs = result.logs;
        });

        it('clears the approval', async function () {
          const approvedAccount = await this.token.getApproved(tokenId);
          approvedAccount.should.be.equal(ZERO_ADDRESS);
        });

        it('emits an approval event', async function () {
          logs.length.should.be.equal(2);

          logs[0].event.should.be.eq('Approval');
          logs[0].args._owner.should.be.equal(sender);
          logs[0].args._approved.should.be.equal(ZERO_ADDRESS);
          logs[0].args._tokenId.should.be.bignumber.equal(tokenId);

          logs[1].event.should.be.eq('Transfer');
        });
      });

      describe('when the given token ID was not tracked by this contract', function () {
        it('reverts', async function () {
          await assertRevert(this.token.burn(creator, unknownTokenId, { from: creator }));
        });
      });
    });
  });
};