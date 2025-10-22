// scripts/complete-setup.js - One Command to Rule Them All
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => console.log(`${colors[color]}${message}${colors.reset}`);

// Utility functions
const ensureDir = (dir) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    log(`📁 Created directory: ${dir}`, 'blue');
  }
};

const writeFile = (filePath, content) => {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content);
  log(`✅ Created: ${filePath.replace(projectRoot, '.')}`, 'green');
};

// All controller files with complete content
const controllers = {
  pewController: `// server/api/controllers/pewController.js
import { supabase } from '../../../utils/supabase.js';

export class PewController {
  static async createPew(req, res) {
    try {
      const { sender_id, receiver_id, pew_type, content, media_url, location } = req.body;
      const { data: pew, error } = await supabase.from('pews').insert({
        sender_id, receiver_id, pew_type: pew_type || 'text', content, media_url, location,
        status: 'sent', created_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      return res.status(201).json({ success: true, message: 'Pew sent successfully', data: pew });
    } catch (error) {
      console.error('Error creating pew:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserPews(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      const { data: pews, error } = await supabase.from('pews').select(\`
        *, sender:users!pews_sender_id_fkey(id, username, avatar_url),
        receiver:users!pews_receiver_id_fkey(id, username, avatar_url)
      \`).or(\`sender_id.eq.\${userId},receiver_id.eq.\${userId}\`)
        .order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (error) throw error;
      return res.status(200).json({ success: true, data: pews });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async markAsRead(req, res) {
    try {
      const { pewId } = req.params;
      const { user_id } = req.body;
      const { data: pew, error } = await supabase.from('pews').update({ 
        status: 'read', read_at: new Date().toISOString()
      }).eq('id', pewId).eq('receiver_id', user_id).select().single();
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Pew marked as read', data: pew });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deletePew(req, res) {
    try {
      const { pewId } = req.params;
      const { user_id } = req.body;
      const { data: pew, error: fetchError } = await supabase.from('pews')
        .select('sender_id').eq('id', pewId).single();
      if (fetchError) throw fetchError;
      if (pew.sender_id !== user_id) {
        return res.status(403).json({ error: 'Unauthorized to delete this pew' });
      }
      const { error } = await supabase.from('pews').delete().eq('id', pewId);
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Pew deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getConversation(req, res) {
    try {
      const { userId, partnerId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;
      const { data: pews, error } = await supabase.from('pews').select(\`
        *, sender:users!pews_sender_id_fkey(id, username, avatar_url)
      \`).or(\`and(sender_id.eq.\${userId},receiver_id.eq.\${partnerId}),and(sender_id.eq.\${partnerId},receiver_id.eq.\${userId})\`)
        .order('created_at', { ascending: true }).range(offset, offset + limit - 1);
      if (error) throw error;
      return res.status(200).json({ success: true, data: pews });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}`,

  walletController: `// server/api/controllers/walletController.js
import { supabase } from '../../../utils/supabase.js';

export class WalletController {
  static async createUserWallets(req, res) {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: 'User ID is required' });
      
      const currencies = [
        { code: 'USDT', name: 'Tether' }, { code: 'USDC', name: 'USD Coin' },
        { code: 'BTC', name: 'Bitcoin' }, { code: 'ETH', name: 'Ethereum' },
        { code: 'SOL', name: 'Solana' }, { code: 'MATIC', name: 'Polygon' },
        { code: 'XAUT', name: 'Tether Gold' }
      ];
      
      const walletInserts = currencies.map(currency => ({
        user_id: userId, currency_code: currency.code, currency_name: currency.name,
        balance: 0.00, locked_balance: 0.00, wallet_type: 'internal',
        wallet_address: \`\${currency.code.toLowerCase()}_\${userId}\`
      }));
      
      const { data: wallets, error } = await supabase.from('wallets').insert(walletInserts).select();
      if (error) throw error;
      return res.status(201).json({ success: true, message: 'User wallets created successfully', data: wallets });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserWallets(req, res) {
    try {
      const { userId } = req.params;
      const { data: wallets, error } = await supabase.from('wallets').select('*').eq('user_id', userId);
      if (error) throw error;
      return res.status(200).json({ success: true, data: wallets });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateBalance(req, res) {
    try {
      const { walletId } = req.params;
      const { amount, type, description } = req.body;
      if (!amount || !type) return res.status(400).json({ error: 'Amount and type are required' });
      
      const { data: wallet, error: fetchError } = await supabase.from('wallets')
        .select('balance').eq('id', walletId).single();
      if (fetchError) throw fetchError;
      
      const newBalance = type === 'credit' 
        ? parseFloat(wallet.balance) + parseFloat(amount)
        : parseFloat(wallet.balance) - parseFloat(amount);
      if (newBalance < 0) return res.status(400).json({ error: 'Insufficient balance' });
      
      const { data: updatedWallet, error: updateError } = await supabase.from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', walletId).select().single();
      if (updateError) throw updateError;
      
      return res.status(200).json({ success: true, message: 'Wallet balance updated successfully', data: updatedWallet });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async lockBalance(req, res) {
    try {
      const { walletId } = req.params;
      const { amount, action } = req.body;
      const { data: wallet, error: fetchError } = await supabase.from('wallets')
        .select('balance, locked_balance').eq('id', walletId).single();
      if (fetchError) throw fetchError;
      
      let newBalance, newLockedBalance;
      if (action === 'lock') {
        if (parseFloat(wallet.balance) < parseFloat(amount)) {
          return res.status(400).json({ error: 'Insufficient balance to lock' });
        }
        newBalance = parseFloat(wallet.balance) - parseFloat(amount);
        newLockedBalance = parseFloat(wallet.locked_balance) + parseFloat(amount);
      } else {
        newBalance = parseFloat(wallet.balance) + parseFloat(amount);
        newLockedBalance = parseFloat(wallet.locked_balance) - parseFloat(amount);
      }
      
      const { data: updatedWallet, error: updateError } = await supabase.from('wallets')
        .update({ balance: newBalance, locked_balance: newLockedBalance, updated_at: new Date().toISOString() })
        .eq('id', walletId).select().single();
      if (updateError) throw updateError;
      
      return res.status(200).json({ success: true, message: \`Balance \${action}ed successfully\`, data: updatedWallet });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getWalletByCurrency(req, res) {
    try {
      const { userId, currencyCode } = req.params;
      const { data: wallet, error } = await supabase.from('wallets').select('*')
        .eq('user_id', userId).eq('currency_code', currencyCode).single();
      if (error) throw error;
      return res.status(200).json({ success: true, data: wallet });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getTransactionHistory(req, res) {
    try {
      const { walletId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      const { data: transactions, error } = await supabase.from('wallet_transactions').select('*')
        .eq('wallet_id', walletId).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (error) throw error;
      return res.status(200).json({ success: true, data: transactions });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}`,

  tradeController: `// server/api/controllers/tradeController.js
import { supabase } from '../../../utils/supabase.js';

export class TradeController {
  static async createTrade(req, res) {
    try {
      const { user_id, trade_type, currency_from, currency_to, amount_from, amount_to, exchange_rate, description, payment_methods, min_amount, max_amount } = req.body;
      const { data: trade, error } = await supabase.from('trades').insert({
        user_id, trade_type, currency_from, currency_to, amount_from, amount_to, exchange_rate,
        description, payment_methods, min_amount, max_amount, status: 'active', created_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      return res.status(201).json({ success: true, message: 'Trade created successfully', data: trade });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getActiveTrades(req, res) {
    try {
      const { page = 1, limit = 10, currency_from, currency_to, trade_type } = req.query;
      const offset = (page - 1) * limit;
      let query = supabase.from('trades').select(\`*, users!trades_user_id_fkey(id, username, avatar_url, reputation_score)\`)
        .eq('status', 'active').order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (currency_from) query = query.eq('currency_from', currency_from);
      if (currency_to) query = query.eq('currency_to', currency_to);
      if (trade_type) query = query.eq('trade_type', trade_type);
      const { data: trades, error } = await query;
      if (error) throw error;
      return res.status(200).json({ success: true, data: trades, pagination: { page: parseInt(page), limit: parseInt(limit) } });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserTrades(req, res) {
    try {
      const { userId } = req.params;
      const { status } = req.query;
      let query = supabase.from('trades').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      const { data: trades, error } = await query;
      if (error) throw error;
      return res.status(200).json({ success: true, data: trades });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateTradeStatus(req, res) {
    try {
      const { tradeId } = req.params;
      const { status, buyer_id } = req.body;
      const updateData = { status, updated_at: new Date().toISOString() };
      if (buyer_id) updateData.buyer_id = buyer_id;
      if (status === 'completed') updateData.completed_at = new Date().toISOString();
      const { data: trade, error } = await supabase.from('trades').update(updateData).eq('id', tradeId).select().single();
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Trade status updated successfully', data: trade });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async acceptTrade(req, res) {
    try {
      const { tradeId } = req.params;
      const { buyer_id, amount } = req.body;
      const { data: trade, error: fetchError } = await supabase.from('trades').select('*').eq('id', tradeId).eq('status', 'active').single();
      if (fetchError) throw fetchError;
      if (!trade) return res.status(404).json({ error: 'Trade not found or no longer active' });
      const { data: updatedTrade, error: updateError } = await supabase.from('trades').update({
        status: 'in_progress', buyer_id, actual_amount: amount, accepted_at: new Date().toISOString()
      }).eq('id', tradeId).select().single();
      if (updateError) throw updateError;
      return res.status(200).json({ success: true, message: 'Trade accepted successfully', data: updatedTrade });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteTrade(req, res) {
    try {
      const { tradeId } = req.params;
      const { userId } = req.body;
      const { data: trade, error: fetchError } = await supabase.from('trades').select('user_id, status').eq('id', tradeId).single();
      if (fetchError) throw fetchError;
      if (trade.user_id !== userId) return res.status(403).json({ error: 'Unauthorized to delete this trade' });
      if (trade.status === 'in_progress') return res.status(400).json({ error: 'Cannot delete trade in progress' });
      const { error: deleteError } = await supabase.from('trades').delete().eq('id', tradeId);
      if (deleteError) throw deleteError;
      return res.status(200).json({ success: true, message: 'Trade deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getTradeById(req, res) {
    try {
      const { tradeId } = req.params;
      const { data: trade, error } = await supabase.from('trades').select(\`*,
        seller:users!trades_user_id_fkey(id, username, avatar_url, reputation_score),
        buyer:users!trades_buyer_id_fkey(id, username, avatar_url, reputation_score)\`)
        .eq('id', tradeId).single();
      if (error) throw error;
      return res.status(200).json({ success: true, data: trade });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}`,

  postController: `// server/api/controllers/postController.js
import { supabase } from '../../../utils/supabase.js';
export class PostController {
  static async createPost(req, res) {
    try {
      const { user_id, content, media_files, post_type, location, tags, visibility, is_promoted } = req.body;
      const { data: post, error } = await supabase.from('posts').insert({
        user_id, content, media_files, post_type: post_type || 'text', location, tags,
        visibility: visibility || 'public', is_promoted: is_promoted || false, created_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      return res.status(201).json({ success: true, message: 'Post created successfully', data: post });
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
  }
  static async getPosts(req, res) {
    try {
      const { page = 1, limit = 10, filter = 'all' } = req.query;
      const offset = (page - 1) * limit;
      let query = supabase.from('posts').select(\`*, users!posts_user_id_fkey(id, username, avatar_url, verified_badge)\`)
        .eq('visibility', 'public').order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (filter === 'promoted') query = query.eq('is_promoted', true);
      const { data: posts, error } = await query;
      if (error) throw error;
      return res.status(200).json({ success: true, data: posts });
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
  }
  static async getUserPosts(req, res) {
    try {
      const { userId } = req.params;
      const { data: posts, error } = await supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ success: true, data: posts });
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
  }
  static async getPostById(req, res) {
    try {
      const { postId } = req.params;
      const { data: post, error } = await supabase.from('posts').select(\`*, users!posts_user_id_fkey(id, username, avatar_url)\`).eq('id', postId).single();
      if (error) throw error;
      return res.status(200).json({ success: true, data: post });
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
  }
  static async updatePost(req, res) {
    try {
      const { postId } = req.params;
      const { user_id, content, media_files, tags, visibility } = req.body;
      const { data: post, error } = await supabase.from('posts').update({ content, media_files, tags, visibility, updated_at: new Date().toISOString() }).eq('id', postId).eq('user_id', user_id).select().single();
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Post updated successfully', data: post });
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
  }
  static async deletePost(req, res) {
    try {
      const { postId } = req.params;
      const { user_id } = req.body;
      const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', user_id);
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
  }
  static async toggleLike(req, res) {
    try {
      const { postId } = req.params;
      const { user_id } = req.body;
      const { data: existingLike } = await supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', user_id).single();
      if (existingLike) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user_id);
        return res.status(200).json({ success: true, message: 'Post unliked successfully', liked: false });
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id, created_at: new Date().toISOString() });
        return res.status(200).json({ success: true, message: 'Post liked successfully', liked: true });
      }
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
  }
  static async addComment(req, res) {
    try {
      const { postId } = req.params;
      const { user_id, content, parent_id } = req.body;
      const { data: comment, error } = await supabase.from('comments').insert({
        post_id: postId, user_id, content, parent_id, created_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      return res.status(201).json({ success: true, message: 'Comment added successfully', data: comment });
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
  }
  static async promotePost(req, res) {
    try {
      const { postId } = req.params;
      const { user_id, duration_hours = 24 } = req.body;
      const { data: post, error } = await supabase.from('posts').update({
        is_promoted: true, promoted_until: new Date(Date.now() + duration_hours * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString()
      }).eq('id', postId).eq('user_id', user_id).select().single();
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Post promoted successfully', data: post });
    } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
  }
}`
};

