const _Dice = artifacts.require("Dice");
const _Token = artifacts.require("NeondToken");
const _Vault = artifacts.require("Vault");
const _VRF = artifacts.require("VRFv2Center");

const _DiceJson = require('../build/contracts/Dice.json')
const _TokenJson = require('../build/contracts/NeondToken.json')
const _VaultJson = require('../build/contracts/Vault.json')
const _VRFJson = require('../build/contracts/VRFv2Center.json')

const Web3 = require("web3");
const web3 = new Web3('https://rpc-mumbai.maticvigil.com/');

const dotenv = require('dotenv');
dotenv.config();


module.exports = async function (deployer, network, addresses) {
  // if (network === "development") {
  if (network === "polyTestnet") {
    const account = web3.eth.accounts.wallet.add(process.env.NMEMONIC);

    const transaction = {
      'from' :account.address, 
      'gas': 95000,
      'gasPrice' : web3.utils.toWei("35", "gwei"),
  };

    // STEP 1 : Deploy NeonD Token
    //  await deployer.deploy(_Token);
    //  const Neond = await _Token.deployed();
    
     // STEP 2 : Deploy Vault
    //  await deployer.deploy(_Vault,_TokenJson.networks[80001].address);
    //  const Vault = await _Vault.deployed();
     
    // STEP 3 : minting NeonD Token to Vault
    const tokenContract = new web3.eth.Contract(_TokenJson.abi,_TokenJson.networks[80001].address)
    // let result = await tokenContract.methods.mint(_VaultJson.networks[80001].address, web3.utils.toWei("100000", "ether")).send(transaction);
    let result = await tokenContract.methods.mint(addresses[0], web3.utils.toWei("100000", "ether")).send(transaction);
    console.log(result.transactionHash);

    // // STEP 4 : Deploy VRF
    // await deployer.deploy(_VRF,process.env.SUBSCRIPTION_ID);
    // const VRF = await _VRF.deployed();

    // // STEP 5 : Deploy Dice
    // await deployer.deploy(_Dice,_TokenJson.networks[80001].address,_VaultJson.networks[80001].address);
    // const Dice = await _Dice.deployed();

    // // STEP 6 : add admin
    // const VaultContract = new web3.eth.Contract(_VaultJson.abi,_VaultJson.networks[80001].address)
    // let Vaultresult = await VaultContract.methods.addAdmin(_DiceJson.networks[80001].address).send(transaction);
    // console.log(Vaultresult.transactionHash);

    // const VRFContract = new web3.eth.Contract(_VRFJson.abi, _VRFJson.networks[80001].address)
    // let VRFResult = await VRFContract.methods.addGame(_DiceJson.networks[80001].address).send(transaction);
    // console.log(VRFResult.transactionHash);


     console.log('good');
  }
};
