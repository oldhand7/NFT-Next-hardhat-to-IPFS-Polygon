# NFT-hardhat-IPFS-Polygon
A tiny NFT platform using hardhat, IPFS, and react deployed to polygon network

![alt text](https://ranadeepb.com/assets/nft/index.png "ERC-721 NFT")

We will learn how to create your own NFT contract, mint tokens, deploy it to polygon network and deploy the react frontend to vercel. 

> Code is available at [Github](https://github.com/ranadeep47/NFT-hardhat-IPFS-Polygon), demo at [https://nft-hardhat-ipfs-polygon.vercel.app](https://nft-hardhat-ipfs-polygon.vercel.app/)

This project uses open-zeppelin for smart contracts, hardhat, ethers for interacting with blockchain and waffle for writing tests and typescript, react for frontend, for UI we will use a UI library called baseweb to get us started quickly.

The whole process is broken down into
1. Setup
2. Writing code
3. Upload images and metadata to IPFS using Pinata
4. Testing with hardhat local blockchain
5. Deploying contract to Polygon testnet
6. Deploying the frotend to vercel

## 1. Setup
Run `npm init` and initialise your your package.json

hardhat & waffle: `npm install --save-dev @nomiclabs/hardhat-ethers @nomiclabs/hardhat-waffle hardhat ethers ethereum-waffle chai`

TypeScript: `npm install --save-dev typescript ts-node @types/react @types/node @types/mocha`
Typechain: `npm install --save-dev ts-generator typechain @typechain/ethers-v5 @typechain/hardhat`

`npm install --force --save-dev hardhat-typechain`, we use force because theres an issue with version conflicts with typechain

Baseweb:
`npm install --save baseui styletron-react styletron-engine-atomic`

Others: `npm install --save-dev dotenv axios web3modal` 

React: `npm install --save react react-dom react-scripts`

SmartContracts: `npm install --save @openzeppelin/contracts`

After installing all the above dependencies setup your `hardhat.config.ts` by running `npx hardhat`. I'd suggest you copy hardhat and typescript configs from the code's [github repo](https://github.com/ranadeep47/NFT-hardhat-IPFS-Polygon) to get started quickly

---

## 2. Code

Token.sol in /contracts/ folder
```solidity
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, Ownable, ERC721Enumerable {
  using Counters for Counters.Counter;
  using Strings for uint256;
  Counters.Counter private _tokenIds;
  mapping (uint256 => string) private _tokenURIs;
  
  constructor() ERC721("MyNFT", "MNFT") {}

  function _setTokenURI(uint256 tokenId, string memory _tokenURI)
    internal
    virtual
  {
    _tokenURIs[tokenId] = _tokenURI;
  }
  
  function _beforeTokenTransfer(address from, address to, uint256 tokenId)
      internal
      override(ERC721, ERC721Enumerable)
  {
      super._beforeTokenTransfer(from, to, tokenId);
  }
    
    
  function supportsInterface(bytes4 interfaceId)
      public
      view
      override(ERC721, ERC721Enumerable)
      returns (bool)
  {
      return super.supportsInterface(interfaceId);
  }

  function tokenURI(uint256 tokenId) 
    public
    view
    virtual
    override
    returns (string memory)
  {
    require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
    string memory _tokenURI = _tokenURIs[tokenId];
    return _tokenURI;
  }

  function mint(address recipient, string memory uri)
    public
    returns (uint256)
  {
    _tokenIds.increment();
    uint256 newItemId = _tokenIds.current();
    _mint(recipient, newItemId);
    _setTokenURI(newItemId, uri);
    return newItemId;
  }
}

```
This is our contract which extends open-zeppelin's `ERC721, Ownable, ERC721Enumerable` contracts which implement important functions like `_mint` which helps with minting tokens and generating tokenIds. We use ERC721Enumerable because to list all the NFT's owned by a user, to enumerate token ids by address we need a special function called `tokenOfOwnerByIndex` which is implemented by it. Our mint function also calls _setTokenURI to assign a token URI to a given token id. We will see what goes inside this token URI in the following section. 

Now run `npx hardhat compile`, this step will generate our typechain types for our contracts and compile the solidity smart contract and create solidity ABI's in a folder `src/artifacts` which we will import in our react code to interact with our contract 

You should find them here `/artifacts/contracts/MyNFT.sol/MyNFT.json`

Frontend code to interact with our contract 
``` javascript
import Token from './artifacts/contracts/MyNFT.sol/MyNFT.json';
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
...

const tokenAddress = "" //hardcode your contract address for convience of this tutorial

function App(props) {
  const [css, theme] = useStyletron();
  const [contract, setContract] = useState(null);
  const [collectibles, setCollectibles] = useState([]);
  const [account, setAccount] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [showLoader, setShowLoader] = useState(true);

  async function onConnect(provider) {
    if(contract) contract.removeAllListeners();
    await initialise(provider);
  }

  async function initialise(provider) {
    const signer = provider.getSigner();
    const account = await signer.getAddress();
    setAccount(account);
    const contract = new ethers.Contract(contractAddress, Token.abi, provider);
    const contractWithSigner = contract.connect(signer);
    setContract(contractWithSigner);
    const balance = await contract.balanceOf(account);
    setShowLoader(true);
    const data = [];
    for(var i=0; i<balance.toNumber(); ++i) {
      let tokenId = await contract.tokenOfOwnerByIndex(account, i);
      let tokenURI = await contract.tokenURI(tokenId);    
      data.push({tokenId, tokenURI});
    }
    setCollectibles(data);
    setShowLoader(false);
    const startBlockNumber = await provider.getBlockNumber();
    contract.on('Transfer', (from, to, tokenId, event) => {
      if(event.blockNumber <= startBlockNumber) return; //this line is needed to prevent past event of the same block to be fired
      const message = `NFT with token id ${tokenId} is transferred to ${to}`
      setEventData({message});
      //Refresh data
    })
  }

  async function onTransfer(transferTo, tokenId) {
    console.log('Transferring to :', transferTo, tokenId.toNumber());
    contract.transferFrom(account, transferTo, tokenId);
  }

  return (
    <div className="App">
      <Container>    
        <ConnectHeader onConnected={onConnect}/>  
        { account ? (
            <>
              <h1>My NFT Collectibles</h1>
              { showLoader ?
                <div className={css({display: "flex", justifyContent: "center"})}>
                  <Spinner />
                  <h3>Loading tokens..</h3>
                </div> :
                <Collectibles data={collectibles} onTransfer={onTransfer}/>
              }
            </>
        ) : (
          <div className={css({display: "flex", justifyContent: "center", alignItems: "center", flex: "1"})}>
            <h1>Connect to a wallet</h1>
          </div>
        ) }    
      <SnackbarProvider>
        <Event data={eventData}/>
      </SnackbarProvider>
      </Container>
    </div>
  );
}

export default App;
```
In our react code, we are importing the contract ABI, connecting to the metamask's network which is injected into the browser as `window.ethereum`. We use ethers.js library to connect to metamask. The `provider` contains network info and `signer` contains the user's account info like address. 

We connect to the contract using `const contract = new ethers.Contract(tokenAddress, Token.abi, provider);` and run methods on the contract to perform various actions like transferring, approving tokens and checking balance. Check the code in [App.tsx](https://github.com/ranadeep47/NFT-hardhat-IPFS-Polygon/blob/main/src/App.tsx) to see how functions like `transfer` are implemented.

---

## 3. Upload images and metadata to IPFS using Pinata
Blockchains arent suitable for storing heavy images, so we need a decentralised storage service like IPFS to store our resources and somehow link them to our unique tokenids in our contract. We use a service called Pinata which helps us pin storage items on IPFS network, sign up to Pinata and upload two folders, one for our images and other containing json metadata files. 

![alt text](https://ranadeepb.com/assets/nft/pinata.png "Uploading to pinata")

A typical json metadata is created to store the IPFS CID thats generated by Pinata as the metadata for our image. It has the following signature

```
{
    "name": "Butterfly", 
    "description": "A Majestic Butterfly", 
    "image": "ipfs://QmZh4d8jmqwFt965GYnZRjdjfZninNfFqjXGHmDTBx1DMc/butterfly.jpeg"
  }
```
The image field is necessary and it has the CID thats given to us by Pinata. Notice we are not storing the entire http url instead only the CID generated by Pinata since the url of the image can vary dynamically depending on which IPFS node youre being connected to. We can request an IPFS resource just with the CID, so this will suffice. Generate all the metadata files for each image that we uploaded and upload all these json files too to Pinata. 


## 4. Deploy and test in local hardhat node
Open a new terminal window and run `npx hardhat node` to run hardhat's local network, this command also generates 20 usable public-private key pairs of which the first pair is used to deploy our contract.

![alt text](https://ranadeepb.com/assets/erc20/local-hardhat-node.png "Starting local hardhat node")

Now create a file called nfts.js and place all the nft's with their JSON metadata's CID thats obtained from pinata after uploading the json files.

```javascript
const nfts = [
    {name: "Butterfly", cid: "QmXUSSgzCQUNezLpo9Xn8TSmgkPqL3SgT8RpfyyNjGgimN/butterfly.json"},
    {name: "Cock", cid: "QmXUSSgzCQUNezLpo9Xn8TSmgkPqL3SgT8RpfyyNjGgimN/cock.json"},
    {name: "Cow", cid: "QmXUSSgzCQUNezLpo9Xn8TSmgkPqL3SgT8RpfyyNjGgimN/cow.json"},
    {name: "Panda", cid: "QmXUSSgzCQUNezLpo9Xn8TSmgkPqL3SgT8RpfyyNjGgimN/panda.json"},
    {name: "Dog", cid: "QmXUSSgzCQUNezLpo9Xn8TSmgkPqL3SgT8RpfyyNjGgimN/dog.json"},
    {name: "Eagle", cid: "QmXUSSgzCQUNezLpo9Xn8TSmgkPqL3SgT8RpfyyNjGgimN/eagle.json"},
    {name: "Fox", cid: "QmXUSSgzCQUNezLpo9Xn8TSmgkPqL3SgT8RpfyyNjGgimN/fox.json"},
    {name: "Jellyfish", cid: "QmXUSSgzCQUNezLpo9Xn8TSmgkPqL3SgT8RpfyyNjGgimN/jellyfish.json"},
    {name: "Lion", cid: "QmXUSSgzCQUNezLpo9Xn8TSmgkPqL3SgT8RpfyyNjGgimN/lion.json"},
    {name: "Parrot", cid: "QmXUSSgzCQUNezLpo9Xn8TSmgkPqL3SgT8RpfyyNjGgimN/parrot.json"},
    {name: "Peacock", cid: "QmXUSSgzCQUNezLpo9Xn8TSmgkPqL3SgT8RpfyyNjGgimN/peacock.json"},
    {name: "Penguin", cid: "QmXUSSgzCQUNezLpo9Xn8TSmgkPqL3SgT8RpfyyNjGgimN/penguins.json"},
    {name: "Turtle", cid: "QmXUSSgzCQUNezLpo9Xn8TSmgkPqL3SgT8RpfyyNjGgimN/turtle.json"},
]

export default nfts;
```
Now we write our deploy script and mint the above NFT's to our hardhat local node. To deploy our contract to hardhat's local network, we first create a folder called `scripts` and write a `deployAndMint.js` script in it.

### Deploy script
``` javascript
const hre = require("hardhat");

import nfts from './nfts'

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  const NFTContractFactory = await hre.ethers.getContractFactory("MyNFT");
  const NFTContract = await NFTContractFactory.deploy();

  await NFTContract.deployed();

  console.log("Contract deployed to:", NFTContract.address);
  console.log("Minting NFTs to the contract with the deployer address : ", deployer.address);

  const promises = nfts.map( async (nft) => {
    console.log('Deploying: ', nft.name, nft.cid);
    await NFTContract.mint(deployer.address, nft.cid);
  })

  await Promise.all(promises);

  const bal = await NFTContract.balanceOf(deployer.address);
  console.log('Balance: ', bal.toString());
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

```
In the above code, `hre.ethers.getSigners()` returns the `signer` object of the account connected to hardhat config's default blockchain network. In this case its the first account generated by hardhat when the blockchain node is created. After deploying we mint our NFT's, its done in the line `await NFTContract.mint(deployer.address, nft.cid);`

Once the contract is deployed you can see the address of the deployed contract.

![alt text](https://ranadeepb.com/assets/nft/deploy-local.png "Deploying contract to local node")

Now place this contract address in the `tokenAddress` variable in `App.tsx` to connect our frontend to the contract in our local hardhat node.

Now to test the contract, add the network details in your metamask
![alt text](https://ranadeepb.com/assets/nft/add-local-metamask.png "Adding local node to metamask")

Now in an other terminal window while the node is running, run `npm run start` and make sure you have `react-scripts start` in your `scripts` field in package.json. Now head to `http://localhost:3000` to interact with the contract, make sure you are connected to the Localhost Hardhat node network in your metamask wallet


---

## 5. Deploying contract to Polygon(MATIC) network
Deploying contracts costs eth gas, so we acquire test ether from Matic netowrks's faucet [here](https://faucet.matic.network/). Make sure your metamask account is connected to `Matic Mumbai Testnet` and check if it has some ether in it. 

Then create a `.env` file in your repo and add the following keys to it, make sure .env is file added in your `.gitignore` so that you wont accidentally upload your private key details to github.

```
PRIVATE_KEY= ** YOUR PRIVATE KEY HERE ** 
```
Make sure you use a test eth account's private key.

Then we modify our `hardhat.config.js` to make `matic` as our default network 

```javascript
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  defaultNetwork: "matic",
  solidity: "0.8.0",
...
  networks: {
    hardhat: {
      chainId: 1337 // TO WORK WITH METAMASK
    },
    localhost: {},

    matic: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [PRIVATE_KEY]
    },

  }
};
```

Done, now we deploy our contract to the matic network using the same deploy command we used before:
`npx hardhat run scripts/deploy.js --network matic`

![alt text](https://ranadeepb.com/assets/nft/deploy-matic.png "Deploying contract to matic test net") 
You can see the address where our contract is deployed. To confirm it, lets head to etherscan and paste our contract address in the search bar. 

After the contract is deployed, we can now mint our NFT's to matic. We have special `mintToMatic.js` inside our scripts, which mints each NFT serially to our contract in matic test net. 

You should find the contract deployed on matic scan, with the tokens name, owner, balance etc..
![alt text](https://ranadeepb.com/assets/nft/contract-verification.png "Verifying contract on polygon scan") 

After deploying and minting, you can verify the transactions at [https://explorer-mumbai.maticvigil.com/](https://explorer-mumbai.maticvigil.com/)

![alt text](https://ranadeepb.com/assets/nft/contract-deployed.png "Verifying contract on polygon scan") 

Now there's an important step here which is to place this contract address in our frontend `App.tsx` so that we are connecting to the right contract. So in App.tsx, make sure you have the new contract address assigned to `tokenAddress` variable `const tokenAddress = "0x337988fD73881472f06C9934517cd8DA3eb9644f"`

Now add matic testnet to your metamask by selecting custom RPC and add the adding the network details as show below 

![alt text](https://ranadeepb.com/assets/nft/add-matic-polygon.png "Add matic to metamask") 
Now run `react-scripts start` in your terminal and your frontend should load connecting to the contract deployed in matic network 

---

## 6. Deploying front-end to vercel.

Before we deploy our frontend to vercel, create an account in vercel.com and connect your github account to it. It allows you to import your repos from github and deploy automagically to a subdomain on vercel.com

Add the following to your `package.json` for the vercel build step to succeed
```
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "compile": "npx hardhat compile",
    "test": "npx hardhat test"
  },
```

![alt text](https://ranadeepb.com/assets/nft/deploy-vercel.png "Deploying the frontend in vercel") 

Now in your vercel dashboard, click import project, select your repo and click deploy. Vercel will install all the dependencies, build and deploy your project and gives you the final public deploy url. Visit the url to finally interact with your contract.

This demo is hosted [here](https://nft-hardhat-ipfs-polygon.vercel.app/) at `https://nft-hardhat-ipfs-polygon.vercel.app/`. Make sure you set your network in metamask to MATIC mumbai network before trying the demo. 
