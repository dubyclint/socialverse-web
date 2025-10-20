const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const complianceRoutes = require('./compliance');
const policyRoutes = require('./policies');
const geoRoutes = require('./geo');
const sanctionsRoutes = require('./sanctions');
const auditRoutes = require('./audit');
const dashboardRoutes = require('./dashboard');

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Compliance Gateway API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API status
router.get('/status', (req, res) => {
  res.json({
    message: 'Compliance Gateway API is running',
    version: '1.0.0',
    features: [
      'RBAC/ABAC Access Control',
      'Geo-fencing',
      'Feature-level Restrictions',
      'Policy Management Dashboard',
      'A/B Testing for Compliance Rules',
      'Sanctions Screening',
      'Audit Trails'
    ],
    endpoints: {
      auth: '/api/v1/auth',
      compliance: '/api/v1/compliance',
      policies: '/api/v1/policies',
      geo: '/api/v1/geo',
      sanctions: '/api/v1/sanctions',
      audit: '/api/v1/audit',
      dashboard: '/api/v1/dashboard'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/compliance', complianceRoutes);
router.use('/policies', policyRoutes);
router.use('/geo', geoRoutes);
router.use('/sanctions', sanctionsRoutes);
router.use('/audit', auditRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
