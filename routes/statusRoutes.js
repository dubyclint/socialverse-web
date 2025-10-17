// routes/statusRoutes.js
const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/status/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'status-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type based on media type
  const mediaType = req.body.mediaType;
  
  if (mediaType === 'image' && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else if (mediaType === 'video' && file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else if (mediaType === 'audio' && file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else if (mediaType === 'text') {
    cb(null, true); // No file needed for text
  } else {
    cb(new Error('Invalid file type for media type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  }
});

// Create status (with optional media upload)
router.post('/create', authenticateToken, upload.single('media'), statusController.createStatus);

// Get user's own statuses
router.get('/my', authenticateToken, statusController.getMyStatuses);

// Get pals' statuses for feed
router.get('/feed', authenticateToken, statusController.getPalsStatuses);

// View specific status
router.get('/:statusId/view', authenticateToken, statusController.viewStatus);

// Delete status
router.delete('/:statusId', authenticateToken, statusController.deleteStatus);

// Get status viewers
router.get('/:statusId/viewers', authenticateToken, statusController.getStatusViewers);

// Get users with unviewed statuses (for blue dot indicator)
router.get('/unviewed-users', authenticateToken, statusController.getUnviewedStatusUsers);

module.exports = router;
