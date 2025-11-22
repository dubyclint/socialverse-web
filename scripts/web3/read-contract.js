const Web3 = require('web3')
const abi = require('./abi.json')
const web3 = new Web3('https://polygon-rpc.com')

const contract = new web3.eth.Contract(abi, '0xYourContractAddress')

contract.methods.getValue().call().then(console.log)
