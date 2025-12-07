import { getSupabaseClient } from "~/server/utils/database";
import { promises as fs } from 'fs';
import { resolve } from 'path';

// Lazy load EthClient
let EthClient: any = null;
let client: any = null;
let clientInitialized = false;

async function getEthClient() {
  if (clientInitialized) {
    return client;
  }

  if (!process.env.PROVIDER_URL || !process.env.PRIVATE_KEY || !process.env.CONTRACT_ADDRESS) {
    console.warn('[Contract] ETH client not configured');
    clientInitialized = true;
    return null;
  }

  try {
    // Lazy load EthClient class
    if (!EthClient) {
      const ethModule = await import('../../lib/eth-client');
      EthClient = ethModule.EthClient;
    }

    // Read ABI asynchronously
    const abiPath = resolve(process.cwd(), 'scripts/abi.json');
    const abiContent = await fs.readFile(abiPath, 'utf-8');
    const abi = JSON.parse(abiContent);
    
    client = new EthClient({
      providerUrl: process.env.PROVIDER_URL,
      privateKey: process.env.PRIVATE_KEY,
      contractAddress: process.env.CONTRACT_ADDRESS,
      abi,
      client: (process.env.ETH_CLIENT_TYPE as 'ethers' | 'web3') || 'ethers'
    });

    clientInitialized = true;
    console.log('[Contract] ETH client initialized');
    return client;
  } catch (error) {
    console.error('[Contract] Failed to initialize ETH client:', error);
    clientInitialized = true;
    return null;
  }
}

export default defineEventHandler(async (event) => {
  const supabase = await getSupabaseClient();
  const ethClient = await getEthClient();

  if (!ethClient) {
    throw createError({
      statusCode:,
      message: 'ETH client not available'
    });
  }

  // Rest of your handler code...
  return {
    status: 'ok',
    message: 'Contract endpoint ready'
  };
});
