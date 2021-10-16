import './App.css';
import Token from './artifacts/contracts/NFT.sol/MyNFT.json';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import {styled, useStyletron} from 'baseui';
import { StyledSpinnerNext as Spinner } from "baseui/spinner";
import {
  SnackbarProvider,
  useSnackbar,
} from 'baseui/snackbar';

import ConnectHeader from './components/ConnectHeader'
import Collectibles from './components/Collectibles'

const contractAddress = "0x337988fD73881472f06C9934517cd8DA3eb9644f"

const Container = styled('div', {
  background: "rgb(255 218 163)",
  padding: "2rem",
  minHeight: '100vh'
})

function Event({data}) {
  const {enqueue} = useSnackbar();

  useEffect(() => {
    if(data) enqueue({message: data.message})
  }, [data])

  return (<></>)
}

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
