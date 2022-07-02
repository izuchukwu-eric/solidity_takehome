const { expect } = require("chai");
const { ethers } = require("hardhat");
const { waffle } = require("hardhat");
import { ERC20 } from "../typechain/ERC20";
import { ERC20__factory } from "../typechain/factories/ERC20__factory";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const  { provider }  = waffle;

describe("erc20", function () {
  let token: ERC20;
  const [] = provider.getWallets();
  let signers: SignerWithAddress[];

  before(async function () {
    signers = await ethers.getSigners();
    const deployer = new ERC20__factory(signers[0]);
    token = await deployer.deploy("token", "TKN");
    await token.mint(signers[0].address, ethers.utils.parseEther("100"));
  });
  

  describe("transfer functionality", async () => {

    it("transfers successfully", async () => {
      await token.transfer(signers[1].address, ethers.utils.parseEther("5"));
      expect(await token.balanceOf(signers[0].address)).to.be.eq(
        ethers.utils.parseEther("95")
      );
      expect(await token.balanceOf(signers[1].address)).to.be.eq(
        ethers.utils.parseEther("5")
      );
    });

    it("does not transfer more than balance", async () => {
      const tx = token.transfer(
        signers[1].address,
        ethers.utils.parseEther("500")
      );
      await expect(tx).to.be.revertedWith("ERC20: insufficient-balance");
    });
    
  });

  describe("approve functionality", async () => {

    it("approves successfully", async () => {

      //signer[0] approves signer[1] to spend 5 ether on his behalf
      await token.connect(signers[0]).approve(signers[1].address, ethers.utils.parseEther("5"));
      expect(await token.allowance(signers[0].address, signers[1].address)).to.be.eq(
        ethers.utils.parseEther("5")
      );
    })


    it("allows the approved account to transfer the token", async () => {
      const tokenToTransfer = ethers.utils.parseEther("5");
      const recipientAddress = signers[2].address;

      //make sure there is money in the original account (signer[0]) before transfer
      const balanceOfOriginalAccount = await token.balanceOf(signers[0].address);
      expect(balanceOfOriginalAccount).to.be.above("5")

      //tranfer the token
      await token.connect(signers[1]).transferFrom(signers[0].address, recipientAddress, tokenToTransfer);

      //check the balance of the original account after transfer
      expect(await token.balanceOf(signers[0].address)).to.be.eq(
        balanceOfOriginalAccount.sub(tokenToTransfer)
      )

      //check the balance of the reciever after transfer
      const balanceOfReciever = await token.balanceOf(recipientAddress);
      expect(balanceOfReciever.toString()).to.be.eq(
        tokenToTransfer.toString()
      )
    })


    it("does not transfer more than balance", async () => {
      const recipientAddress = signers[2].address;

      /** remember we spent 5 ether from signer[0], so we should be left with 90 ether. 
       * therefore if we try to spend more than 90, it should be reverted.
      */
      const tx = token.connect(signers[1]).transferFrom(
        signers[0].address,
        recipientAddress,
        ethers.utils.parseEther("95")
      );
      await expect(tx).to.be.revertedWith("ERC20: insufficient-balance");
    });
  })


  describe("TransferFrom functionality", async () => {

    it("transfers token form a spenders address to recipient", async () => {
      const spendersAddress = signers[0].address;
      const recipientsAddress = signers[3].address;
      const tokenToTransfer = ethers.utils.parseEther("5")

      //make sure there is money in the spenders account (signer[0]) before transfer
      const balanceOfSpender = await token.balanceOf(spendersAddress);
      expect(balanceOfSpender).to.be.above(tokenToTransfer);

      await token.connect(signers[0]).transferFrom(
        spendersAddress,
        recipientsAddress,
        tokenToTransfer
      )

      //check the balance of the spender after transfer
      expect(await token.balanceOf(spendersAddress)).to.be.eq(
        balanceOfSpender.sub(tokenToTransfer)
      )

      //check the balance of the recepient after transfer
      expect(await token.balanceOf(recipientsAddress)).to.be.eq(
        ethers.utils.parseEther("5")
      )

    })


    it("does not transfer more than balance", async () => {
      const spendersAddress = signers[0].address;
      const recipientAddress = signers[3].address;

      /**we spent another 5 ether from signer[0], so we should be left with 85 ether. 
       * therefore if we try to spend more than 85, it should be reverted.
      */
      const tx = token.connect(signers[0]).transferFrom(
        spendersAddress,
        recipientAddress,
        ethers.utils.parseEther("90")
      );
      await expect(tx).to.be.revertedWith("ERC20: insufficient-balance");
    });
  })
});
