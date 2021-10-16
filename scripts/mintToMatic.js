const hre = require("hardhat");

import nfts from './nfts'

const contractAddress = `0x337988fD73881472f06C9934517cd8DA3eb9644f`

//takes array of thunks
//thunks are functions that return promises
function mapSeries(arr) {
  if (!Array.isArray(arr)) throw new Error('mapSeries requires an Array');
  const length = arr.length;
  const results = new Array(length);
  
  return arr.reduce((chain, item, i) => {
    return chain.then(item).then(val => results[i] = val);
  }, Promise.resolve())
  .then(() => results)
}

function thunkify(nft) {
  return async () => {
    const [owner] = await hre.ethers.getSigners();
    const NFTContract = await hre.ethers.getContractAt("MyNFT", contractAddress);
    const tx = await NFTContract.mint(owner.address, nft.cid);
    const receipt = await tx.wait();
    console.log('Transaction mined: ', nft.name);
  }
}

async function main() {
  const thunks = nfts.map((nft) => thunkify(nft))
  await mapSeries(thunks); //do the transactions serially to avoid `replacement fee too low` error
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });


