const _DiceJson = require("../build/contracts/Dice.json");
const _TokenJson = require("../build/contracts/NeondToken.json");
const _VaultJson = require("../build/contracts/Vault.json");
const _VRFJson = require("../build/contracts/VRFv2Center.json");

const Web3 = require("web3");
const dotenv = require("dotenv");
const fs = require('fs');
dotenv.config();

// For Polygon mainnet: wss://ws-mainnet.matic.network/
let url = "wss://ws-mumbai.matic.today/";
const provider = new Web3.providers.WebsocketProvider(url);
const web3 = new Web3(provider);

module.exports = async () => {
  console.log(`connect mumbai network`);

  const DiceContract = new web3.eth.Contract(
    _DiceJson.abi,
    _DiceJson.networks[80001].address
  );

  let currentBlockNumber = await web3.eth.getBlockNumber();
  console.log(`currentBlockNumber : ${currentBlockNumber}`);

  let options = {
    filter: {
      rollUnder: [],
    },
    fromBlock: currentBlockNumber,
  };


  // 관련 Web3 DOCS : # https://web3js.readthedocs.io/en/v1.7.5/web3-eth-contract.html#contract-events
  // Placed Bet WebSocket
  DiceContract.events
    .BetPlaced(options)
    .on("data", (event) => {
      const { betId, player, amount, rollUnder, choice } = event.returnValues;
      let _msg = {
        betId,
        player,
        amount,
        rollUnder,
        choice
      }

      /* Log 사용 후 삭제 예정 */
      let msg = `Placed Bet : 
    betId : ${betId}
    player : ${player}
    amount : ${amount}
    rollUnder : ${rollUnder}
    choice : ${choice}
    `;
      console.log(msg);
    
    fs.readFile('./DB/Dice_Placed_Bet_DB.json','utf8',(err,data) => {
        if (err) throw err;
        let obj = JSON.parse(data);
        obj.table.push(_msg); 
        let json = JSON.stringify(obj);
        fs.writeFile('./DB/Dice_Placed_Bet_DB.json',json,'utf8',(err,result) => {
            if (err) throw err;
        })
    })
    })
    .on("changed", (changed) => console.log(changed))
    .on("error", (err) => console.log("error: " + err))
    .on("connected", (id) => console.log("\nSuccess Connect to Dice [event BetPlaced] : " + id));


  // Settled Bet WebSocket
  DiceContract.events
    .BetSettled(options)
    .on("data", (event) => {
      const { betId, player, amount, rollUnder, choice, outcome, winAmount } = event.returnValues;

      let _msg = { betId, player, amount, rollUnder, choice, outcome, winAmount } ;

      
      /* Log 사용 후 삭제 예정 */
      let msg = `Settled Bet : 
    betId : ${betId}
    player : ${player}
    amount : ${amount}
    rollUnder : ${rollUnder}
    choice : ${choice}
    outcome : ${outcome}
    winAmount : ${winAmount}
    `;
      console.log(msg);


      // DB 시연 : 삭제 예정
      fs.readFile('./DB/Dice_Settled_Bet_DB.json','utf8',(err,data) => {
        if (err) throw err;
        let obj = JSON.parse(data);
        obj.table.push(_msg); 
        let json = JSON.stringify(obj);
        fs.writeFile('./DB/Dice_Settled_Bet_DB.json',json,'utf8',(err,result) => {
            if (err) throw err;
        })
    })
    })
    .on("changed", (changed) => console.log(changed))
    .on("error", (err) => console.log("error: " + err))
    .on("connected", (id) =>
      console.log("Success Connect to Dice [event BetSettled] : " + id)
    );
};
