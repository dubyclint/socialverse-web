// server/api/middleware/auth.js
// ✅ FIXED - Now imports from the master auth-utils file
import { authenticateUser, requireAdmin, requireManager } from '../../utils/auth-utils.ts';

export { authenticateUser, requireAdmin, requireManager };

export default authenticateUser;
