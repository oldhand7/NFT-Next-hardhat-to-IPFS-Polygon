import React, { useState, useEffect } from 'react'; 
import axios from 'axios';
import { Button } from 'baseui/button';
import { Input } from 'baseui/input';
import { StyledSpinnerNext as Spinner } from "baseui/spinner";
import {styled, useStyletron} from 'baseui';

const Image = styled('img', {
  width: "320px",
  height: "280px",
  objectFit: "cover"
})
  
const CollectbleContainer = styled('div', {
  margin: "2rem 0",
  display: "flex",
  flexDirection: "row"
})


const Label = styled('label', {
  width: "200px"
})

async function fetchMetadata(cid) {
  const url = `https://ipfs.io/ipfs/${cid}`
  const response = await axios.get(url);
  return response.data;
}
    
function Collectible({item, onTransfer}) {
  const [metadata, setMetadata] = useState(null);
  const [css, theme] = useStyletron();
  const [transerAddress, setTranserAddress] = useState('')
  

  useEffect(() => {
    //cannot use async as EffectCallback, so using an IIFE with an async fn.
    (async () => {
      let metadata = await fetchMetadata(item.tokenURI);   
      metadata.imageURL = `https://ipfs.io/ipfs/${metadata.image.replace('ipfs://', '')}`
      setMetadata(metadata);
    })();

  }, [item])

  const onSubmit = () => {
    onTransfer(transerAddress, item.tokenId);
  }

  return (
    <div>
      { 
      metadata ? 
      <CollectbleContainer>
        <Image src={metadata.imageURL} />
        <div className={css({marginLeft: '1rem'})}>
          <h1 className={css({margin: '0'})}>{metadata.name}</h1>
          <h4>Description: {metadata.description}</h4>
          <div className={css({})}>
              <Label>📨 Transfer to:</Label>
              <div className={css({display: "flex", flexDirection: 'row'})}>
                <Input
                    value={transerAddress}
                    onChange={ e => setTranserAddress(e.currentTarget.value)}
                    placeholder="0x.."
                    overrides={{
                    Root: {
                        style: {

                        },
                    },
                    }}
                />
                <Button onClick={onSubmit}>Transfer</Button>
              </div>
            </div> 
        </div>
      </CollectbleContainer>
      : <Spinner /> 
      }
    </div>
  )
}
  
function Collectibles({data, onTransfer}) {
  const [css, theme] = useStyletron();

  return (
    <div className={css({display: "flex", flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between"})}>
      { 
        data.length ? 
        data.map((item, i) => <Collectible key={i} item={item} onTransfer={onTransfer}/>)
        : <h3>You have no collectibles</h3>
      }
    </div>

  )
}

export default Collectibles