import abi from './abi.json'
import { EthClient } from '../lib/eth-client'

const client = new EthClient({
  providerUrl: 'https://polygon-rpc.com',
  privateKey: process.env.PRIVATE_KEY!,
  contractAddress: '0xYourContractAddress',
  abi,
  client: 'ethers' // or 'web3'
})

async function run() {
  const value = await client.read('getValue')
  console.log('Current value:', value)

  await client.write('setValue', 42)

  client.listen('ValueChanged', (event: any) => {
    console.log('Event received:', event)
  })
}

run()
