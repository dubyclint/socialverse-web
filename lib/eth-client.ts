// ============================================================================
// FILE: /lib/eth-client.ts - FIXED WITH LAZY LOADING
// ============================================================================

import type { ContractInterface } from 'ethers'

type ClientType = 'ethers' | 'web3'

interface EthClientConfig {
  providerUrl: string
  privateKey: string
  contractAddress: string
  abi: ContractInterface
  client?: ClientType
}

// Lazy load libraries
let ethers: any = null;
let Web3: any = null;

async function getEthers() {
  if (!ethers) {
    const module = await import('ethers');
    ethers = module.ethers;
  }
  return ethers;
}

async function getWeb3() {
  if (!Web3) {
    const module = await import('web3');
    Web3 = module.default;
  }
  return Web3;
}

export class EthClient {
  private providerUrl: string
  private privateKey: string
  private contractAddress: string
  private abi: ContractInterface
  private clientType: ClientType
  private provider: any
  private signer: any
  private contract: any
  private web3: any
  private initialized: boolean = false

  constructor(config: EthClientConfig) {
    this.providerUrl = config.providerUrl
    this.privateKey = config.privateKey
    this.contractAddress = config.contractAddress
    this.abi = config.abi
    this.clientType = config.client || 'ethers'
  }

  /**
   * Initialize the client
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      if (this.clientType === 'ethers') {
        await this.initializeEthers();
      } else {
        await this.initializeWeb3();
      }
      this.initialized = true;
      console.log(`[EthClient] Initialized with ${this.clientType}`);
    } catch (error) {
      console.error('[EthClient] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize with ethers.js
   */
  private async initializeEthers(): Promise<void> {
    const ethersLib = await getEthers();
    
    this.provider = new ethersLib.JsonRpcProvider(this.providerUrl);
    this.signer = new ethersLib.Wallet(this.privateKey, this.provider);
    this.contract = new ethersLib.Contract(
      this.contractAddress,
      this.abi,
      this.signer
    );
  }

  /**
   * Initialize with web3.js
   */
  private async initializeWeb3(): Promise<void> {
    const WebLib = await getWeb3();
    
    this.web3 = new Web3Lib(this.providerUrl);
    const account = this.web3.eth.accounts.privateKeyToAccount(this.privateKey);
    this.web3.eth.accounts.wallet.add(account);
    this.web3.eth.defaultAccount = account.address;
    
    this.contract = new this.web3.eth.Contract(this.abi, this.contractAddress);
  }

  /**
   * Call a contract method
   */
  async call(method: string, ...args: any[]): Promise<any> {
    await this.initialize();

    try {
      if (this.clientType === 'ethers') {
        return await this.contract[method](...args);
      } else {
        return await this.contract.methods[method](...args).call();
      }
    } catch (error) {
      console.error(`[EthClient] Call to ${method} failed:`, error);
      throw error;
    }
  }

  /**
   * Send a transaction
   */
  async send(method: string, ...args: any[]): Promise<any> {
    await this.initialize();

    try {
      if (this.clientType === 'ethers') {
        const tx = await this.contract[method](...args);
        return await tx.wait();
      } else {
        const account = this.web3.eth.accounts.wallet[0];
        return await this.contract.methods[method](...args).send({
          from: account.address,
          gas: 000000
        });
      }
    } catch (error) {
      console.error(`[EthClient] Transaction ${method} failed:`, error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<string> {
    await this.initialize();

    try {
      if (this.clientType === 'ethers') {
        const balance = await this.provider.getBalance(address);
        return balance.toString();
      } else {
        return await this.web3.eth.getBalance(address);
      }
    } catch (error) {
      console.error('[EthClient] Get balance failed:', error);
      throw error;
    }
  }
}

