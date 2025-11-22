# API Migration Guide

## Old Routes → New API Endpoints

### Admin Routes
- `POST /admin/stats` → `POST /api/admin` (action: 'get_stats')
- `POST /admin/users/ban` → `POST /api/admin` (action: 'ban_user')
- `POST /admin/users/verify` → `POST /api/admin` (action: 'verify_user')
- `POST /admin/balance/adjust` → `POST /api/admin` (action: 'adjust_balance')
- `POST /admin/managers/assign` → `POST /api/admin` (action: 'assign_manager')
- `GET /admin/content/flagged` → `POST /api/admin` (action: 'flag_content')
- `GET /admin/activity` → `POST /api/admin` (action: 'get_activity')

### Stream Routes
- `POST /stream/create` → `POST /api/stream` (action: 'create')
- `GET /stream/:id` → `GET /api/stream/:id`
- `GET /stream/user/:userId` → `GET /api/stream/user`
- `POST /stream/update` → `POST /api/stream` (action: 'update')
- `POST /stream/delete` → `POST /api/stream` (action: 'delete')

### Group Chat Routes
- `POST /group-chat/create` → `POST /api/group-chat` (action: 'create')
- `GET /group-chat` → `GET /api/group-chat/user`
- `POST /group-chat/add-member` → `POST /api/group-chat` (action: 'add_member')
- `POST /group-chat/remove-member` → `POST /api/group-chat` (action: 'remove_member')

### Wallet Lock Routes
- `POST /wallet-lock/lock` → `POST /api/wallet-lock` (action: 'lock')
- `POST /wallet-lock/unlock` → `POST /api/wallet-lock` (action: 'unlock')
- `GET /wallet-lock` → `POST /api/wallet-lock` (action: 'get_locks')

### Gift Routes
- `POST /pew-gift/send` → `POST /api/pew-gift` (action: 'send')
- `GET /pew-gift` → `POST /api/pew-gift` (action: 'get')
- `POST /pew-gift/cancel` → `POST /api/pew-gift` (action: 'cancel')

### Status Routes
- `POST /status/create` → `POST /api/status` (action: 'create')
- `GET /status` → `POST /api/status` (action: 'get')
- `POST /status/delete` → `POST /api/status` (action: 'delete')

### Premium Routes
- `GET /premium/pricing` → `GET /api/premium?action=pricing`
- `GET /premium/subscription` → `GET /api/premium?action=subscription`
- `GET /premium/check/:feature` → `GET /api/premium?action=check_feature&feature_key=:feature`

### Posts Routes
- `GET /api/posts` → `GET /api/posts?page=1`
- `POST /api/posts` → `POST /api/posts` (create post)

## How to Use the New API

### Using the useApi() Composable (Recommended)

```javascript
const api = useApi()

// Admin operations
await api.admin.getStats()
await api.admin.banUser(userId, reason)
await api.admin.verifyUser(userId)

// Stream operations
await api.stream.create(streamData)
await api.stream.get(streamId)
await api.stream.getUserStreams()

// Gift operations
await api.gift.send(recipientId, amount)
await api.gift.getGifts()

// And more...
