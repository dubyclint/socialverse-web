// middleware/statusMiddleware.js
const UserStatus = require('../models/userStatus');
const StatusUtils = require('../utils/statusUtils');

// Middleware to validate status creation
const validateStatusCreation = async (req, res, next) => {
  try {
    const { content, mediaType = 'text' } = req.body;

    // Validate content
    const contentValidation = StatusUtils.validateStatusContent(content, mediaType);
    if (!contentValidation.isValid) {
      return res.status(400).json({
        success: false,
        errors: contentValidation.errors
      });
    }

    // Validate file if present
    if (req.file) {
      const fileSizeValidation = StatusUtils.validateFileSize(req.file.size, mediaType);
      if (!fileSizeValidation.valid) {
        return res.status(400).json({
          success: false,
          error: fileSizeValidation.error
        });
      }
    }

    // Check user's active status count
    const activeStatusCount = await UserStatus.count({
      where: {
        userId: req.user.id,
        isActive: true,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (activeStatusCount >= 30) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 30 active statuses allowed'
      });
    }

    next();
  } catch (error) {
    console.error('Validate status creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Status validation failed'
    });
  }
};

// Middleware to check status ownership
const checkStatusOwnership = async (req, res, next) => {
  try {
    const { statusId } = req.params;
    const userId = req.user.id;

    const status = await UserStatus.findOne({
      where: { id: statusId, userId }
    });

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Status not found or you do not own this status'
      });
    }

    req.status = status;
    next();
  } catch (error) {
    console.error('Check status ownership error:', error);
    res.status(500).json({
      success: false,
      error: 'Status ownership check failed'
    });
  }
};

module.exports = {
  validateStatusCreation,
  checkStatusOwnership
};
