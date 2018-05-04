const Message = artifacts.require('mocks/MessageHelper.sol');

import assertRevert from './helpers/assertRevert';
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

export default function shouldExecuteCallsERC721HoldingsToken (accounts) {
  const firstTokenId = 1;
  const secondTokenId = 2;
  const unknownTokenId = 3;
  
  const firstAvatarId = 1;
  const secondAvatarId = 2;
  const thirdAvatarId = 3;
  
  const creator = accounts[0];
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  describe('like an execute calls ERC721HoldingsToken', function () {
    beforeEach(async function () {
      this.message = await Message.new({ from: creator });

      await this.avatars.mint(creator, firstAvatarId, { from: creator });
      await this.avatars.mint(this.message.contract.address, secondAvatarId, { from: creator });
      await this.avatars.mint(this.token.contract.address, thirdAvatarId, { from: creator });

      await this.token.mint(firstAvatarId, this.avatars.address, firstTokenId, { from: creator });
      await this.token.mint(firstAvatarId, this.avatars.address, secondTokenId, { from: creator });
    });

    describe('Test Execute Calls methods', function () { 
      it('should allow payment through approve', async function () {
          const extraData = this.message.contract.buyMessage.getData(
            web3.toHex(123456), 666, 'Transfer Done'
          );
  
          const transaction = await this.token.approveAndCall(
            this.message.contract.address, firstTokenId, extraData, { from: creator, value: 1 }
          );
  
          assert.equal(2, transaction.receipt.logs.length);
  
          const appproved = await this.token.getApproved(firstTokenId);
          this.message.contract.address.should.be.equal(appproved);

          const balance = await web3.eth.getBalance(this.message.contract.address);
          new BigNumber(1).should.be.bignumber.equal(balance);
        });
  
      it('should allow payment through transferFrom', async function () {
          const extraData = this.message.contract.buyMessage.getData(
            web3.toHex(123456), 666, 'Transfer Done'
          );
  
          await this.token.approve(accounts[1], firstTokenId, { from: creator });
  
          const appproved = await this.token.getApproved(firstTokenId);
          accounts[1].should.be.equal(appproved);
  
          const transaction = await this.token.transferFromAndCall(
            accounts[0], secondAvatarId, this.avatars.contract.address, firstTokenId, extraData, { from: accounts[1], value: 1 }
          );
  
          assert.equal(3, transaction.receipt.logs.length);
  
          const tokenBalance = await this.token.balanceOf(secondAvatarId, this.avatars.address);
          new BigNumber(1).should.be.bignumber.equal(tokenBalance);

          const ethBalance = await web3.eth.getBalance(this.message.contract.address);
          new BigNumber(1).should.be.bignumber.equal(ethBalance);
        });
  
      it('should revert funds of failure inside approve (with data)', async function () {
        // showMessage is not payable, so it fails when called with msg.value
        const extraData = this.message.contract.showMessage.getData(
          web3.toHex(123456), 666, 'Transfer Done'
        );
  
        await this.token.approveAndCall(
          this.message.contract.address, firstTokenId, extraData, { from: creator, value: 1 }
        ).should.be.rejectedWith('revert');
  
        // approval should not have gone through so approved address is still 0x0
        const appproved = await this.token.getApproved(firstTokenId);
        ZERO_ADDRESS.should.be.equal(appproved);

        const ethBalance = await web3.eth.getBalance(this.message.contract.address);
        new BigNumber(0).should.be.bignumber.equal(ethBalance);
      });
  
      it('should revert funds of failure inside transferFrom (with data)', async function () {
        // showMessage is not payable, so it fails when called with msg.value
        const extraData = this.message.contract.showMessage.getData(
          web3.toHex(123456), 666, 'Transfer Done'
        );
  
        await this.token.approve(accounts[1], firstTokenId, { from: creator });
  
        await this.token.transferFromAndCall(
          accounts[0], secondAvatarId, this.avatars.contract.address, firstTokenId, extraData, { from: accounts[1], value: 1 }
        ).should.be.rejectedWith('revert');;
  
        // transferFrom should not have gone through so approved address is still accounts[1]
        const appproved = await this.token.getApproved(firstTokenId);
        accounts[1].should.be.equal(appproved);
        
        const tokenBalance = await this.token.balanceOf(secondAvatarId, this.avatars.address);
        new BigNumber(0).should.be.bignumber.equal(tokenBalance);

        const ethBalance = await web3.eth.getBalance(this.message.contract.address);
        new BigNumber(0).should.be.bignumber.equal(ethBalance);
      });
  
      it('should return correct allowance after approve (with data) and show the event on receiver contract', async function () {
        const extraData = this.message.contract.showMessage.getData(
          web3.toHex(123456), 666, 'Transfer Done'
        );

        const transaction = await this.token.approveAndCall(
          this.message.contract.address, firstTokenId, extraData, { from: creator }
        );

        assert.equal(2, transaction.receipt.logs.length);

        const appproved = await this.token.getApproved(firstTokenId);
        this.message.contract.address.should.be.equal(appproved);
      });
  
      it('should return correct balances after transferFrom (with data) and show the event on receiver contract', async function () { 
        const extraData = this.message.contract.showMessage.getData(
          web3.toHex(123456), 666, 'Transfer Done'
        );

        await this.token.approve(accounts[1], firstTokenId, { from: accounts[0] });

        const appproved = await this.token.getApproved(firstTokenId);
        accounts[1].should.be.equal(appproved);

        const transaction = await this.token.transferFromAndCall(
          accounts[0], secondAvatarId, this.avatars.contract.address, firstTokenId, extraData, { from: accounts[1] }
        );

        assert.equal(3, transaction.receipt.logs.length);

        const tokenBalance = await this.token.balanceOf(secondAvatarId, this.avatars.address);
        new BigNumber(1).should.be.bignumber.equal(tokenBalance);
      });
  
      it('should fail inside approve (with data)', async function () {
        const extraData = this.message.contract.fail.getData();
  
        await this.token.approveAndCall(this.message.contract.address, firstTokenId, extraData)
          .should.be.rejectedWith('revert');
  
        // approval should not have gone through so approved is still ZERO_ADDRESS
        const appproved = await this.token.getApproved(firstTokenId);
        ZERO_ADDRESS.should.be.equal(appproved);
      });
  
      it('should fail inside transferFrom (with data)', async function () {
        const extraData = this.message.contract.fail.getData();
  
        await this.token.approve(accounts[1], firstAvatarId, { from: creator });
        await this.token.transferFromAndCall(creator, secondAvatarId, this.avatars.address, firstTokenId, extraData, { from: creator })
          .should.be.rejectedWith('revert');
  
        // transferFrom should have failed so balance is still 0 but approved is accounts[1]
        const appproved = await this.token.getApproved(firstTokenId);
        accounts[1].should.be.equal(appproved);

        const tokenBalance = await this.token.balanceOf(secondAvatarId, this.avatars.address);
        new BigNumber(0).should.be.bignumber.equal(tokenBalance);
      });
  
      it('should fail approve (with data) when using token contract address as receiver', async function () {
        const extraData = this.message.contract.showMessage.getData(
          web3.toHex(123456), 666, 'Transfer Done'
        );
  
        await this.token.approveAndCall(this.token.contract.address, firstAvatarId, extraData, { from: accounts[0] })
          .should.be.rejectedWith('revert');
      });
  
      it('should fail transferFrom (with data) when using token contract address as receiver', async function () {
        const extraData = this.message.contract.showMessage.getData(
          web3.toHex(123456), 666, 'Transfer Done'
        );
  
        await this.token.approve(accounts[1], firstTokenId, { from: accounts[0] });
  
        await this.token.transferFromAndCall(accounts[0], thirdAvatarId, this.avatars.address, firstTokenId, extraData, { from: accounts[1] })
          .should.be.rejectedWith('revert');
      });
    });
  });
};