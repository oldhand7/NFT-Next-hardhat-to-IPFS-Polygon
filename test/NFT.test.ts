import { expect } from 'chai';
import { ethers } from 'hardhat'
import { Contract } from 'ethers'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import nfts from '../scripts/nfts'

//describe's callback cant be an async function
describe('Token', function() {
  let NFTContractFactory;
  let NFTContract: Contract;
  let owner: SignerWithAddress,
  addr1: SignerWithAddress,
  addr2: SignerWithAddress,
  addrs;


  beforeEach(async () => {
    [owner, addr1, addr2, addrs] = await ethers.getSigners();
    NFTContractFactory = await ethers.getContractFactory("MyNFT");
    NFTContract = await NFTContractFactory.deploy();
    await NFTContract.deployed();

    console.log("Contract deployed to:", NFTContract.address);

    const promises = nfts.map( async (nft) => {
      console.log('Minting: ', nft.name, nft.cid);
      await NFTContract.mint(owner.address, nft.cid);
    })

    await Promise.all(promises);
  })

  it("Should get the balance of the owner", async function() { 
    const bal = await NFTContract.balanceOf(owner.address);
    expect(bal).to.be.eq(13);
  })

  it("Transfer NFT to an address", async function() {
      //Transfer
      const tokenId = 1;
      await NFTContract.transferFrom(owner.address, addr1.address, tokenId);
      const bal = await NFTContract.balanceOf(addr1.address);
      expect(bal).to.be.eq(1);
  })

  it("Should emit Transfer event", async () => {
    const tokenId = 1;
    expect(NFTContract.transferFrom(owner.address, addr1.address, tokenId))
    .to.emit(NFTContract, "Transfer")
    .withArgs(owner.address, addr1.address, tokenId);
  })

})