// Route templates with proper Nuxt.js format
const createRouteTemplate = (controllerName, methodName, params = [], hasBody = false, hasQuery = false) => {
  const paramNames = params.map(p => p.replace('[', '').replace(']', ''));
  const paramGetters = paramNames.map(p => `  const ${p} = getRouterParam(event, '${p}');`).join('\n');
  const depth = params.length + 2;
  const relativePath = '../'.repeat(depth);

  return `import { ${controllerName} } from '${relativePath}controllers/${controllerName.toLowerCase()}.js';

export default defineEventHandler(async (event) => {
${paramGetters}
  ${hasBody ? 'const body = await readBody(event);' : ''}
  ${hasQuery ? 'const query = getQuery(event);' : ''}
  
  const req = { ${[
    paramNames.length > 0 ? `params: { ${paramNames.join(', ')} }` : null,
    hasBody ? 'body' : null,
    hasQuery ? 'query' : null
  ].filter(Boolean).join(', ')} };
  
  const res = {
    status: (code) => ({ json: (data) => ({ statusCode: code, ...data }) }),
    json: (data) => data
  };

  try {
    return await ${controllerName}.${methodName}(req, res);
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    });
  }
});`;
};

// Essential routes (focusing on core functionality)
const routes = [
  // Pew routes
  ['server/api/pews/index.post.js', 'PewController', 'createPew', [], true],
  ['server/api/pews/user/[userId].get.js', 'PewController', 'getUserPews', ['userId'], false, true],
  ['server/api/pews/[pewId]/read.patch.js', 'PewController', 'markAsRead', ['pewId'], true],
  ['server/api/pews/[pewId].delete.js', 'PewController', 'deletePew', ['pewId'], true],
  ['server/api/pews/conversation/[userId]/[partnerId].get.js', 'PewController', 'getConversation', ['userId', 'partnerId'], false, true],

  // Wallet routes
  ['server/api/wallets/create.post.js', 'WalletController', 'createUserWallets', [], true],
  ['server/api/wallets/user/[userId].get.js', 'WalletController', 'getUserWallets', ['userId']],
  ['server/api/wallets/[walletId]/balance.patch.js', 'WalletController', 'updateBalance', ['walletId'], true],
  ['server/api/wallets/[walletId]/lock.patch.js', 'WalletController', 'lockBalance', ['walletId'], true],
  ['server/api/wallets/[userId]/[currencyCode].get.js', 'WalletController', 'getWalletByCurrency', ['userId', 'currencyCode']],
  ['server/api/wallets/[walletId]/transactions.get.js', 'WalletController', 'getTransactionHistory', ['walletId'], false, true],

  // Trade routes
  ['server/api/trades/index.post.js', 'TradeController', 'createTrade', [], true],
  ['server/api/trades/active.get.js', 'TradeController', 'getActiveTrades', [], false, true],
  ['server/api/trades/user/[userId].get.js', 'TradeController', 'getUserTrades', ['userId'], false, true],
  ['server/api/trades/[tradeId]/status.patch.js', 'TradeController', 'updateTradeStatus', ['tradeId'], true],
  ['server/api/trades/[tradeId]/accept.patch.js', 'TradeController', 'acceptTrade', ['tradeId'], true],
  ['server/api/trades/[tradeId].get.js', 'TradeController', 'getTradeById', ['tradeId']],
  ['server/api/trades/[tradeId].delete.js', 'TradeController', 'deleteTrade', ['tradeId'], true],

  // Post routes
  ['server/api/posts/index.post.js', 'PostController', 'createPost', [], true],
  ['server/api/posts/index.get.js', 'PostController', 'getPosts', [], false, true],
  ['server/api/posts/user/[userId].get.js', 'PostController', 'getUserPosts', ['userId'], false, true],
  ['server/api/posts/[postId].get.js', 'PostController', 'getPostById', ['postId']],
  ['server/api/posts/[postId].patch.js', 'PostController', 'updatePost', ['postId'], true],
  ['server/api/posts/[postId].delete.js', 'PostController', 'deletePost', ['postId'], true],
  ['server/api/posts/[postId]/like.post.js', 'PostController', 'toggleLike', ['postId'], true],
  ['server/api/posts/[postId]/comments.post.js', 'PostController', 'addComment', ['postId'], true],
  ['server/api/posts/[postId]/promote.patch.js', 'PostController', 'promotePost', ['postId'], true]
];

