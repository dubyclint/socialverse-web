import { getSupabaseClient } from "~/server/utils/database";
import { EthClient } from '../../lib/eth-client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Initialize ETH client only if environment variables are present
let client: EthClient | null = null;

if (process.env.PROVIDER_URL && process.env.PRIVATE_KEY && process.env.CONTRACT_ADDRESS) {
  try {
    // Read ABI from file dynamically
    const abiPath = resolve(process.cwd(), 'scripts/abi.json');
    const abiContent = readFileSync(abiPath, 'utf-8');
    const abi = JSON.parse(abiContent);
    
    client = new EthClient({
      providerUrl: process.env.PROVIDER_URL,
      privateKey: process.env.PRIVATE_KEY,
      contractAddress: process.env.CONTRACT_ADDRESS,
      abi,
      client: (process.env.ETH_CLIENT_TYPE as 'ethers' | 'web3') || 'ethers'
    });
  } catch (error) {
    console.error('Failed to initialize ETH client:', error);
  }
}

export default defineEventHandler(async (event) => {
  const supabase = await getSupabaseClient();
  const method = getMethod(event);
  const url = getRequestURL(event);
  
  if (method === 'GET' && url.pathname.endsWith('/read')) {
    if (!client) {
      throw createError({
        statusCode: 500,
        statusMessage: 'ETH client not configured'
      });
    }

    const query = getQuery(event);
    const contractMethod = query.method as string;
    const args = query.args ? JSON.parse(query.args as string) : [];

    try {
      const result = await client.read(contractMethod, ...args);
      return { result };
    } catch (err) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Read failed',
        data: err
      });
    }
  }
  
  if (method === 'POST' && url.pathname.endsWith('/write')) {
    if (!client) {
      throw createError({
        statusCode: 500,
        statusMessage: 'ETH client not configured'
      });
    }

    const body = await readBody(event);
    const { method: contractMethod, args = [] } = body;

    try {
      const result = await client.write(contractMethod, ...args);
      return { success: true, tx: result };
    } catch (err) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Write failed',
        data: err
      });
    }
  }
  
  throw createError({
    statusCode:,
    statusMessage: 'Method not allowed'
  });
});
