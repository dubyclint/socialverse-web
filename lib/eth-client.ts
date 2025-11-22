import { ethers } from 'ethers';
import Web3 from 'web3';
import type { ContractInterface } from 'ethers';

type ClientType = 'ethers' | 'web3';

interface EthClientOptions {
  providerUrl: string;
  privateKey: string;
  contractAddress: string;
  abi: ContractInterface;
  client: ClientType;
}

export class EthClient {
  private ethersProvider?: ethers.providers.JsonRpcProvider;
  private web3?: Web3;
  private wallet?: ethers.Wallet;
  private account?: any;
  private contract: any;
  private options: EthClientOptions;

  constructor(options: EthClientOptions) {
    this.options = options;

    try {
      if (options.client === 'ethers') {
        this.ethersProvider = new ethers.providers.JsonRpcProvider(options.providerUrl);
        this.wallet = new ethers.Wallet(options.privateKey, this.ethersProvider);
        this.contract = new ethers.Contract(options.contractAddress, options.abi, this.wallet);
      } else {
        this.web3 = new Web3(options.providerUrl);
        this.account = this.web3.eth.accounts.privateKeyToAccount(options.privateKey);
        this.web3.eth.accounts.wallet.add(this.account);
        this.contract = new this.web3.eth.Contract(options.abi as any, options.contractAddress);
      }
    } catch (error) {
      console.error('Failed to initialize ETH client:', error);
      throw new Error(`ETH client initialization failed: ${error.message}`);
    }
  }

  async read(method: string, ...args: any[]): Promise<any> {
    try {
      if (this.options.client === 'ethers') {
        return await this.contract[method](...args);
      } else {
        return await this.contract.methods[method](...args).call();
      }
    } catch (error) {
      console.error(`Failed to read from contract method ${method}:`, error);
      throw error;
    }
  }

  async write(method: string, ...args: any[]): Promise<any> {
    try {
      if (this.options.client === 'ethers') {
        const tx = await this.contract[method](...args);
        return await tx.wait();
      } else {
        return await this.contract.methods[method](...args).send({ 
          from: this.account.address 
        });
      }
    } catch (error) {
      console.error(`Failed to write to contract method ${method}:`, error);
      throw error;
    }
  }

  listen(eventName: string, callback: Function): void {
    try {
      if (this.options.client === 'ethers') {
        this.contract.on(eventName, (...args: any[]) => callback(...args));
      } else {
        this.contract.events[eventName]({}, (err: any, event: any) => {
          if (err) {
            console.error(`Error listening to event ${eventName}:`, err);
          } else {
            callback(event);
          }
        });
      }
    } catch (error) {
      console.error(`Failed to set up event listener for ${eventName}:`, error);
      throw error;
    }
  }

  // Add cleanup method
  cleanup(): void {
    if (this.options.client === 'ethers') {
      this.contract?.removeAllListeners();
    }
  }
}
