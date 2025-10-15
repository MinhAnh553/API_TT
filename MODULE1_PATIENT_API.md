# Module 1: Quản lý Bệnh Nhân - API Documentation

## Tổng quan

Module quản lý bệnh nhân cung cấp các API để quản lý thông tin bệnh nhân, bao gồm cả chức năng dành cho nhân viên và kiosk tự phục vụ.

## API Endpoints

### 🔐 Yêu cầu xác thực

Tất cả API (trừ kiosk) đều yêu cầu Bearer token trong header:

```
Authorization: Bearer <jwt-token>
```

---

## 📋 Quản lý bệnh nhân (Dành cho nhân viên)

### 1. Tạo bệnh nhân mới

**POST** `/api/v1/patients`

**Phân quyền:** Admin, Doctor

**Request Body:**

```json
{
    "fullName": "Nguyễn Văn A",
    "dateOfBirth": "1990-01-15",
    "gender": "male",
    "phone": "0123456789",
    "email": "nguyenvana@email.com",
    "address": {
        "street": "123 Đường ABC",
        "ward": "Phường XYZ",
        "district": "Quận 1",
        "city": "TP.HCM",
        "province": "TP.HCM"
    },
    "idNumber": "123456789",
    "insuranceNumber": "BH123456789",
    "emergencyContact": {
        "name": "Nguyễn Thị B",
        "phone": "0987654321",
        "relationship": "Vợ"
    },
    "medicalHistory": {
        "allergies": ["Penicillin", "Sulfa"],
        "chronicDiseases": ["Tiểu đường"],
        "currentMedications": ["Metformin 500mg"],
        "notes": "Bệnh nhân có tiền sử dị ứng thuốc"
    }
}
```

**Response:**

```json
{
    "success": true,
    "message": "Patient created successfully",
    "data": {
        "patient": {
            "_id": "...",
            "patientCode": "BN000001",
            "fullName": "Nguyễn Văn A",
            "dateOfBirth": "1990-01-15T00:00:00.000Z",
            "gender": "male",
            "phone": "0123456789",
            "qrCode": "QR_BN000001_1234567890",
            "isActive": true,
            "createdAt": "...",
            "updatedAt": "..."
        }
    }
}
```

### 2. Lấy danh sách bệnh nhân

**GET** `/api/v1/patients`

**Query Parameters:**

-   `page` (optional): Trang hiện tại (default: 1)
-   `limit` (optional): Số lượng per page (default: 10)
-   `search` (optional): Tìm kiếm theo tên, mã bệnh nhân, SĐT, CMND
-   `gender` (optional): Lọc theo giới tính (male/female/other)
-   `ageMin` (optional): Tuổi tối thiểu
-   `ageMax` (optional): Tuổi tối đa
-   `sortBy` (optional): Sắp xếp theo field (default: createdAt)
-   `sortOrder` (optional): Thứ tự sắp xếp (asc/desc, default: desc)

**Example:**

```
GET /api/v1/patients?page=1&limit=20&search=Nguyễn&gender=male&ageMin=18&ageMax=65
```

**Response:**

```json
{
    "success": true,
    "data": {
        "patients": [...],
        "pagination": {
            "currentPage": 1,
            "totalPages": 5,
            "totalPatients": 100,
            "hasNextPage": true,
            "hasPrevPage": false
        }
    }
}
```

### 3. Lấy thông tin bệnh nhân theo ID

**GET** `/api/v1/patients/:id`

**Parameters:**

-   `id`: ID bệnh nhân hoặc mã bệnh nhân

**Response:**

```json
{
    "success": true,
    "data": {
        "patient": {
            "_id": "...",
            "patientCode": "BN000001",
            "fullName": "Nguyễn Văn A",
            "age": 34,
            "phone": "0123456789",
            "medicalHistory": {...},
            "lastVisitDate": "2024-01-15T00:00:00.000Z"
        }
    }
}
```

### 4. Cập nhật thông tin bệnh nhân

**PUT** `/api/v1/patients/:id`

**Phân quyền:** Admin, Doctor

**Request Body:** (Tương tự như tạo mới, tất cả fields đều optional)

### 5. Xóa bệnh nhân (Soft delete)

**DELETE** `/api/v1/patients/:id`

**Phân quyền:** Admin

**Response:**

```json
{
    "success": true,
    "message": "Patient deleted successfully"
}
```

### 6. Lấy lịch sử khám bệnh

**GET** `/api/v1/patients/:id/medical-history`

**Query Parameters:**

-   `page` (optional): Trang hiện tại
-   `limit` (optional): Số lượng per page

**Response:**

```json
{
    "success": true,
    "data": {
        "patient": {
            "_id": "...",
            "patientCode": "BN000001",
            "fullName": "Nguyễn Văn A",
            "medicalHistory": {...}
        },
        "examinations": [...],
        "appointments": [...],
        "statistics": {
            "totalExaminations": 5,
            "totalAppointments": 8,
            "lastVisitDate": "2024-01-15T00:00:00.000Z"
        }
    }
}
```

---

## 🏥 Kiosk Tự Phục Vụ (Không cần xác thực)

