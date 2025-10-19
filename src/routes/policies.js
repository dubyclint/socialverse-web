const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const policyController = require('../controllers/policyController');
const auth = require('../middleware/auth');

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
 * @route GET /api/v1/policies
 * @desc Get all policies with filtering
 * @access Private (Admin only)
 */
router.get('/',
  auth.authenticate,
  auth.requireRole(['admin', 'compliance_manager']),
  [
    query('feature').optional().isString(),
    query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'DRAFT']),
    query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  policyController.getAllPolicies
);

/**
 * @route GET /api/v1/policies/:id
 * @desc Get policy by ID
 * @access Private (Admin only)
 */
router.get('/:id',
  auth.authenticate,
  auth.requireRole(['admin', 'compliance_manager']),
  [
    param('id').isUUID().withMessage('Invalid policy ID')
  ],
  validateRequest,
  policyController.getPolicyById
);

/**
 * @route POST /api/v1/policies
 * @desc Create new policy
 * @access Private (Admin only)
 */
router.post('/',
  auth.authenticate,
  auth.requireRole(['admin', 'compliance_manager']),
  [
    body('name').notEmpty().withMessage('Policy name is required'),
    body('description').optional().isString(),
    body('feature').notEmpty().withMessage('Feature is required'),
    body('priority').isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Invalid priority'),
    body('rules').isObject().withMessage('Rules must be an object'),
    body('targetCriteria').optional().isObject()
  ],
  validateRequest,
  policyController.createPolicy
);

/**
 * @route PUT /api/v1/policies/:id
 * @desc Update policy
 * @access Private (Admin only)
 */
router.put('/:id',
  auth.authenticate,
  auth.requireRole(['admin', 'compliance_manager']),
  [
    param('id').isUUID().withMessage('Invalid policy ID'),
    body('name').optional().isString(),
    body('description').optional().isString(),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('rules').optional().isObject(),
    body('targetCriteria').optional().isObject(),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'DRAFT'])
  ],
  validateRequest,
  policyController.updatePolicy
);

/**
 * @route DELETE /api/v1/policies/:id
 * @desc Delete policy
 * @access Private (Admin only)
 */
router.delete('/:id',
  auth.authenticate,
  auth.requireRole(['admin']),
  [
    param('id').isUUID().withMessage('Invalid policy ID')
  ],
  validateRequest,
  policyController.deletePolicy
);

/**
 * @route POST /api/v1/policies/:id/test
 * @desc Test policy against sample data
 * @access Private (Admin only)
 */
router.post('/:id/test',
  auth.authenticate,
  auth.requireRole(['admin', 'compliance_manager']),
  [
    param('id').isUUID().withMessage('Invalid policy ID'),
    body('testData').isObject().withMessage('Test data is required')
  ],
  validateRequest,
  policyController.testPolicy
);

module.exports = router;
