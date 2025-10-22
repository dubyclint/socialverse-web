import { UserWalletModel } from '~/server/models/UserWallet'
import { supabase } from '~/server/db'

interface WalletUpdateRequest {
  userId: string
  balances?: {
    usdt?: number
    usdc?: number
    btc?: number
    eth?: number
    sol?: number
    matic?: number
    xaut?: number
  }
}

export default defineEventHandler(async (event) => {
  try {
    const method = event.node.req.method

    if (method === 'GET') {
      return await handleGetWallet(event)
    } else if (method === 'POST') {
      return await handleCreateWallet(event)
    } else if (method === 'PUT') {
      return await handleUpdateWallet(event)
    } else {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method Not Allowed'
      })
    }
  } catch (error: any) {
    console.error('Wallet route error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Internal Server Error'
    })
  }
})

async function handleGetWallet(event: any) {
  const query = getQuery(event)
  const { userId } = query

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required'
    })
  }

  try {
    const wallet = await UserWalletModel.getByUserId(userId as string)

    if (!wallet) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Wallet not found'
      })
    }

    return {
      success: true,
      wallet
    }
  } catch (error: any) {
    console.error('Get wallet error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch wallet'
    })
  }
}

async function handleCreateWallet(event: any) {
  const body = await readBody<{ userId: string }>(event)

  if (!body.userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required'
    })
  }

  try {
    // Check if wallet already exists
    const existing = await UserWalletModel.getByUserId(body.userId)
    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Wallet already exists for this user'
      })
    }

    const wallet = await UserWalletModel.create(body.userId)

    return {
      success: true,
      wallet,
      message: 'Wallet created successfully'
    }
  } catch (error: any) {
    console.error('Create wallet error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to create wallet'
    })
  }
}

async function handleUpdateWallet(event: any) {
  const body = await readBody<WalletUpdateRequest>(event)

  if (!body.userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required'
    })
  }

  try {
    const wallet = await UserWalletModel.getByUserId(body.userId)

    if (!wallet) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Wallet not found'
      })
    }

    if (body.balances) {
      const updatedWallet = await UserWalletModel.updateBalances(body.userId, {
        ...wallet.balances,
        ...body.balances
      })

      return {
        success: true,
        wallet: updatedWallet,
        message: 'Wallet updated successfully'
      }
    }

    return {
      success: true,
      wallet,
      message: 'No updates provided'
    }
  } catch (error: any) {
    console.error('Update wallet error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to update wallet'
    })
  }
}
