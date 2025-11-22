const Web3 = require('web3')
const abi = require('./abi.json')
const web3 = new Web3('wss://polygon-rpc.com/ws')

const contract = new web3.eth.Contract(abi, '0xYourContractAddress')

contract.events.ValueChanged({}, (error, event) => {
  if (error) console.error(error)
  else console.log('Event:', event)
})