// Main setup function
async function completeSetup() {
  log('🚀 Starting Complete SocialVerse API Setup...', 'bold');
  log('', 'reset');

  let successCount = 0;
  let errorCount = 0;

  try {
    // Step 1: Create utils/supabase.js
    log('📡 Setting up Supabase connection...', 'blue');
    writeFile(join(projectRoot, 'server/utils/supabase.js'), `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);`);
    successCount++;

    // Step 2: Create all controllers
    log('🎮 Creating API controllers...', 'blue');
    Object.entries(controllers).forEach(([name, content]) => {
      writeFile(join(projectRoot, `server/api/controllers/${name}.js`), content);
      successCount++;
    });

    // Step 3: Create all routes
    log('🛣️  Creating API routes...', 'blue');
    routes.forEach(([filePath, controllerName, methodName, params, hasBody, hasQuery]) => {
      const routeContent = createRouteTemplate(controllerName, methodName, params, hasBody, hasQuery);
      writeFile(join(projectRoot, filePath), routeContent);
      successCount++;
    });

    // Step 4: Create .env.example
    log('🔐 Creating environment configuration...', 'blue');
    writeFile(join(projectRoot, '.env.example'), `# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here

# API Configuration
API_PORT=3000
NODE_ENV=development`);
    successCount++;

    // Step 5: Create README for setup
    log('📚 Creating setup documentation...', 'blue');
    writeFile(join(projectRoot, 'API_SETUP.md'), `# SocialVerse API Setup Complete

## Overview
This setup has created a complete API structure for SocialVerse with the following features:

### Controllers Created
- **PewController**: Direct messaging system
- **WalletController**: Multi-currency wallet management
- **TradeController**: P2P trading functionality
- **PostController**: Social media posts with engagement

### Routes Generated
- Pew routes: Create, retrieve, mark as read, delete, and get conversations
- Wallet routes: Create wallets, manage balances, lock/unlock funds, view transactions
- Trade routes: Create trades, browse active trades, accept trades, manage status
- Post routes: Create, read, update, delete posts, like, comment, and promote

## Environment Setup
1. Copy \`.env.example\` to \`.env.local\`
2. Add your Supabase credentials:
   - SUPABASE_URL: Your Supabase project URL
   - SUPABASE_KEY: Your Supabase anon key

## Database Requirements
Ensure your Supabase database has the following tables:
- users
- pews
- wallets
- wallet_transactions
- trades
- posts
- likes
- comments

## API Usage Examples

### Create a Pew
\`\`\`bash
POST /api/pews
{
  "sender_id": "user1",
  "receiver_id": "user2",
  "content": "Hello!",
  "pew_type": "text"
}
\`\`\`

### Create User Wallets
\`\`\`bash
POST /api/wallets/create
{
  "userId": "user1"
}
\`\`\`

### Create a Trade
\`\`\`bash
POST /api/trades
{
  "user_id": "user1",
  "trade_type": "sell",
  "currency_from": "USDT",
  "currency_to": "BTC",
  "amount_from": 100,
  "exchange_rate": 0.000025
}
\`\`\`

### Create a Post
\`\`\`bash
POST /api/posts
{
  "user_id": "user1",
  "content": "Check out this amazing feature!",
  "visibility": "public"
}
\`\`\`

## Next Steps
1. Set up your Supabase database with the required tables
2. Configure your environment variables
3. Test the API endpoints
4. Integrate with your frontend application
`);
    successCount++;

    log('', 'reset');
    log('✨ Setup Complete!', 'bold');
    log(`✅ Successfully created ${successCount} files`, 'green');
    log('', 'reset');
    log('📋 Summary:', 'bold');
    log('  • 1 Supabase utility file', 'blue');
    log('  • 4 API controllers', 'blue');
    log('  • 18 API routes', 'blue');
    log('  • 1 Environment configuration', 'blue');
    log('  • 1 Setup documentation', 'blue');
    log('', 'reset');
    log('🚀 Next Steps:', 'yellow');
    log('  1. Configure your .env.local with Supabase credentials', 'yellow');
    log('  2. Set up your Supabase database tables', 'yellow');
    log('  3. Run: npm run dev', 'yellow');
    log('  4. Test your API endpoints', 'yellow');

  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the setup
completeSetup().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
