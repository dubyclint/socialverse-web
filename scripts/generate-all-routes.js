// scripts/generate-all-routes.js
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const createRouteTemplate = (controllerName, methodName, params = [], hasBody = false, hasQuery = false) => {
  const paramNames = params.map(p => p.replace('[', '').replace(']', ''));
  const paramGetters = paramNames.map(p => `const ${p} = getRouterParam(event, '${p}');`).join('\n  ');
  
  const reqObject = {
    params: paramNames.length > 0 ? `{ ${paramNames.join(', ')} }` : undefined,
    body: hasBody ? 'body' : undefined,
    query: hasQuery ? 'query' : undefined
  };
  
  const reqParts = Object.entries(reqObject)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  return `import { ${controllerName} } from '${'../'.repeat(params.length + 2)}controllers/${controllerName.toLowerCase()}.js';

export default defineEventHandler(async (event) => {
  ${paramGetters}
  ${hasBody ? 'const body = await readBody(event);' : ''}
  ${hasQuery ? 'const query = getQuery(event);' : ''}
  
  const req = { ${reqParts} };
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
  ['server/api/posts/[postId]/promote.patch.js', 'PostController', 'promotePost', ['postId'], true],

  // Pal routes
  ['server/api/pals/request.post.js', 'PalController', 'sendPalRequest', [], true],
  ['server/api/pals/[requestId]/accept.patch.js', 'PalController', 'acceptPalRequest', ['requestId'], true],
  ['server/api/pals/[requestId]/decline.patch.js', 'PalController', 'declinePalRequest', ['requestId'], true],
  ['server/api/pals/user/[userId].get.js', 'PalController', 'getUserPals', ['userId'], false, true],
  ['server/api/pals/requests/[userId].get.js', 'PalController', 'getPendingRequests', ['userId'], false, true],
  ['server/api/pals/[palId]/block.patch.js', 'PalController', 'toggleBlockPal', ['palId'], true],
  ['server/api/pals/[palId].delete.js', 'PalController', 'removePal', ['palId'], true],
  ['server/api/pals/status/[userId]/[targetUserId].get.js', 'PalController', 'checkPalStatus', ['userId', 'targetUserId']],

  // Gift routes
  ['server/api/gifts/send.post.js', 'GiftController', 'sendGift', [], true],
  ['server/api/gifts/received/[userId].get.js', 'GiftController', 'getReceivedGifts', ['userId'], false, true],
  ['server/api/gifts/sent/[userId].get.js', 'GiftController', 'getSentGifts', ['userId'], false, true],
  ['server/api/gifts/types.get.js', 'GiftController', 'getGiftTypes', []],
  ['server/api/gifts/[giftId]/accept.patch.js', 'GiftController', 'acceptGift', ['giftId'], true],
  ['server/api/gifts/[giftId]/decline.patch.js', 'GiftController', 'declineGift', ['giftId'], true],
  ['server/api/gifts/stats/[userId].get.js', 'GiftController', 'getGiftStats', ['userId']],
  ['server/api/gifts/pew.post.js', 'GiftController', 'sendPewGift', [], true],

  // Notification routes
  ['server/api/notifications/index.post.js', 'NotificationController', 'createNotification', [], true],
  ['server/api/notifications/user/[userId].get.js', 'NotificationController', 'getUserNotifications', ['userId'], false, true],
  ['server/api/notifications/[notificationId]/read.patch.js', 'NotificationController', 'markAsRead', ['notificationId'], true],
  ['server/api/notifications/user/[userId]/read-all.patch.js', 'NotificationController', 'markAllAsRead', ['userId']],
  ['server/api/notifications/[notificationId].delete.js', 'NotificationController', 'deleteNotification', ['notificationId'], true],
  ['server/api/notifications/user/[userId]/unread-count.get.js', 'NotificationController', 'getUnreadCount', ['userId']],
  ['server/api/notifications/bulk.post.js', 'NotificationController', 'sendBulkNotifications', [], true],
  ['server/api/notifications/preferences/[userId].get.js', 'NotificationController', 'getNotificationPreferences', ['userId']],
  ['server/api/notifications/preferences/[userId].patch.js', 'NotificationController', 'updateNotificationPreferences', ['userId'], true],

  // P2P routes
  ['server/api/p2p/profile.post.js', 'P2PController', 'createP2PProfile', [], true],
  ['server/api/p2p/profile/[userId].get.js', 'P2PController', 'getP2PProfile', ['userId']],
  ['server/api/p2p/profile/[userId].patch.js', 'P2PController', 'updateP2PProfile', ['userId'], true],
  ['server/api/p2p/traders.get.js', 'P2PController', 'getActiveTraders', [], false, true],
  ['server/api/p2p/reputation/[userId].patch.js', 'P2PController', 'updateReputation', ['userId'], true],
  ['server/api/p2p/ratings/[userId].get.js', 'P2PController', 'getUserRatings', ['userId'], false, true],
  ['server/api/p2p/stats/[userId].patch.js', 'P2PController', 'updateTradeStats', ['userId'], true],
  ['server/api/p2p/[userId]/block.post.js', 'P2PController', 'toggleBlockTrader', ['userId'], true],

  // Match routes
  ['server/api/matches/request.post.js', 'MatchController', 'createMatchRequest', [], true],
  ['server/api/matches/[requestId]/accept.patch.js', 'MatchController', 'acceptMatchRequest', ['requestId'], true],
  ['server/api/matches/[requestId]/decline.patch.js', 'MatchController', 'declineMatchRequest', ['requestId'], true],
  ['server/api/matches/user/[userId].get.js', 'MatchController', 'getUserMatchRequests', ['userId'], false, true],
  ['server/api/matches/[requestId]/status.patch.js', 'MatchController', 'updateMatchStatus', ['requestId'], true],
  ['server/api/matches/nearby/[userId].get.js', 'MatchController', 'getNearbyUsers', ['userId'], false, true],
  ['server/api/matches/stats/[userId].get.js', 'MatchController', 'getMatchStats', ['userId']],
  ['server/api/matches/[requestId]/report.post.js', 'MatchController', 'reportMatch', ['requestId'], true],

  // Swap routes
  ['server/api/swaps/index.post.js', 'SwapController', 'createSwap', [], true],
  ['server/api/swaps/[swapId]/execute.patch.js', 'SwapController', 'executeSwap', ['swapId'], true],
  ['server/api/swaps/user/[userId].get.js', 'SwapController', 'getUserSwaps', ['userId'], false, true],
  ['server/api/swaps/[swapId]/cancel.patch.js', 'SwapController', 'cancelSwap', ['swapId'], true],
  ['server/api/swaps/rates.get.js', 'SwapController', 'getExchangeRates', [], false, true],
  ['server/api/swaps/stats/[userId].get.js', 'SwapController', 'getSwapStats', ['userId']],
  ['server/api/swaps/estimate.get.js', 'SwapController', 'estimateSwap', [], false, true],

  // Universe routes
  ['server/api/universe/messages.post.js', 'UniverseController', 'sendUniverseMessage', [], true],
  ['server/api/universe/messages.get.js', 'UniverseController', 'getUniverseMessages', [], false, true],
  ['server/api/universe/trending.get.js', 'UniverseController', 'getTrendingMessages', [], false, true],
  ['server/api/universe/[messageId]/react.post.js', 'UniverseController', 'reactToMessage', ['messageId'], true],
  ['server/api/universe/[messageId].delete.js', 'UniverseController', 'deleteUniverseMessage', ['messageId'], true],
  ['server/api/universe/[messageId]/report.post.js', 'UniverseController', 'reportMessage', ['messageId'], true],
  ['server/api/universe/user/[userId].get.js', 'UniverseController', 'getUserUniverseMessages', ['userId'], false, true],
  ['server/api/universe/stats.get.js', 'UniverseController', 'getUniverseStats', [], false, true],
  ['server/api/universe/[messageId]/pin.patch.js', 'UniverseController', 'togglePinMessage', ['messageId'], true],

  // Escrow routes
  ['server/api/escrow/index.post.js', 'EscrowController', 'createEscrow', [], true],
  ['server/api/escrow/[escrowId]/accept.patch.js', 'EscrowController', 'acceptEscrow', ['escrowId'], true],
  ['server/api/escrow/[escrowId]/release.patch.js', 'EscrowController', 'releaseEscrow', ['escrowId'], true],
  ['server/api/escrow/[escrowId]/cancel.patch.js', 'EscrowController', 'cancelEscrow', ['escrowId'], true],
  ['server/api/escrow/[escrowId]/dispute.post.js', 'EscrowController', 'disputeEscrow', ['escrowId'], true],
  ['server/api/escrow/user/[userId].get.js', 'EscrowController', 'getUserEscrows', ['userId'], false, true],
  ['server/api/escrow/stats/[userId].get.js', 'EscrowController', 'getEscrowStats', ['userId']],
  ['server/api/escrow/auto-release.post.js', 'EscrowController', 'autoReleaseEscrows', [], true],

  // New user routes
  ['server/api/new/profile.post.js', 'NewController', 'createUserProfile', [], true],
  ['server/api/new/welcome-post.post.js', 'NewController', 'createWelcomePost', [], true],
  ['server/api/new/features.post.js', 'NewController', 'initializeNewFeatures', [], true],
  ['server/api/new/onboarding/[userId].get.js', 'NewController', 'getOnboardingProgress', ['userId']],
  ['server/api/new/sample-content.post.js', 'NewController', 'createSampleContent', [], true],
  ['server/api/new/suggestions/[userId].get.js', 'NewController', 'suggestConnections', ['userId'], false, true],
];

// Generate all routes
let createdCount = 0;
routes.forEach(([filePath, controllerName, methodName, params, hasBody, hasQuery]) => {
  try {
    mkdirSync(dirname(filePath), { recursive: true });
    const content = createRouteTemplate(controllerName, methodName, params, hasBody, hasQuery);
    writeFileSync(filePath, content);
    console.log(`✅ Created ${filePath}`);
    createdCount++;
  } catch (error) {
    console.error(`❌ Failed to create ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 Generated ${createdCount} API route files successfully!`);
console.log('\n📝 Next steps:');
console.log('1. Move your controllers to server/api/controllers/');
console.log('2. Update import paths in the generated routes if needed');
console.log('3. Test your API endpoints');
console.log('4. Add authentication middleware where needed');
