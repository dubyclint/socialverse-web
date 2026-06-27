import abi from './abi.json'

// Lazy load EthClient
let EthClient: any = null;

async function getEthClient() {
  if (!EthClient) {
    const module = await import('../lib/eth-client');
    EthClient = module.EthClient;
  }
  return EthClient;
}

async function run() {
  try {
    const EthClientClass = await getEthClient();
    
    const client = new EthClientClass({
      providerUrl: 'https://polygon-rpc.com',
      privateKey: process.env.PRIVATE_KEY!,
      contractAddress: '0xYourContractAddress',
      abi,
      client: 'ethers' // or 'web3'
    });

    // Initialize the client
    await client.initialize();

    const value = await client.call('getValue');
    console.log('Current value:', value);

    await client.send('setValue', 42);

    console.log('Script completed successfully');
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

run();
