// composables/use-wallet.ts
// ============================================================================
// CONSOLIDATED WALLET COMPOSABLE - MODULAR EXPORTS
// ============================================================================

import { ref, computed, readonly } from 'vue'
import WalletFactoryABI from '@/abis/WalletFactory.json'

// Lazy load ethers
let ethers: any = null;

async function getEthers() {
  if (!ethers) {
    const module = await import('ethers');
    ethers = module.ethers;
  }
  return ethers;
}

// Wallet state
const walletAddress = ref<string | null>(null)
const isConnected = ref(false)
const balance = ref<string>('0')
const chainId = ref<number | null>(null)
const provider = ref<any>(null)
const signer = ref<any>(null)

export const useWallet = () => {
  /**
   * Connect wallet
   */
  const connect = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('No Ethereum provider found. Please install MetaMask.')
      }

      const ethersLib = await getEthers();
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      // Setup provider and signer
      provider.value = new ethersLib.BrowserProvider(window.ethereum)
      signer.value = await provider.value.getSigner()
      walletAddress.value = accounts[0]
      isConnected.value = true

      // Get chain ID
      const network = await provider.value.getNetwork()
      chainId.value = Number(network.chainId)

      // Get balance
      await updateBalance()

      console.log('[Wallet] Connected:', walletAddress.value)
      return walletAddress.value
    } catch (error) {
      console.error('[Wallet] Connection failed:', error)
      throw error
    }
  }

  /**
   * Disconnect wallet
   */
  const disconnect = () => {
    walletAddress.value = null
    isConnected.value = false
    balance.value = '0'
    chainId.value = null
    provider.value = null
    signer.value = null
    console.log('[Wallet] Disconnected')
  }

  /**
   * Update balance
   */
  const updateBalance = async () => {
    if (!walletAddress.value || !provider.value) {
      return
    }

    try {
      const ethersLib = await getEthers();
      const bal = await provider.value.getBalance(walletAddress.value)
      balance.value = ethersLib.formatEther(bal)
    } catch (error) {
      console.error('[Wallet] Failed to update balance:', error)
    }
  }

  /**
   * Send transaction
   */
  const sendTransaction = async (to: string, amount: string) => {
    if (!signer.value) {
      throw new Error('Wallet not connected')
    }

    try {
      const ethersLib = await getEthers();
      const tx = await signer.value.sendTransaction({
        to,
        value: ethersLib.parseEther(amount)
      })

      await tx.wait()
      await updateBalance()
      
      return tx
    } catch (error) {
      console.error('[Wallet] Transaction failed:', error)
      throw error
    }
  }

  return {
    // State
    walletAddress: readonly(walletAddress),
    isConnected: readonly(isConnected),
    balance: readonly(balance),
    chainId: readonly(chainId),
    provider: readonly(provider),
    signer: readonly(signer),
    
    // Methods
    connect,
    disconnect,
    updateBalance,
    sendTransaction
  }
}
