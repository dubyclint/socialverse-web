const Web3 = require('web3')
const web3 = new Web3('https://polygon-rpc.com')

const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY)
web3.eth.accounts.wallet.add(account)

console.log('Wallet address:', account.address)
