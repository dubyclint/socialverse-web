// plugins/gun-client.ts  - SSR-Safe Version
// Initialize only on client side to prevent SSR errors

let gun = null;
let user = null;
let SEA = null;

// SSR-safe initialization
function initGun() {
  if (typeof window === 'undefined') {
    // Server-side: return mock to prevent errors
    return null;
  }
  
  if (!gun) {
    // Client-side: use window.Gun from CDN
    const Gun = window.Gun;
    if (!Gun) {
      console.warn('Gun not loaded. Make sure gun.min.js is loaded from CDN.');
      return null;
    }
    
    gun = Gun(['https://gun-messaging-peer.herokuapp.com/gun']);
    SEA = Gun.SEA;
  }
  
  return gun;
}

// Create user instance for authentication - LAZY INITIALIZATION
const getUser = () => {
  const gunInstance = initGun();
  if (!gunInstance) return null;
  
  if (!user) {
    user = gunInstance.user();
  }
  return user;
};

// Helper functions for common operations
const gunHelpers = {
  // Get data from a specific path
  async get(path) {
    const gunInstance = initGun();
    if (!gunInstance) return null;
    
    return new Promise((resolve) => {
      gunInstance.get(path).once((data) => {
        resolve(data);
      });
    });
  },

  // Set data at a specific path
  set(path, data) {
    const gunInstance = initGun();
    if (!gunInstance) return;
    
    gunInstance.get(path).put(data);
  },

  // Authentication helpers
  auth: {
    async create(username, password) {
      const userInstance = getUser();
      if (!userInstance) throw new Error('Gun not available');
      
      return new Promise((resolve, reject) => {
        userInstance.create(username, password, (ack) => {
          if (ack.err) {
            reject(new Error(ack.err));
          } else {
            resolve(ack);
          }
        });
      });
    },

    async login(username, password) {
      const userInstance = getUser();
      if (!userInstance) throw new Error('Gun not available');
      
      return new Promise((resolve, reject) => {
        userInstance.auth(username, password, (ack) => {
          if (ack.err) {
            reject(new Error(ack.err));
          } else {
            resolve(ack);
          }
        });
      });
    },

    logout() {
      const userInstance = getUser();
      if (userInstance) {
        userInstance.leave();
      }
    },

    getCurrentUser() {
      const userInstance = getUser();
      return userInstance ? userInstance.is : null;
    }
  },

  // Post operations
  posts: {
    create(postData) {
      const gunInstance = initGun();
      const userInstance = getUser();
      if (!gunInstance) return null;
      
      const post = {
        ...postData,
        id: window.Gun ? window.Gun.node.lex : Date.now().toString(),
        timestamp: window.Gun ? window.Gun.state() : Date.now(),
        author: userInstance?.is?.pub || 'anonymous'
      };
      
      gunInstance.get('posts').set(post);
      return post;
    },

    getAll(callback) {
      const gunInstance = initGun();
      if (!gunInstance) return;
      
      gunInstance.get('posts').map().on(callback);
    },

    getById(id, callback) {
      const gunInstance = initGun();
      if (!gunInstance) return;
      
      gunInstance.get('posts').get(id).on(callback);
    }
  }
};

// Export everything needed - maintain original exports
export { initGun as gun, getUser as user, gunHelpers };

// For SEA access
export const getSEA = () => {
  if (typeof window !== 'undefined' && window.Gun) {
    return window.Gun.SEA;
  }
  return null;
};

// Default export for compatibility
export default initGun;

