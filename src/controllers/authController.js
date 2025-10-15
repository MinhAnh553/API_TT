import jwt from 'jsonwebtoken';
import Joi from 'joi';
import User from '../models/userModel.js';

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Validation schemas
const registerSchema = Joi.object({
    username: Joi.string().min(3).max(30).required().messages({
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required',
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Please enter a valid email',
        'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required',
    }),
    fullName: Joi.string().max(100).required().messages({
        'string.max': 'Full name cannot exceed 100 characters',
        'any.required': 'Full name is required',
    }),
    phone: Joi.string()
        .pattern(/^[0-9+\-\s()]+$/)
        .optional()
        .messages({
            'string.pattern.base': 'Please enter a valid phone number',
        }),
    role: Joi.string().valid('user', 'admin', 'doctor').default('user'),
});

const loginSchema = Joi.object({
    username: Joi.string().required().messages({
        'any.required': 'Username is required',
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required',
    }),
});

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Register controller
export const register = async (req, res) => {
    try {
        // Validate request body
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map((detail) => detail.message),
            });
        }

        const { username, email, password, fullName, phone, role } = value;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    existingUser.email === email
                        ? 'Email đã tồn tại'
                        : 'Username đã tồn tại',
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            fullName,
            phone,
            role,
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User đã được đăng ký thành công',
            data: {
                user: user.toJSON(),
                token,
            },
        });
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Login controller
export const login = async (req, res) => {
    try {
        // Validate request body
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map((detail) => detail.message),
            });
        }

        const { username, password } = value;

        // Find user by username or email
        const user = await User.findOne({
            $or: [{ username }, { email: username }],
            isActive: true,
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản hoặc mật khẩu không chính xác',
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản hoặc mật khẩu không chính xác',
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: user.toJSON(),
                token,
            },
        });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Get current user profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User không tồn tại',
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: user.toJSON(),
            },
        });
    } catch (error) {
        console.error('Lỗi lấy thông tin profile:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};

// Update profile
export const updateProfile = async (req, res) => {
    try {
        const updateSchema = Joi.object({
            fullName: Joi.string().max(100).optional(),
            phone: Joi.string()
                .pattern(/^[0-9+\-\s()]+$/)
                .optional()
                .allow(''),
            avatar: Joi.string().optional().allow(''),
        });

        const { error, value } = updateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Lỗi validation',
                errors: error.details.map((detail) => detail.message),
            });
        }

        const user = await User.findByIdAndUpdate(req.user.userId, value, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User không tồn tại',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile đã được cập nhật thành công',
            data: {
                user: user.toJSON(),
            },
        });
    } catch (error) {
        console.error('Lỗi cập nhật profile:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
        });
    }
};
