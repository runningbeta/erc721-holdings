import assertRevert from './helpers/assertRevert';
import sendTransaction from './helpers/sendTransaction';
import _ from 'lodash';

const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

export default function shouldBehaveLikeERC721HoldingsBasicToken (accounts) {
  const firstTokenId = 1;
  const secondTokenId = 2;
  const unknownTokenId = 3;
  
  const firstAvatarId = 1;
  const secondAvatarId = 2;

  const creator = accounts[0];
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  describe('like a ERC721HoldingsBasicToken', function () {
    beforeEach(async function () {
      await this.avatars.mint(creator, firstAvatarId, { from: creator });
      await this.avatars.mint(creator, secondAvatarId, { from: creator });

      await this.token.mint(firstAvatarId, this.avatars.address, firstTokenId, { from: creator });
      await this.token.mint(firstAvatarId, this.avatars.address, secondTokenId, { from: creator });
    });

    describe('balanceOf', function () {
      describe('when the given address owns some tokens', function () {
        it('returns the amount of tokens owned by the given address', async function () {
          const balance = await this.token.balanceOf(firstAvatarId, this.avatars.address);
          balance.should.be.bignumber.equal(2);
        });
      });

      describe('when the given address does not own any tokens', function () {
        it('returns 0', async function () {
          const balance = await this.token.balanceOf(secondAvatarId, this.avatars.address);
          balance.should.be.bignumber.equal(0);
        });
      });

      describe('when querying the holder from zero address', function () {
        it('throws', async function () {
          await assertRevert(this.token.balanceOf(firstAvatarId, ZERO_ADDRESS));
        });
      });
    });

    describe('exists', function () {
      describe('when the token exists', function () {
        const tokenId = firstTokenId;

        it('should return true', async function () {
          const result = await this.token.exists(tokenId);
          result.should.be.true;
        });
      });

      describe('when the token does not exist', function () {
        const tokenId = unknownTokenId;

        it('should return false', async function () {
          const result = await this.token.exists(tokenId);
          result.should.be.false;
        });
      });
    });

    describe('ownerOf', function () {
      describe('when the given token ID was tracked by this token', function () {
        const tokenId = firstTokenId;

        it('returns the holder of the given token ID', async function () {
          let holderId;
          let holderOrigin;
          [holderId, holderOrigin] = await this.token.holderOf(tokenId);
          holderId.should.be.bignumber.equal(firstAvatarId);
          holderOrigin.should.be.equal(this.avatars.address);
        });
      });

      describe('when the given token ID was not tracked by this token', function () {
        const tokenId = unknownTokenId;

        it('reverts', async function () {
          await assertRevert(this.token.holderOf(tokenId));
        });
      });
    });

    describe('transfers', function () {
      const owner = accounts[0];
      const approved = accounts[2];
      const operator = accounts[3];
      const unauthorized = accounts[4];
      const tokenId = firstTokenId;
      
      let logs = null;

      beforeEach(async function () {
        this.to = secondAvatarId;
        await this.token.approve(approved, tokenId, { from: owner });
        await this.token.setApprovalForAll(operator, true, { from: owner });
      });

      const transferWasSuccessful = function ({ owner, tokenId, approved }) {
        it('transfers the holdership of the given token ID to the given holder', async function () {
          let newHolderId;
          let newHolderOrigin;
          [newHolderId, newHolderOrigin] = await this.token.holderOf(tokenId);
          newHolderId.should.be.bignumber.equal(this.to);
          newHolderOrigin.should.be.equal(this.avatars.address);
        });

        it('clears the approval for the token ID', async function () {
          const approvedAccount = await this.token.getApproved(tokenId);
          approvedAccount.should.be.equal(ZERO_ADDRESS);
        });

        if (approved) {
          it('emits an approval and transfer events', async function () {
            logs.length.should.be.equal(2);
            logs[0].event.should.be.eq('Approval');
            logs[0].args._owner.should.be.equal(owner);
            logs[0].args._approved.should.be.equal(ZERO_ADDRESS);
            logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
  
            logs[1].event.should.be.eq('Transfer');
            logs[1].args._from.should.be.bignumber.equal(firstAvatarId);
            logs[1].args._fromOrigin.should.be.equal(this.avatars.address);
            logs[1].args._to.should.be.bignumber.equal(this.to);
            logs[1].args._toOrigin.should.be.equal(this.avatars.address);
            logs[1].args._tokenId.should.be.bignumber.equal(tokenId);
          });
        } else {
          it('emits only a transfer event', async function () {
            logs.length.should.be.equal(1);
            logs[0].event.should.be.eq('Transfer');
            logs[0].args._from.should.bignumber.be.equal(firstAvatarId);
            logs[0].args._fromOrigin.should.be.equal(this.avatars.address);
            logs[0].args._to.should.be.bignumber.equal(this.to);
            logs[0].args._toOrigin.should.be.equal(this.avatars.address);
            logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
          });
        }

        it('adjusts holders balances', async function () {
          const newOwnerBalance = await this.token.balanceOf(this.to, this.avatars.address);
          newOwnerBalance.should.be.bignumber.equal(1);

          const previousOwnerBalance = await this.token.balanceOf(firstAvatarId, this.avatars.address);
          previousOwnerBalance.should.be.bignumber.equal(1);
        });
      };

      const shouldTransferTokensByUsers = function (transferFunction) {
        describe('when called by the owner', function () {
          beforeEach(async function () {
            ({ logs } = await transferFunction.call(this, owner, this.to, this.avatars.address, tokenId, { from: owner }));
          });
          transferWasSuccessful({ owner, tokenId, approved });
        });

        describe('when called by the approved individual', function () {
          beforeEach(async function () {
            ({ logs } = await transferFunction.call(this, owner, this.to, this.avatars.address, tokenId, { from: approved }));
          });
          transferWasSuccessful({ owner, tokenId, approved });
        });

        describe('when called by the operator', function () {
          beforeEach(async function () {
            ({ logs } = await transferFunction.call(this, owner, this.to, this.avatars.address, tokenId, { from: operator }));
          });
          transferWasSuccessful({ owner, tokenId, approved });
        });

        describe('when called by the owner without an approved user', function () {
          beforeEach(async function () {
            await this.token.approve(ZERO_ADDRESS, tokenId, { from: owner });
            ({ logs } = await transferFunction.call(this, owner, this.to, this.avatars.address, tokenId, { from: operator }));
          });
          transferWasSuccessful({ owner, tokenId, approved: null });
        });

        describe('when sent to the same holder', function () {
          beforeEach(async function () {
            ({ logs } = await transferFunction.call(this, owner, firstAvatarId, this.avatars.address, tokenId, { from: owner }));
          });

          it('keeps holdership of the token', async function () {
            let newHolderId;
            let newHolderOrigin;
            [newHolderId, newHolderOrigin] = await this.token.holderOf(tokenId);
            newHolderId.should.be.bignumber.equal(firstAvatarId);
            newHolderOrigin.should.be.equal(this.avatars.address);
          });
  
          it('clears the approval for the token ID', async function () {
            const approvedAccount = await this.token.getApproved(tokenId);
            approvedAccount.should.be.equal(ZERO_ADDRESS);
          });
  
          it('emits an approval and transfer events', async function () {
            logs.length.should.be.equal(2);
            
            logs[0].event.should.be.eq('Approval');
            logs[0].args._owner.should.be.equal(owner);
            logs[0].args._approved.should.be.equal(ZERO_ADDRESS);
            logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
  
            logs[1].event.should.be.eq('Transfer');
            logs[1].args._from.should.be.bignumber.equal(firstAvatarId);
            logs[1].args._fromOrigin.should.be.equal(this.avatars.address);
            logs[1].args._to.should.be.bignumber.equal(firstAvatarId);
            logs[1].args._toOrigin.should.be.equal(this.avatars.address);
            logs[1].args._tokenId.should.be.bignumber.equal(tokenId);
          });
  
          it('keeps the owner balance', async function () {
            const ownerBalance = await this.token.balanceOf(firstAvatarId, this.avatars.address);
            ownerBalance.should.be.bignumber.equal(2);
          });
        });
        
        describe('when the address of the previous owner is incorrect', function () {
          it('reverts', async function () {
            await assertRevert(transferFunction.call(this, unauthorized, this.to, this.avatars.address, tokenId, { from: owner }));
          });
        });

        describe('when the sender is not authorized for the token id', function () {
          it('reverts', async function () {
            await assertRevert(transferFunction.call(this, owner, this.to, this.avatars.address, tokenId, { from: unauthorized }));
          });
        });

        describe('when the given token ID does not exist', function () {
          it('reverts', async function () {
            await assertRevert(transferFunction.call(this, owner, this.to, this.avatars.address, unknownTokenId, { from: owner }));
          });
        });

        describe('when the address to transfer the token to is the zero address', function () {
          it('reverts', async function () {
            await assertRevert(transferFunction.call(this, owner, 0, ZERO_ADDRESS, tokenId, { from: owner }));
          });
        });
      };

      describe('via transferFrom', function () {
        shouldTransferTokensByUsers(function (from, to, address, tokenId, opts) {
          return this.token.transferFrom(from, to, address, tokenId, opts);
        });
      });
    });

    describe('approve', function () {
      const tokenId = firstTokenId;
      const sender = creator;
      const to = accounts[1];

      let logs = null;

      const itClearsApproval = function () {
        it('clears approval for the token', async function () {
          const approvedAccount = await this.token.getApproved(tokenId);
          approvedAccount.should.be.equal(ZERO_ADDRESS);
        });
      };

      const itApproves = function (address) {
        it('sets the approval for the target address', async function () {
          const approvedAccount = await this.token.getApproved(tokenId);
          approvedAccount.should.be.equal(address);
        });
      };

      const itEmitsApprovalEvent = function (address) {
        it('emits an approval event', async function () {
          logs.length.should.be.equal(1);
          logs[0].event.should.be.eq('Approval');
          logs[0].args._owner.should.be.equal(sender);
          logs[0].args._approved.should.be.equal(address);
          logs[0].args._tokenId.should.be.bignumber.equal(tokenId);
        });
      };
      
      describe('when clearing approval', function () {
        describe('when there was no prior approval', function () {
          beforeEach(async function () {
            ({ logs } = await this.token.approve(ZERO_ADDRESS, tokenId, { from: sender }));
          });

          itClearsApproval();

          it('does not emit an approval event', async function () {
            logs.length.should.be.equal(0);
          });
        });
    
        describe('when there was a prior approval', function () {
          beforeEach(async function () {
            await this.token.approve(to, tokenId, { from: sender });
            ({ logs } = await this.token.approve(ZERO_ADDRESS, tokenId, { from: sender }));
          });

          itClearsApproval();
          itEmitsApprovalEvent(ZERO_ADDRESS);
        });
      });

      describe('when approving a non-zero address', function () {
        describe('when there was no prior approval', function () {
          beforeEach(async function () {
            ({ logs } = await this.token.approve(to, tokenId, { from: sender }));
          });

          itApproves(to);
          itEmitsApprovalEvent(to);
        });

        describe('when there was a prior approval to the same address', function () {
          beforeEach(async function () {
            await this.token.approve(to, tokenId, { from: sender });
            ({ logs } = await this.token.approve(to, tokenId, { from: sender }));
          });

          itApproves(to);
          itEmitsApprovalEvent(to);
        });

        describe('when there was a prior approval to a different address', function () {
          beforeEach(async function () {
            await this.token.approve(accounts[2], tokenId, { from: sender });
            ({ logs } = await this.token.approve(to, tokenId, { from: sender }));
          });

          itApproves(to);
          itEmitsApprovalEvent(to);
        });
      });

      describe('when the address that receives the approval is the owner', function () {
        it('reverts', async function () {
          await assertRevert(this.token.approve(sender, tokenId, { from: sender }));
        });
      });
      
      describe('when the sender does not own the given token ID', function () {
        it('reverts', async function () {
          await assertRevert(this.token.approve(to, tokenId, { from: accounts[2] }));
        });
      });

      describe('when the sender is approved for the given token ID', function () {
        it('reverts', async function () {
          await this.token.approve(accounts[2], tokenId, { from: sender });
          await assertRevert(this.token.approve(to, tokenId, { from: accounts[2] }));
        });
      });

      describe('when the sender is an operator', function () {
        const operator = accounts[2];
        beforeEach(async function () {
          await this.token.setApprovalForAll(operator, true, { from: sender });
          ({ logs } = await this.token.approve(to, tokenId, { from: operator }));
        });

        itApproves(to);
        itEmitsApprovalEvent(to);
      });

      describe('when the given token ID does not exist', function () {
        it('reverts', async function () {
          await assertRevert(this.token.approve(to, unknownTokenId, { from: sender }));
        });
      });
    });

    describe('setApprovalForAll', function () {
      const sender = creator;

      describe('when the operator willing to approve is not the owner', function () {
        const operator = accounts[1];

        describe('when there is no operator approval set by the sender', function () {
          it('approves the operator', async function () {
            await this.token.setApprovalForAll(operator, true, { from: sender });

            const isApproved = await this.token.isApprovedForAll(sender, operator);
            isApproved.should.be.true;
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.setApprovalForAll(operator, true, { from: sender });

            logs.length.should.be.equal(1);
            logs[0].event.should.be.eq('ApprovalForAll');
            logs[0].args._owner.should.be.equal(sender);
            logs[0].args._operator.should.be.equal(operator);
            logs[0].args._approved.should.be.true;
          });
        });

        describe('when the operator was set as not approved', function () {
          beforeEach(async function () {
            await this.token.setApprovalForAll(operator, false, { from: sender });
          });

          it('approves the operator', async function () {
            await this.token.setApprovalForAll(operator, true, { from: sender });

            const isApproved = await this.token.isApprovedForAll(sender, operator);
            isApproved.should.be.true;
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.setApprovalForAll(operator, true, { from: sender });

            logs.length.should.be.equal(1);
            logs[0].event.should.be.eq('ApprovalForAll');
            logs[0].args._owner.should.be.equal(sender);
            logs[0].args._operator.should.be.equal(operator);
            logs[0].args._approved.should.be.true;
          });

          it('can unset the operator approval', async function () {
            await this.token.setApprovalForAll(operator, false, { from: sender });

            const isApproved = await this.token.isApprovedForAll(sender, operator);
            isApproved.should.be.false;
          });
        });

        describe('when the operator was already approved', function () {
          beforeEach(async function () {
            await this.token.setApprovalForAll(operator, true, { from: sender });
          });

          it('keeps the approval to the given address', async function () {
            await this.token.setApprovalForAll(operator, true, { from: sender });

            const isApproved = await this.token.isApprovedForAll(sender, operator);
            isApproved.should.be.true;
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.setApprovalForAll(operator, true, { from: sender });

            logs.length.should.be.equal(1);
            logs[0].event.should.be.eq('ApprovalForAll');
            logs[0].args._owner.should.be.equal(sender);
            logs[0].args._operator.should.be.equal(operator);
            logs[0].args._approved.should.be.true;
          });
        });
      });

      describe('when the operator is the owner', function () {
        const operator = creator;

        it('reverts', async function () {
          await assertRevert(this.token.setApprovalForAll(operator, true, { from: sender }));
        });
      });
    });
  });
};
