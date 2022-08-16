import React, { useCallback, useEffect, useState } from "react";
import Web3 from "web3";
import tokenJson, { abi } from "../ABI/NeondToken.json";
import DiceJson from "../ABI/Dice.json";
import { signPlaceBet,switchNetwork_to_mumbai ,addNND} from "../actions/index";
import axios from 'axios';

function Eip712() {
  const [betValue, setBetValue] = useState("2000000000000000000");
  const [choiceMesk, setChoiceMesk] = useState(new Array(6).fill(0));
  const [mintTo,setMintTo] = useState();
  const [isMinting,setIsMinting] = useState(true);
  const diceData = [
    { id: 0, name: 1 },
    { id: 1, name: 2 },
    { id: 2, name: 3 },
    { id: 3, name: 4 },
    { id: 4, name: 5 },
    { id: 5, name: 6 },
  ];
  const handleCheck = useCallback((e) => {
    console.log(e.target.checked);
    if(e.target.checked) {
      let arr = choiceMesk.map((vaule,id) => {
        if(id == e.target.name-1 || vaule == 1) {
          return 1;
        }
        return 0;
      });
      setChoiceMesk(arr);
    } else {
      let arr = choiceMesk.map((vaule,id) => {
        if(id == e.target.name-1) {
          return 0;
        } else if(vaule ==1) {
          return 1;
        } else {
          return 0;

        }
      });
      setChoiceMesk(arr);
    }
  })
  const placeBet = useCallback(async () => {
    const web3 = new Web3(window.ethereum);

    // 네트워크 뭄바이 아닐경우 전환
    const id = await web3.eth.getChainId();
    if(id !== 80001) {
      switchNetwork_to_mumbai();
      return;
    }

    await window.ethereum.enable();
    const accounts = await web3.eth.getAccounts();

    const diceAddress = DiceJson.networks[80001].address;
    const sign = await signPlaceBet(web3, betValue, diceAddress);
    const transaction = {
      from: accounts[0],
      gas: 19000000,
      gasPrice: web3.utils.toWei("40", "gwei"),
    };
    const DiceContract = new web3.eth.Contract(
      DiceJson.abi,
      DiceJson.networks[80001].address
    );

    const bin = choiceMesk.join('');
    const dec = parseInt(bin, 2);

    const _PlaceBet = await DiceContract.methods
      .placeBet(dec, betValue, sign.transactionDeadline, sign.v, sign.r, sign.s)
      .send(transaction);

    console.log(_PlaceBet);
  });

  const switchNetwork = useCallback(async () => {
    await switchNetwork_to_mumbai();
  });

  const mintTestNeondToken = useCallback(async () => {
    try{
      setIsMinting(false)
      const mint_Result = await axios.post('http://localhost:3001/mint/'+mintTo,
       {"Content-Type":"application/json"}
       );
      alert(`success tx : ${mint_Result.transactionHash}`)
    } catch(err) {
      alert(err);
    } finally {
      setIsMinting(true)
    }
  })

  const addToken = useCallback(async() => {
    await addNND();
  })
  const changeMintTo = (e) => {
    setMintTo(e.target.value);
  }
  return (
    <div>
      <div>For test Eip712 Sign From Metamask</div>
      <div>Bet amount : {betValue} </div>
      <div>Choice Number : {choiceMesk}</div>
      {diceData.map((item) => {
        return (
          <div key={item.id}>
            <input type={"checkbox"} name={item.name} onChange={(e) => handleCheck(e)} ></input>
            <div>{item.name}</div>
          </div>
        );
      })}
      <button onClick={placeBet}>Place bet</button>
      <button onClick={switchNetwork}>switch Network</button>
      <button onClick={addToken}>add NND Token to MetaMask</button>
      <br/>
      <br/>
      <div>mint 10 Neond to {mintTo}</div>
      <input type="text" placeholder="토큰 받는 주소 입력" onChange={changeMintTo}/>
    {isMinting ? <button onClick={mintTestNeondToken}>Let Minting</button> : "wait ti minting..."}
    </div>
  );
}

export default Eip712;
