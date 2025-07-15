const express = require('express');
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  deleteUser,
} = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', authMiddleware, getUserProfile);
router.put('/me', authMiddleware, updateUserProfile);
router.delete('/me', authMiddleware, deleteUser);

module.exports = router;
