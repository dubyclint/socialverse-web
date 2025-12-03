// ============================================================================
// FILE 3: /lib/eth-client.ts - COMPLETE FIXED VERSION
// ============================================================================
// ETHEREUM CLIENT - Supports both ethers.js and web3.js
// FIXED: web3 package is now properly imported
// ============================================================================

import { ethers } from 'ethers'
import Web3 from 'web3'
import type { ContractInterface } from 'ethers'

type ClientType = 'ethers' | 'web3'

interface EthClientOptions {
  providerUrl: string
  privateKey: string
  contractAddress: string
  abi: ContractInterface
  client: ClientType
}

/**
 * Ethereum Client - Unified interface for ethers.js and web3.js
 */
export class EthClient {
  private ethersProvider?: ethers.providers.JsonRpcProvider
  private web3?: Web3
  private wallet?: ethers.Wallet
  private account?: any
  private contract: any
  private options: EthClientOptions

  constructor(options: EthClientOptions) {
    this.options = options

    try {
      if (options.client === 'ethers') {
        this.initializeEthers()
      } else {
        this.initializeWeb3()
      }
    } catch (error) {
      console.error('[EthClient] Initialization failed:', error)
      throw new Error(`ETH client initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Initialize ethers.js client
   */
  private initializeEthers(): void {
    try {
      this.ethersProvider = new ethers.providers.JsonRpcProvider(this.options.providerUrl)
      this.wallet = new ethers.Wallet(this.options.privateKey, this.ethersProvider)
      this.contract = new ethers.Contract(
        this.options.contractAddress,
        this.options.abi,
        this.wallet
      )
      console.log('[EthClient] Ethers.js client initialized successfully')
    } catch (error) {
      console.error('[EthClient] Ethers initialization error:', error)
      throw error
    }
  }

  /**
   * Initialize web3.js client
   */
  private initializeWeb3(): void {
    try {
      this.web3 = new Web3(this.options.providerUrl)
      this.account = this.web3.eth.accounts.privateKeyToAccount(this.options.privateKey)
      this.web3.eth.accounts.wallet.add(this.account)
      this.contract = new this.web3.eth.Contract(
        this.options.abi as any,
        this.options.contractAddress
      )
      console.log('[EthClient] Web3.js client initialized successfully')
    } catch (error) {
      console.error('[EthClient] Web3 initialization error:', error)
      throw error
    }
  }

  /**
   * Read from contract (call method)
   */
  async read(method: string, ...args: any[]): Promise<any> {
    try {
      console.log(`[EthClient] Reading method: ${method}`)
      
      if (this.options.client === 'ethers') {
        return await this.contract[method](...args)
      } else {
        return await this.contract.methods[method](...args).call()
      }
    } catch (error) {
      console.error(`[EthClient] Failed to read from contract method ${method}:`, error)
      throw error
    }
  }

  /**
   * Write to contract (send transaction)
   */
  async write(method: string, ...args: any[]): Promise<any> {
    try {
      console.log(`[EthClient] Writing to method: ${method}`)
      
      if (this.options.client === 'ethers') {
        const tx = await this.contract[method](...args)
        const receipt = await tx.wait()
        console.log(`[EthClient] Transaction confirmed: ${receipt.transactionHash}`)
        return receipt
      } else {
        const tx = await this.contract.methods[method](...args).send({
          from: this.account.address
        })
        console.log(`[EthClient] Transaction confirmed: ${tx.transactionHash}`)
        return tx
      }
    } catch (error) {
      console.error(`[EthClient] Failed to write to contract method ${method}:`, error)
      throw error
    }
  }

  /**
   * Listen to contract events
   */
  listen(eventName: string, callback: Function): void {
    try {
      console.log(`[EthClient] Setting up listener for event: ${eventName}`)
      
      if (this.options.client === 'ethers') {
        this.contract.on(eventName, (...args: any[]) => {
          console.log(`[EthClient] Event ${eventName} fired`)
          callback(...args)
        })
      } else {
        this.contract.events[eventName]({}, (err: any, event: any) => {
          if (err) {
            console.error(`[EthClient] Error listening to event ${eventName}:`, err)
          } else {
            console.log(`[EthClient] Event ${eventName} fired`)
            callback(event)
          }
        })
      }
    } catch (error) {
      console.error(`[EthClient] Failed to set up event listener for ${eventName}:`, error)
      throw error
    }
  }

  /**
   * Get account address
   */
  getAddress(): string {
    if (this.options.client === 'ethers') {
      return this.wallet?.address || ''
    } else {
      return this.account?.address || ''
    }
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return this.options.contractAddress
  }

  /**
   * Get balance
   */
  async getBalance(): Promise<string> {
    try {
      const address = this.getAddress()
      
      if (this.options.client === 'ethers') {
        const balance = await this.ethersProvider?.getBalance(address)
        return balance?.toString() || '0'
      } else {
        const balance = await this.web3?.eth.getBalance(address)
        return balance?.toString() || '0'
      }
    } catch (error) {
      console.error('[EthClient] Failed to get balance:', error)
      throw error
    }
  }

  /**
   * Cleanup - remove all listeners
   */
  cleanup(): void {
    try {
      if (this.options.client === 'ethers') {
        this.contract?.removeAllListeners()
      } else {
        // Web3 doesn't have a global removeAllListeners, but we can clear the contract
        this.contract = null
      }
      console.log('[EthClient] Cleanup completed')
    } catch (error) {
      console.error('[EthClient] Cleanup error:', error)
    }
  }
}
