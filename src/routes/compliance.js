const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const complianceController = require('../controllers/complianceController');
const auth = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * @route POST /api/v1/compliance/check
 * @desc Main compliance check endpoint
 * @access Public (but rate limited)
 */
router.post('/check',
  rateLimit.complianceCheck,
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('feature').notEmpty().withMessage('Feature is required'),
    body('context').optional().isObject().withMessage('Context must be an object')
  ],
  validateRequest,
  complianceController.checkCompliance
);

/**
 * @route POST /api/v1/compliance/batch-check
 * @desc Batch compliance check for multiple features
 * @access Public (but rate limited)
 */
router.post('/batch-check',
  rateLimit.complianceCheck,
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('features').isArray().withMessage('Features must be an array'),
    body('context').optional().isObject().withMessage('Context must be an object')
  ],
  validateRequest,
  complianceController.batchCheck
);

/**
 * @route GET /api/v1/compliance/user/:userId/restrictions
 * @desc Get user's current restrictions
 * @access Private
 */
router.get('/user/:userId/restrictions',
  auth.authenticate,
  [
    param('userId').notEmpty().withMessage('User ID is required')
  ],
  validateRequest,
  complianceController.getUserRestrictions
);

/**
 * @route GET /api/v1/compliance/feature/:feature/availability
 * @desc Check feature availability by location
 * @access Public
 */
router.get('/feature/:feature/availability',
  [
    param('feature').notEmpty().withMessage('Feature is required'),
    query('country').optional().isLength({ min: 2, max: 2 }).withMessage('Country must be 2-letter code'),
    query('region').optional().isString().withMessage('Region must be a string')
  ],
  validateRequest,
  complianceController.getFeatureAvailability
);

/**
 * @route POST /api/v1/compliance/simulate
 * @desc Simulate compliance check (for testing)
 * @access Private (Admin only)
 */
router.post('/simulate',
  auth.authenticate,
  auth.requireRole(['admin']),
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('feature').notEmpty().withMessage('Feature is required'),
    body('context').isObject().withMessage('Context is required'),
    body('overrides').optional().isObject().withMessage('Overrides must be an object')
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Simulation logic would go here
      res.json({
        simulation: true,
        message: 'Compliance simulation endpoint - implementation pending'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
