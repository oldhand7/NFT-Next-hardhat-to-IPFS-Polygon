import Web3Modal from "web3modal";
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from 'baseui/button';
import {styled, useStyletron} from 'baseui';

function ConnectHeader({onConnected}) {
    const [css, theme] = useStyletron();
    const [account, setAccount] = useState(null);
    const providerOptions = {
      /* See Provider Options Section */
    };
    
    const web3Modal = new Web3Modal({
      providerOptions // required
    });
  
    async function updateAccount(provider) {
      const signer = provider.getSigner();
      const account = await signer.getAddress();
      setAccount(account);
    }
  
    async function onConnect() {    
      const web3Provider = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(web3Provider);
      await updateAccount(provider);

      web3Provider.on("accountsChanged", async (accounts: string[]) => {
        console.log('Accounts Changed',accounts);
        onConnected(provider);
        await updateAccount(provider);
      });
      // Subscribe to provider connection
      web3Provider.on("connect", (info: { chainId: number }) => {
        console.log('on connected' ,info);
      });
  
      // Subscribe to provider disconnection
      web3Provider.on("disconnect", (error: { code: number; message: string }) => {
        console.log(error);
      });
  
      onConnected(provider);
    }
  
    return (
      <div className={css({padding: "0rem 4rem", display: "flex", justifyContent: "flex-end"})}>
        { account ? (<p>{account}</p>) : (<Button onClick={onConnect}>Connect</Button>) }
      </div>
    )
  }

  export default ConnectHeader;