### 1. Check-in bệnh nhân

**POST** `/api/v1/kiosk/patients/check-in`

**Request Body:**

```json
{
    "identifier": "BN000001"
}
```

**Response:**

```json
{
    "success": true,
    "message": "Patient found successfully",
    "data": {
        "patient": {
            "_id": "...",
            "patientCode": "BN000001",
            "fullName": "Nguyễn Văn A",
            "qrCode": "QR_BN000001_1234567890"
        },
        "todayAppointments": [
            {
                "appointmentCode": "LH20240115001",
                "appointmentDate": "2024-01-15T08:00:00.000Z",
                "doctor": {
                    "fullName": "BS. Nguyễn Văn B"
                }
            }
        ],
        "checkInNumber": 1
    }
}
```

### 2. Đăng ký bệnh nhân mới tại kiosk

**POST** `/api/v1/kiosk/patients/register`

**Request Body:**

```json
{
    "fullName": "Nguyễn Văn C",
    "dateOfBirth": "1985-05-20",
    "gender": "female",
    "phone": "0987654321",
    "address": {
        "street": "456 Đường DEF",
        "district": "Quận 2",
        "city": "TP.HCM"
    }
}
```

**Response:**

```json
{
    "success": true,
    "message": "Patient registered successfully",
    "data": {
        "patient": {
            "patientCode": "BN000002",
            "fullName": "Nguyễn Văn C",
            "qrCode": "QR_BN000002_1234567891"
        },
        "registrationNumber": "123456"
    }
}
```

### 3. Cập nhật thông tin cơ bản

**PUT** `/api/v1/kiosk/patients/patient/:patientId`

**Request Body:**

```json
{
    "phone": "0987654321",
    "address": {
        "street": "456 Đường DEF Updated",
        "district": "Quận 2",
        "city": "TP.HCM"
    }
}
```

### 4. Xem lịch sử khám (5 lần gần nhất)

**POST** `/api/v1/kiosk/patients/patient/:patientId/visit-history`

**Request Body:**

```json
{
    "phone": "0123456789"
}
```

**Response:**

```json
{
    "success": true,
    "message": "Visit history retrieved successfully",
    "data": {
        "patient": {
            "patientCode": "BN000001",
            "fullName": "Nguyễn Văn A"
        },
        "recentExaminations": [
            {
                "examinationDate": "2024-01-15T00:00:00.000Z",
                "examinationCode": "PK20240115001",
                "reasonForVisit": "Đau đầu",
                "status": "completed"
            }
        ],
        "totalVisits": 5
    }
}
```

### 5. Xem lịch sử đơn thuốc

**POST** `/api/v1/kiosk/patients/patient/:patientId/prescription-history`

**Request Body:**

```json
{
    "phone": "0123456789"
}
```

**Response:**

```json
{
    "success": true,
    "message": "Prescription history retrieved successfully",
    "data": {
        "patient": {
            "patientCode": "BN000001",
            "fullName": "Nguyễn Văn A"
        },
        "recentPrescriptions": [
            {
                "examinationDate": "2024-01-15T00:00:00.000Z",
                "prescriptions": [
                    {
                        "medicine": {
                            "name": "Paracetamol",
                            "activeIngredient": "Acetaminophen",
                            "strength": "500mg"
                        },
                        "quantity": 20,
                        "duration": 5
                    }
                ]
            }
        ]
    }
}
```

---

## 📊 Các tính năng đặc biệt

### 1. Mã bệnh nhân tự động

-   Format: `BN` + 6 số (VD: BN000001)
-   Tự động sinh khi tạo bệnh nhân mới

### 2. QR Code

-   Tự động tạo QR code cho mỗi bệnh nhân
-   Format: `QR_` + patientCode + timestamp
-   Sử dụng cho check-in nhanh tại kiosk

### 3. Tìm kiếm thông minh

-   Tìm kiếm theo: tên, mã bệnh nhân, SĐT, CMND, BHYT
-   Hỗ trợ tìm kiếm không dấu và có dấu

### 4. Lọc và sắp xếp

-   Lọc theo giới tính, độ tuổi
-   Sắp xếp theo nhiều tiêu chí
-   Phân trang với thông tin chi tiết

### 5. Bảo mật

-   Soft delete: không xóa thật dữ liệu
-   Kiểm tra trùng lặp SĐT, CMND
-   Phân quyền rõ ràng cho từng chức năng

### 6. Tích hợp

-   Liên kết với Module 2 (Examination)
-   Liên kết với Module 4 (Appointment)
-   Hỗ trợ xuất báo cáo

---

## 🚨 Error Handling

### Validation Errors (400)

```json
{
    "success": false,
    "message": "Validation error",
    "errors": ["Full name is required", "Phone number must be valid"]
}
```

### Not Found (404)

```json
{
    "success": false,
    "message": "Patient not found"
}
```

### Conflict (409)

```json
{
    "success": false,
    "message": "Phone number already exists"
}
```

### Unauthorized (401)

```json
{
    "success": false,
    "message": "Access token is required"
}
```

### Forbidden (403)

```json
{
    "success": false,
    "message": "Access denied. Insufficient permissions."
}
```
