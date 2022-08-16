const express = require('express');
const router = express.Router();

const Web3 = require("web3");
const web3 = new Web3('https://rpc-mumbai.maticvigil.com/');

const dotenv = require('dotenv');
dotenv.config();

const _TokenJson = require('../build/contracts/NeondToken.json')

//http://localhost:3001/mint/{eoa}
router.post('/mint/:eoa', async(req,res,next) => {
try {
    const {eoa} = req.params;

    console.log(`To ${eoa} Mint 10 NND`);

    const account = web3.eth.accounts.wallet.add(process.env.NMEMONIC);
    const transaction = {
        'from' :account.address, 
        'gas': 95000,
        'gasPrice' : web3.utils.toWei("35", "gwei"),
    };

    // minting 
    const tokenContract = new web3.eth.Contract(_TokenJson.abi,_TokenJson.networks[80001].address)
    let result = await tokenContract.methods.mint(eoa, web3.utils.toWei("10", "ether")).send(transaction);

    res.status(200).send(result.tx);

} catch(err) {
    console.log('err');
    res.status(400).send(err);
}
})

module.exports = router;
