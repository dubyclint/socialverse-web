const Web3 = require('web3')
const abi = require('./abi.json')
const web3 = new Web3('https://polygon-rpc.com')

const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY)
web3.eth.accounts.wallet.add(account)

const contract = new web3.eth.Contract(abi, '0xYourContractAddress')

contract.methods.setValue(42).send({ from: account.address }).then(console.log)
