# Hướng dẫn sử dụng Authentication API

## API Endpoints

### 1. Đăng ký tài khoản

**POST** `/api/v1/auth/register`

**Request Body:**

```json
{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123",
    "fullName": "John Doe",
    "phone": "+84 123 456 789",
    "role": "user"
}
```

**Response:**

```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user": {
            "_id": "...",
            "username": "john_doe",
            "email": "john@example.com",
            "fullName": "John Doe",
            "phone": "+84 123 456 789",
            "role": "user",
            "isActive": true,
            "createdAt": "...",
            "updatedAt": "..."
        },
        "token": "jwt-token-here"
    }
}
```

### 2. Đăng nhập

**POST** `/api/v1/auth/login`

**Request Body:**

```json
{
    "username": "john_doe",
    "password": "password123"
}
```

**Response:**

```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "_id": "...",
            "username": "john_doe",
            "email": "john@example.com",
            "fullName": "John Doe",
            "role": "user"
        },
        "token": "jwt-token-here"
    }
}
```

### 3. Xem thông tin profile

**GET** `/api/v1/auth/profile`

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
    "success": true,
    "data": {
        "user": {
            "_id": "...",
            "username": "john_doe",
            "email": "john@example.com",
            "fullName": "John Doe",
            "phone": "+84 123 456 789",
            "role": "user",
            "isActive": true
        }
    }
}
```

### 4. Cập nhật profile

**PUT** `/api/v1/auth/profile`

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Request Body:**

```json
{
    "fullName": "John Smith",
    "phone": "+84 987 654 321",
    "avatar": "avatar-url"
}
```

### 5. Xác thực token

**GET** `/api/v1/auth/verify`

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
    "success": true,
    "message": "Token is valid",
    "data": {
        "user": {
            "userId": "...",
            "username": "john_doe",
            "email": "john@example.com",
            "role": "user"
        }
    }
}
```

### 6. Lấy danh sách users (Admin only)

**GET** `/api/v1/auth/admin/users`

**Headers:**

```
Authorization: Bearer <admin-jwt-token>
```

## Các role được hỗ trợ

-   `user`: Người dùng thông thường
-   `admin`: Quản trị viên
-   `doctor`: Bác sĩ

## Middleware

### authenticateToken

Sử dụng để bảo vệ các route cần xác thực:

```javascript
import { authenticateToken } from '../middlewares/authMiddleware.js';

router.get('/protected', authenticateToken, controller);
```

### authorize

Sử dụng để kiểm tra quyền truy cập theo role:

```javascript
import { authorize } from '../middlewares/authMiddleware.js';

router.get('/admin-only', authenticateToken, authorize('admin'), controller);
```

### optionalAuth

Xác thực không bắt buộc (không lỗi nếu không có token):

```javascript
import { optionalAuth } from '../middlewares/authMiddleware.js';

router.get('/optional', optionalAuth, controller);
```

## Lưu ý

1. JWT token có thời hạn mặc định là 7 ngày
2. Password được hash bằng bcrypt với salt rounds = 12
3. Tất cả API đều trả về response theo format chuẩn với `success`, `message`, và `data`
4. Validation được thực hiện bằng Joi
5. Email và username phải là duy nhất
6. Password tối thiểu 6 ký tự
7. Username tối thiểu 3 ký tự, tối đa 30 ký tự
