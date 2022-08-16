import React, { useCallback, useEffect, useState } from 'react';
import Web3 from 'web3';

function Home() {
    const [server, setServer] = useState();
    const [walletAddress, setWalletAddress] = useState();
    const [walletBalance, setWalletBalance] = useState();
    const [destination, setDestination] = useState("0xD18c6516E3F7650DA7149eBD2E244Cd69a19C7Cf");
    const [sendValue, setSendValue] = useState("0.0004");

    const connectWallet = useCallback(async () => {
        try {
            let web3 = new Web3(window.ethereum);
            await window.ethereum.enable();
            const id = await web3.eth.getChainId();
            setServer(id);
            const accounts = await web3.eth.getAccounts();
            setWalletAddress(accounts[0]);
            const balance = await web3.eth.getBalance(accounts[0]);
            setWalletBalance(web3.utils.fromWei(balance, 'ether'));
        } catch (error) {
            console.log(error);
        }
    })

    const sendETH = useCallback(async () => {
        let web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.getAccounts();
        const nonce = await web3.eth.getTransactionCount(walletAddress, 'latest');
        const amountToSend = web3.utils.toWei(sendValue, "ether");

        const transaction = {
            'from' :accounts[0], 
            'to': destination, // faucet address to return eth
            'value': amountToSend,
            'gas': 30000,
            // 'maxFeePerGas': 1000000108,
            'nonce': nonce,
            // optional data field to send message or execute smart contract
        };

        const tx = await web3.eth.sendTransaction(transaction, function (error, hash) {
            if (!error) {
                console.log("🎉 The hash of your transaction is: ", hash, "\n Check Alchemy's Mempool to view the status of your transaction!");
            } else {
                console.log("❗Something went wrong while submitting your transaction:", error)
            }
        });

        alert(`success send eth ${tx.transactionHash}`);
    })
    return (
        <>
            Test Connect MetaMask
            <div>
                <button onClick={connectWallet}>Connect MetaMask</button>
                <div>Current connecting Server : {server}</div>
                <div>Wallet Address : {walletAddress}</div>
                <div>Wallet Balance : {walletBalance}</div>
                <br></br>
                <br></br>
                <br></br>
                <div>destination : {destination}</div>
                <div>send Value : {sendValue}</div>
                <button onClick={sendETH}>send ETH</button>
            </div>
        </>
    )
}

export default Home;