import tokenJson, { abi } from "../ABI/NeondToken.json";

import Web3 from "web3";


export const signPlaceBet = async (web3, betValue, to) => {
  const domain = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
  ];
  const Permit = [
    {
      name: "owner",
      type: "address",
    },
    {
      name: "spender",
      type: "address",
    },
    {
      name: "value",
      type: "uint256",
    },
    {
      name: "nonce",
      type: "uint256",
    },
    {
      name: "deadline",
      type: "uint256",
    },
  ];
  const accounts = await web3.eth.getAccounts();
  const tokenContract = new web3.eth.Contract(
    abi,
    tokenJson.networks[80001].address
  );
  const transactionDeadline = Date.now() + 20 * 60; //permit for 20 minutes only

  const domainData = {
    name: await tokenContract.methods.name().call(),
    version: "1",
    chainId: await web3.eth.getChainId(),
    verifyingContract: tokenJson.networks[80001].address,
  };

  const message = {
    owner: accounts[0],
    spender: to,
    value: betValue,
    nonce: await tokenContract.methods.nonces(accounts[0]).call(),
    deadline: transactionDeadline,
  };
  
  const data = JSON.stringify({
    types: {
      EIP712Domain: domain,
      Permit: Permit,
    },
    domain: domainData,
    primaryType: "Permit",
    message: message,
  });

  let result = await window.ethereum.request({
    method: "eth_signTypedData_v3",
    params: [accounts[0], data],
    from: accounts[0],
  });

  const signature = result.substring(2);
  const r = "0x" + signature.substring(0, 64);
  const s = "0x" + signature.substring(64, 128);
  const v = parseInt(signature.substring(128, 130), 16);

  return { v, r, s, transactionDeadline };
};

export const test = () => {
  return;
};

export const switchNetwork_to_mumbai = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: "0x13881" }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: "0x13881",
              chainName: 'Matic Mumbai',
              nativeCurrency: {
                name:"MATIC",
                symbol:"MATIC",
                decimals: 18
              },
              rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
              blockExplorerUrls: ['https://mumbai.ploygonscan.com']
            },
          ],
        });
      } catch (addError) {
        // handle "add" error
        console.log(addError);
      }
    }
    // handle other "switch" errors
  }
}

export const addNND = async() => {
const tokenAddress = '0xEF9e47eBeF737026036D923Bc80038f5B64650dF';
const tokenSymbol = 'NND';
const tokenDecimals = 18;

try {
  // wasAdded is a boolean. Like any RPC method, an error may be thrown.
  const wasAdded = await window.ethereum.request({
    method: 'wallet_watchAsset',
    params: {
      type: 'ERC20', // Initially only supports ERC20, but eventually more!
      options: {
        address: tokenAddress, // The address that the token is at.
        symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
        decimals: tokenDecimals, // The number of decimals in the token
      },
    },
  });
  if (wasAdded) {
    console.log('Thanks for your interest!');
  } else {
    console.log('Your loss!');
  }
} catch (error) {
  console.log(error);
}
}