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
      statusCode: 503,
      message: 'ETH client not available'
    });
  }

  // Get query parameters
  const query = getQuery(event);
  const method = query.method as string;

  if (!method) {
    throw createError({
      statusCode: 400,
      message: 'Method parameter is required'
    });
  }

  try {
    // Initialize the client if not already done
    await ethClient.initialize();

    // Handle different contract methods
    switch (method) {
      case 'getBalance':
        const address = query.address as string;
        if (!address) {
          throw createError({
            statusCode: 400,
            message: 'Address parameter is required'
          });
        }
        const balance = await ethClient.getBalance(address);
        return {
          success: true,
          balance
        };

      case 'call':
        const callMethod = query.callMethod as string;
        const callArgs = query.args ? JSON.parse(query.args as string) : [];
        const result = await ethClient.call(callMethod, ...callArgs);
        return {
          success: true,
          result
        };

      default:
        throw createError({
          statusCode: 400,
          message: `Unknown method: ${method}`
        });
    }
  } catch (error) {
    console.error('[Contract] Request failed:', error);
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Contract operation failed'
    });
  }
});
