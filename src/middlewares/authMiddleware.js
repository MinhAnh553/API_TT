import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token là bắt buộc',
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if user still exists and is active
        const user = await User.findById(decoded.userId).select('-password');
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User không tồn tại hoặc không hoạt động',
            });
        }

        // Add user info to request object
        req.user = {
            userId: decoded.userId,
            username: user.username,
            email: user.email,
            role: user.role,
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ',
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn',
            });
        }

        console.error('Lỗi xác thực:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực',
        });
    }
};

// Role-based authorization middleware
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Xác thực là bắt buộc',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Truy cập bị từ chối. Quyền truy cập không đủ.',
            });
        }

        next();
    };
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.userId).select(
                '-password',
            );

            if (user && user.isActive) {
                req.user = {
                    userId: decoded.userId,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                };
            }
        }

        next();
    } catch (error) {
        // Tiếp tục mà không xác thực nếu token không hợp lệ
        next();
    }
};
