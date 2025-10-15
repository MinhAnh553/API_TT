import express from 'express';
import {
    register,
    login,
    getProfile,
    updateProfile,
} from '../../../controllers/authController.js';
import {
    authenticateToken,
    authorize,
} from '../../../middlewares/authMiddleware.js';

const Router = express.Router();

// Public routes (không cần xác thực)
Router.post('/register', register);
Router.post('/login', login);

// Protected routes (cần xác thực)
Router.get('/profile', authenticateToken, getProfile);
Router.put('/profile', authenticateToken, updateProfile);

// Admin only routes
Router.get(
    '/admin/users',
    authenticateToken,
    authorize('admin'),
    async (req, res) => {
        try {
            const User = (await import('../../../models/userModel.js')).default;
            const users = await User.find({}, '-password').sort({
                createdAt: -1,
            });

            res.status(200).json({
                success: true,
                data: { users },
            });
        } catch (error) {
            console.error('Lỗi lấy danh sách users:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message,
            });
        }
    },
);

// Verify token endpoint
Router.get('/verify', authenticateToken, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Token hợp lệ',
        data: {
            user: {
                userId: req.user.userId,
                username: req.user.username,
                email: req.user.email,
                role: req.user.role,
            },
        },
    });
});

export default Router;
