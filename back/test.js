const Web3 = require("web3");
// const web3 = new Web3("https://rpc-mumbai.maticvigil.com/");
const web3 = new Web3("https://polygon-rpc.com/");

web3.eth.getGasPrice()
.then(console.log);