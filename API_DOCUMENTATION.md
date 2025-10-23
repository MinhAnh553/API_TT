# API Documentation - Hệ Thống Quản Lý Bệnh Viện

## Tổng Quan

Hệ thống API quản lý bệnh viện với các chức năng chính:

-   **Xác thực người dùng (Authentication)** - Dành cho admin/bác sĩ
-   **Quản lý bệnh nhân (Patient Management)** - Tạo và quản lý hồ sơ bệnh nhân
-   **Quản lý lịch hẹn (Appointment Management)** - Đặt lịch, đổi lịch, hủy lịch, xác nhận lịch
-   **Quản lý ca trực bác sĩ (Doctor Schedule Management)** - Tạo lịch trực, xem calendar, điều chỉnh ca
-   **Tra cứu & xếp lịch thông minh (Smart Scheduling)** - Tìm bác sĩ trống, gợi ý thay thế, chống trùng lịch
-   **Quản lý phiếu khám (Examination Management)** - Bác sĩ tạo khi khám

## Quy Trình Hoạt Động

```
1. Bệnh nhân đặt lịch online → Appointment (scheduled)
2. Bệnh nhân đến khám → Check-in (checked_in)
3. Bác sĩ tạo phiếu khám → Examination + Update Appointment (in_progress)
4. Hoàn thành khám → Update Examination (completed) + Update Appointment (completed)
```

## Base URL

```
http://localhost:3000/api/v1
```

---

## 1. Authentication APIs

### 1.1 Đăng Ký Tài Khoản

**POST** `/api/v1/auth/register`

Đăng ký tài khoản admin/bác sĩ mới.

**Request Body:**

```json
{
    "username": "doctor1",
    "email": "doctor1@hospital.com",
    "password": "password123",
    "fullName": "Bác sĩ Nguyễn Văn A",
    "phone": "0987654321",
    "role": "doctor",
    "doctorInfo": {
        "licenseNumber": "BS001234",
        "department": "Khoa Nội",
        "specialization": "Tim mạch",
        "experience": 10,
        "education": "Đại học Y Hà Nội",
        "bio": "Chuyên gia tim mạch với 10 năm kinh nghiệm",
        "consultationFee": 200000
    }
}
```

**Response Success (201):**

```json
{
    "success": true,
    "message": "Đăng ký thành công",
    "data": {
        "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
        "username": "doctor1",
        "email": "doctor1@hospital.com",
        "fullName": "Bác sĩ Nguyễn Văn A",
        "phone": "0987654321",
        "role": "doctor",
        "doctorInfo": {
            "licenseNumber": "BS001234",
            "department": "Khoa Nội",
            "specialization": "Tim mạch",
            "experience": 10,
            "education": "Đại học Y Hà Nội",
            "bio": "Chuyên gia tim mạch với 10 năm kinh nghiệm",
            "consultationFee": 200000,
            "isAvailable": true
        },
        "isActive": true,
        "createdAt": "2024-01-20T10:30:00.000Z",
        "updatedAt": "2024-01-20T10:30:00.000Z"
    }
}
```

**Response Error (400):**

```json
{
    "success": false,
    "message": "Validation error",
    "errors": ["Username đã tồn tại", "Email không hợp lệ"]
}
```

### 1.2 Đăng Nhập

**POST** `/api/v1/auth/login`

Đăng nhập vào hệ thống.

**Request Body:**

```json
{
    "username": "doctor1",
    "password": "password123"
}
```

**Response Success (200):**

```json
{
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
        "user": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
            "username": "doctor1",
            "email": "doctor1@hospital.com",
            "fullName": "Bác sĩ Nguyễn Văn A",
            "role": "doctor",
            "doctorInfo": {...}
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Response Error (401):**

```json
{
    "success": false,
    "message": "Tài khoản hoặc mật khẩu không chính xác"
}
```

### 1.3 Xác Thực Token

**GET** `/api/v1/auth/verify`

Xác thực token JWT.

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
    "success": true,
    "message": "Token hợp lệ",
    "data": {
        "user": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
            "username": "doctor1",
            "email": "doctor1@hospital.com",
            "fullName": "Bác sĩ Nguyễn Văn A",
            "role": "doctor"
        }
    }
}
```

**Response Error (401):**

```json
{
    "success": false,
    "message": "Token không hợp lệ"
}
```

---

## 2. Patient Management APIs

### 2.1 Tạo Bệnh Nhân Mới

**POST** `/api/v1/patients`

Tạo hồ sơ bệnh nhân mới.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
    "fullName": "Nguyễn Văn A",
    "dateOfBirth": "1990-05-15T00:00:00.000Z",
    "gender": "male",
    "phone": "0987654321",
    "address": {
        "street": "123 Đường ABC",
        "ward": "Phường 1",
        "district": "Quận 1",
        "city": "TP.HCM",
        "province": "TP.HCM"
    },
    "idNumber": "123456789",
    "insuranceNumber": "BH123456789",
    "allergies": "Penicillin",
    "chronicDiseases": "Diabetes",
    "currentMedications": "Metformin",
    "medicalNotes": "Bệnh nhân có tiền sử dị ứng penicillin"
}
```

**Response Success (201):**

```json
{
    "success": true,
    "message": "Tạo bệnh nhân thành công",
    "data": {
        "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
        "patientCode": "BN000001",
        "fullName": "Nguyễn Văn A",
        "dateOfBirth": "1990-05-15T00:00:00.000Z",
        "gender": "male",
        "phone": "0987654321",
        "address": {...},
        "idNumber": "123456789",
        "insuranceNumber": "BH123456789",
        "allergies": "Penicillin",
        "chronicDiseases": "Diabetes",
        "currentMedications": "Metformin",
        "medicalNotes": "Bệnh nhân có tiền sử dị ứng penicillin",
        "qrCode": "QR_BN000001_1698765432000",
        "isActive": true,
        "age": 33,
        "createdAt": "2024-01-20T10:30:00.000Z"
    }
}
```

### 2.2 Lấy Danh Sách Bệnh Nhân

**GET** `/api/v1/patients`

Lấy danh sách bệnh nhân với phân trang và bộ lọc.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

-   `page` (optional): Số trang (default: 1)
-   `limit` (optional): Số lượng mỗi trang (default: 10)
-   `search` (optional): Tìm kiếm theo tên, SĐT, CMND
-   `gender` (optional): Lọc theo giới tính (male, female, other)
-   `minAge` (optional): Tuổi tối thiểu
-   `maxAge` (optional): Tuổi tối đa
-   `sortBy` (optional): Sắp xếp theo (fullName, createdAt, lastVisitDate)
-   `sortOrder` (optional): Thứ tự sắp xếp (asc, desc)

**Response Success (200):**

```json
{
    "success": true,
    "data": {
        "patients": [
            {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
                "patientCode": "BN000001",
                "fullName": "Nguyễn Văn A",
                "dateOfBirth": "1990-05-15T00:00:00.000Z",
                "gender": "male",
                "phone": "0987654321",
                "age": 33,
                "lastVisitDate": "2024-01-15T00:00:00.000Z",
                "isActive": true
            }
        ],
        "pagination": {
            "current": 1,
            "pages": 5,
            "total": 50,
            "limit": 10
        }
    }
}
```

### 2.3 Tìm Kiếm Bệnh Nhân

**GET** `/api/v1/patients/search`

Tìm kiếm bệnh nhân theo nhiều tiêu chí.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

-   `patientCode` (optional): Mã bệnh nhân
-   `fullName` (optional): Họ tên
-   `phone` (optional): Số điện thoại
-   `idNumber` (optional): Số CMND/CCCD
-   `insuranceNumber` (optional): Số BHYT
-   `age` (optional): Tuổi
-   `gender` (optional): Giới tính
-   `registrationDate` (optional): Ngày đăng ký (YYYY-MM-DD)

**Response Success (200):**

```json
{
    "success": true,
    "data": [
        {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
            "patientCode": "BN000001",
            "fullName": "Nguyễn Văn A",
            "phone": "0987654321",
            "age": 33,
            "gender": "male",
            "lastVisitDate": "2024-01-15T00:00:00.000Z"
        }
    ]
}
```

### 2.4 Lấy Chi Tiết Bệnh Nhân

**GET** `/api/v1/patients/:id`

Lấy thông tin chi tiết của một bệnh nhân.

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
    "success": true,
    "data": {
        "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
        "patientCode": "BN000001",
        "fullName": "Nguyễn Văn A",
        "dateOfBirth": "1990-05-15T00:00:00.000Z",
        "gender": "male",
        "phone": "0987654321",
        "address": {...},
        "idNumber": "123456789",
        "insuranceNumber": "BH123456789",
        "allergies": "Penicillin",
        "chronicDiseases": "Diabetes",
        "currentMedications": "Metformin",
        "medicalNotes": "Bệnh nhân có tiền sử dị ứng penicillin",
        "qrCode": "QR_BN000001_1698765432000",
        "isActive": true,
        "age": 33,
        "lastVisitDate": "2024-01-15T00:00:00.000Z",
        "createdAt": "2024-01-20T10:30:00.000Z"
    }
}
```

### 2.5 Lấy Lịch Sử Khám Bệnh

**GET** `/api/v1/patients/:id/medical-history`

Lấy lịch sử khám bệnh của bệnh nhân.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

-   `page` (optional): Số trang (default: 1)
-   `limit` (optional): Số lượng mỗi trang (default: 10)

**Response Success (200):**

```json
{
    "success": true,
    "data": {
        "patient": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
            "patientCode": "BN000001",
            "fullName": "Nguyễn Văn A",
            "dateOfBirth": "1990-05-15T00:00:00.000Z",
            "gender": "male",
            "phone": "0987654321",
            "allergies": "Penicillin",
            "chronicDiseases": "Diabetes",
            "currentMedications": "Metformin",
            "medicalNotes": "Bệnh nhân có tiền sử dị ứng penicillin"
        },
        "examinations": [
            {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e2",
                "examinationCode": "BN000001-20240120001",
                "examinationDate": "2024-01-20T09:15:00.000Z",
                "reasonForVisit": "Đau đầu, sốt cao",
                "symptoms": "Bệnh nhân than phiền đau đầu dữ dội",
                "diagnosis": "Có thể do nhiễm virus",
                "treatment": "Nghỉ ngơi, uống nhiều nước",
                "followUpDate": "2024-01-25T00:00:00.000Z",
                "followUpInstructions": "Tái khám sau 3 ngày nếu sốt không giảm",
                "status": "completed",
                "doctor": {
                    "_id": "64f8b2c1d4e5f6a7b8c9d0e3",
                    "fullName": "BS. Nguyễn Văn B"
                }
            }
        ],
        "appointments": [
            {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e4",
                "appointmentCode": "LH20240120001",
                "appointmentDate": "2024-01-20T00:00:00.000Z",
                "timeSlot": {
                    "start": "09:00",
                    "end": "09:30",
                    "duration": 30
                },
                "status": "completed",
                "reasonForVisit": "Đau đầu, sốt cao",
                "doctor": {
                    "_id": "64f8b2c1d4e5f6a7b8c9d0e3",
                    "fullName": "BS. Nguyễn Văn B"
                }
            }
        ],
        "statistics": {
            "totalExaminations": 5,
            "totalAppointments": 8,
            "lastVisitDate": "2024-01-20T00:00:00.000Z"
        }
    }
}
```

---

## 3. Appointment Management APIs

### 3.1 Đặt Lịch Khám (Public)

**POST** `/api/v1/appointments`

Đặt lịch khám bệnh (không cần xác thực).

**Request Body:**

```json
{
    "fullName": "Nguyễn Văn A",
    "phone": "0987654321",
    "appointmentDate": "2024-01-20T00:00:00.000Z",
    "timeSlot": {
        "start": "09:00",
        "end": "09:30",
        "duration": 30
    },
    "doctor": "64f8b2c1d4e5f6a7b8c9d0e1",
    "department": "Khoa Nội",
    "reasonForVisit": "Đau đầu, sốt cao"
}
```

**Response Success (201):**

```json
{
    "success": true,
    "message": "Đặt lịch khám thành công",
    "data": {
        "_id": "64f8b2c1d4e5f6a7b8c9d0e4",
        "appointmentCode": "LH20240120001",
        "fullName": "Nguyễn Văn A",
        "phone": "0987654321",
        "appointmentDate": "2024-01-20T00:00:00.000Z",
        "timeSlot": {
            "start": "09:00",
            "end": "09:30",
            "duration": 30
        },
        "doctor": "64f8b2c1d4e5f6a7b8c9d0e1",
        "department": "Khoa Nội",
        "reasonForVisit": "Đau đầu, sốt cao",
        "status": "scheduled",
        "source": "online",
        "patient": "64f8b2c1d4e5f6a7b8c9d0e5",
        "createdAt": "2024-01-19T15:30:00.000Z"
    }
}
```

### 3.2 Tìm Bác Sĩ Còn Trống Lịch (Public)

**GET** `/api/v1/appointments/available-doctors`

Tìm bác sĩ còn trống lịch theo ngày/giờ.

**Query Parameters:**

-   `date` (required): Ngày khám (YYYY-MM-DD)
-   `time` (required): Giờ khám (HH:mm)
-   `department` (optional): Khoa/phòng
-   `specialization` (optional): Chuyên khoa
-   `duration` (optional): Thời gian khám (phút, default: 30)

**Response Success (200):**

```json
{
    "success": true,
    "data": [
        {
            "doctor": {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
                "fullName": "BS. Nguyễn Văn A",
                "department": "Khoa Nội",
                "specialization": "Tim mạch",
                "experience": 10,
                "consultationFee": 200000
            },
            "schedule": {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e6",
                "shiftType": "morning",
                "timeSlot": {
                    "start": "09:00",
                    "end": "09:30",
                    "duration": 30,
                    "maxPatients": 10
                }
            },
            "availableCapacity": 8
        }
    ]
}
```

### 3.3 Gợi Ý Bác Sĩ Thay Thế (Public) (chưa thêm)

**GET** `/api/v1/appointments/suggest-doctors`

Gợi ý bác sĩ thay thế khi bác sĩ mong muốn đã kín lịch.

**Query Parameters:**

-   `preferredDoctor` (required): ID bác sĩ mong muốn
-   `date` (required): Ngày khám (YYYY-MM-DD)
-   `time` (required): Giờ khám (HH:mm)
-   `department` (optional): Khoa/phòng
-   `specialization` (optional): Chuyên khoa
-   `duration` (optional): Thời gian khám (phút, default: 30)

**Response Success (200):**

```json
{
    "success": true,
    "data": [
        {
            "doctor": {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e2",
                "fullName": "BS. Trần Thị B",
                "department": "Khoa Nội",
                "specialization": "Tim mạch",
                "experience": 8,
                "consultationFee": 180000
            },
            "schedule": {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e7",
                "shiftType": "morning",
                "timeSlot": {
                    "start": "09:00",
                    "end": "09:30",
                    "duration": 30,
                    "maxPatients": 10
                }
            },
            "availableCapacity": 5
        }
    ]
}
```

### 3.4 Lấy Lịch Hẹn Theo Mã (Public) (chưa thêm)

**GET** `/api/v1/appointments/code/:code`

Lấy thông tin lịch hẹn theo mã xác nhận.

**Response Success (200):**

```json
{
    "success": true,
    "data": {
        "_id": "64f8b2c1d4e5f6a7b8c9d0e4",
        "appointmentCode": "LH20240120001",
        "fullName": "Nguyễn Văn A",
        "phone": "0987654321",
        "appointmentDate": "2024-01-20T00:00:00.000Z",
        "timeSlot": {
            "start": "09:00",
            "end": "09:30",
            "duration": 30
        },
        "status": "confirmed",
        "reasonForVisit": "Đau đầu, sốt cao",
        "patient": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e5",
            "patientCode": "BN000001",
            "fullName": "Nguyễn Văn A",
            "phone": "0987654321",
            "dateOfBirth": "1990-05-15T00:00:00.000Z",
            "gender": "male"
        },
        "doctor": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
            "fullName": "BS. Nguyễn Văn A",
            "doctorInfo": {
                "department": "Khoa Nội",
                "specialization": "Tim mạch"
            }
        }
    }
}
```

### 3.5 Lấy Danh Sách Lịch Hẹn

**GET** `/api/v1/appointments`

Lấy danh sách lịch hẹn với phân trang và bộ lọc.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

-   `page` (optional): Số trang (default: 1)
-   `limit` (optional): Số lượng mỗi trang (default: 10)
-   `status` (optional): Trạng thái lịch hẹn
-   `doctor` (optional): ID bác sĩ
-   `department` (optional): Khoa/phòng
-   `appointmentDate` (optional): Ngày khám (YYYY-MM-DD)
-   `phone` (optional): Số điện thoại bệnh nhân

**Response Success (200):**

```json
{
    "success": true,
    "data": {
        "appointments": [
            {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e4",
                "appointmentCode": "LH20240120001",
                "fullName": "Nguyễn Văn A",
                "phone": "0987654321",
                "appointmentDate": "2024-01-20T00:00:00.000Z",
                "timeSlot": {...},
                "status": "scheduled",
                "reasonForVisit": "Đau đầu, sốt cao",
                "patient": {...},
                "doctor": {...}
            }
        ],
        "pagination": {
            "current": 1,
            "pages": 5,
            "total": 50
        }
    }
}
```

### 3.6 Lấy Chi Tiết Lịch Hẹn

**GET** `/api/v1/appointments/:id`

Lấy thông tin chi tiết của một lịch hẹn.

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
    "success": true,
    "data": {
        "_id": "64f8b2c1d4e5f6a7b8c9d0e4",
        "appointmentCode": "LH20240120001",
        "fullName": "Nguyễn Văn A",
        "phone": "0987654321",
        "appointmentDate": "2024-01-20T00:00:00.000Z",
        "timeSlot": {
            "start": "09:00",
            "end": "09:30",
            "duration": 30
        },
        "status": "scheduled",
        "reasonForVisit": "Đau đầu, sốt cao",
        "checkInTime": null,
        "checkOutTime": null,
        "patient": {...},
        "doctor": {...},
        "examination": null,
        "source": "online",
        "createdAt": "2024-01-19T15:30:00.000Z"
    }
}
```

### 3.7 Check-in Lịch Hẹn

**PATCH** `/api/v1/appointments/:id/checkin`

Check-in lịch hẹn khi bệnh nhân đến khám.

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
    "success": true,
    "message": "Check-in thành công",
    "data": {
        "_id": "64f8b2c1d4e5f6a7b8c9d0e4",
        "appointmentCode": "LH20240120001",
        "status": "checked_in",
        "checkInTime": "2024-01-20T09:05:00.000Z",
        "patient": {...},
        "doctor": {...}
    }
}
```

### 3.8 Đổi Lịch Hẹn

**PATCH** `/api/v1/appointments/:id/reschedule`

Đổi lịch hẹn (thay đổi thời gian, bác sĩ).

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
    "appointmentDate": "2024-01-25T00:00:00.000Z",
    "timeSlot": {
        "start": "10:00",
        "end": "10:30",
        "duration": 30
    },
    "doctor": "64f8b2c1d4e5f6a7b8c9d0e2",
    "reason": "Bệnh nhân có việc đột xuất"
}
```

**Response Success (200):**

```json
{
    "success": true,
    "message": "Đổi lịch hẹn thành công",
    "data": {
        "_id": "64f8b2c1d4e5f6a7b8c9d0e4",
        "appointmentCode": "LH20240125001",
        "appointmentDate": "2024-01-25T00:00:00.000Z",
        "timeSlot": {
            "start": "10:00",
            "end": "10:30",
            "duration": 30
        },
        "status": "rescheduled",
        "rescheduleReason": "Bệnh nhân có việc đột xuất",
        "rescheduledAt": "2024-01-19T10:30:00.000Z",
        "patient": {...}
    }
}
```

### 3.9 Xác Nhận Lịch Hẹn

**PATCH** `/api/v1/appointments/:id/confirm`

Xác nhận lịch hẹn.

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
    "success": true,
    "message": "Xác nhận lịch hẹn thành công",
    "data": {
        "appointment": {...},
        "confirmationCode": "LH20240120001"
    }
}
```

### 3.10 Hủy Lịch Hẹn

**PATCH** `/api/v1/appointments/:id/cancel`

Hủy lịch hẹn.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
    "reason": "Bệnh nhân không thể đến khám"
}
```

**Response Success (200):**

```json
{
    "success": true,
    "message": "Hủy lịch hẹn thành công",
    "data": {
        "_id": "64f8b2c1d4e5f6a7b8c9d0e4",
        "appointmentCode": "LH20240120001",
        "status": "cancelled",
        "cancellationReason": "Bệnh nhân không thể đến khám",
        "cancelledAt": "2024-01-19T16:30:00.000Z",
        "cancelledBy": "64f8b2c1d4e5f6a7b8c9d0e1"
    }
}
```

---

## 4. Doctor Schedule Management APIs

### 4.1 Tạo Lịch Trực

**POST** `/api/v1/doctor-schedules`

Tạo lịch trực cho bác sĩ.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
    "doctor": "64f8b2c1d4e5f6a7b8c9d0e1",
    "department": "Khoa Nội",
    "scheduleDate": "2024-01-20T00:00:00.000Z",
    "shiftType": "morning",
    "timeSlots": [
        {
            "start": "08:00",
            "end": "12:00",
            "duration": 30,
            "maxPatients": 10,
            "isAvailable": true
        },
        {
            "start": "14:00",
            "end": "17:00",
            "duration": 30,
            "maxPatients": 8,
            "isAvailable": true
        }
    ],
    "notes": "Ca trực sáng thứ 2"
}
```

**Response Success (201):**

```json
{
    "success": true,
    "message": "Tạo lịch trực thành công",
    "data": {
        "_id": "64f8b2c1d4e5f6a7b8c9d0e5",
        "doctor": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
            "fullName": "BS. Nguyễn Văn A",
            "email": "doctor1@hospital.com",
            "phone": "0987654321",
            "doctorInfo": {
                "department": "Khoa Nội",
                "specialization": "Tim mạch"
            }
        },
        "department": "Khoa Nội",
        "scheduleDate": "2024-01-20T00:00:00.000Z",
        "shiftType": "morning",
        "timeSlots": [
            {
                "start": "08:00",
                "end": "12:00",
                "duration": 30,
                "maxPatients": 10,
                "isAvailable": true
            },
            {
                "start": "14:00",
                "end": "17:00",
                "duration": 30,
                "maxPatients": 8,
                "isAvailable": true
            }
        ],
        "status": "scheduled",
        "notes": "Ca trực sáng thứ 2",
        "availableSlots": 2,
        "totalSlots": 2,
        "createdBy": "64f8b2c1d4e5f6a7b8c9d0e3",
        "isActive": true,
        "createdAt": "2024-01-19T10:30:00.000Z"
    }
}
```

### 4.2 Lấy Danh Sách Lịch Trực

**GET** `/api/v1/doctor-schedules`

Lấy danh sách lịch trực với phân trang và bộ lọc.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

-   `page` (optional): Số trang (default: 1)
-   `limit` (optional): Số lượng mỗi trang (default: 10)
-   `doctor` (optional): ID bác sĩ
-   `department` (optional): Khoa/phòng
-   `scheduleDate` (optional): Ngày trực (YYYY-MM-DD)
-   `shiftType` (optional): Loại ca (morning, afternoon, evening, night)
-   `status` (optional): Trạng thái (scheduled, active, completed, cancelled)

**Response Success (200):**

```json
{
    "success": true,
    "data": {
        "schedules": [
            {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e5",
                "doctor": {
                    "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
                    "fullName": "BS. Nguyễn Văn A",
                    "doctorInfo": {
                        "department": "Khoa Nội",
                        "specialization": "Tim mạch"
                    }
                },
                "department": "Khoa Nội",
                "scheduleDate": "2024-01-20T00:00:00.000Z",
                "shiftType": "morning",
                "timeSlots": [...],
                "status": "scheduled",
                "availableSlots": 2,
                "totalSlots": 2
            }
        ],
        "pagination": {
            "current": 1,
            "pages": 5,
            "total": 50
        }
    }
}
```

### 4.3 Lấy Lịch Calendar

**GET** `/api/v1/doctor-schedules/calendar`

Lấy lịch trực dạng calendar.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

-   `doctor` (optional): ID bác sĩ
-   `month` (required): Tháng (1-12)
-   `year` (required): Năm

**Response Success (200):**

```json
{
    "success": true,
    "data": [
        {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e5",
            "doctor": {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
                "fullName": "BS. Nguyễn Văn A",
                "doctorInfo": {
                    "department": "Khoa Nội",
                    "specialization": "Tim mạch"
                }
            },
            "scheduleDate": "2024-01-20T00:00:00.000Z",
            "shiftType": "morning",
            "timeSlots": [
                {
                    "start": "08:00",
                    "end": "12:00",
                    "duration": 30,
                    "maxPatients": 10,
                    "isAvailable": true
                }
            ],
            "status": "scheduled"
        }
    ]
}
```

### 4.4 Lấy Chi Tiết Lịch Trực

**GET** `/api/v1/doctor-schedules/:id`

Lấy thông tin chi tiết của một lịch trực.

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
    "success": true,
    "data": {
        "_id": "64f8b2c1d4e5f6a7b8c9d0e5",
        "doctor": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
            "fullName": "BS. Nguyễn Văn A",
            "email": "doctor1@hospital.com",
            "phone": "0987654321",
            "doctorInfo": {
                "department": "Khoa Nội",
                "specialization": "Tim mạch"
            }
        },
        "department": "Khoa Nội",
        "scheduleDate": "2024-01-20T00:00:00.000Z",
        "shiftType": "morning",
        "timeSlots": [...],
        "status": "scheduled",
        "notes": "Ca trực sáng thứ 2",
        "availableSlots": 2,
        "totalSlots": 2,
        "createdBy": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e3",
            "fullName": "Admin User",
            "username": "admin"
        },
        "isActive": true,
        "createdAt": "2024-01-19T10:30:00.000Z"
    }
}
```

### 4.5 Cập Nhật Lịch Trực

**PUT** `/api/v1/doctor-schedules/:id`

Cập nhật thông tin lịch trực.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
    "department": "Khoa Nội",
    "shiftType": "afternoon",
    "timeSlots": [
        {
            "start": "13:00",
            "end": "17:00",
            "duration": 30,
            "maxPatients": 8,
            "isAvailable": true
        }
    ],
    "notes": "Cập nhật ca chiều",
    "status": "active"
}
```

**Response Success (200):**

```json
{
    "success": true,
    "message": "Cập nhật lịch trực thành công",
    "data": {
        "_id": "64f8b2c1d4e5f6a7b8c9d0e5",
        "department": "Khoa Nội",
        "shiftType": "afternoon",
        "timeSlots": [...],
        "status": "active",
        "notes": "Cập nhật ca chiều",
        "updatedAt": "2024-01-19T11:30:00.000Z"
    }
}
```

### 4.6 Xóa Lịch Trực

**DELETE** `/api/v1/doctor-schedules/:id`

Xóa lịch trực (soft delete).

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
    "success": true,
    "message": "Xóa lịch trực thành công"
}
```

**Response Error (400):**

```json
{
    "success": false,
    "message": "Không thể xóa lịch trực đã có lịch hẹn"
}
```

---

## 5. Examination Management APIs

### 5.1 Tạo Phiếu Khám

**POST** `/api/v1/examinations`

Tạo phiếu khám mới cho bệnh nhân.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
    "patient": "64f8b2c1d4e5f6a7b8c9d0e1",
    "appointment": "64f8b2c1d4e5f6a7b8c9d0e4",
    "reasonForVisit": "Đau đầu, sốt cao",
    "symptoms": "Bệnh nhân than phiền đau đầu dữ dội",
    "diagnosis": "Có thể do nhiễm virus",
    "treatment": "Nghỉ ngơi, uống nhiều nước",
    "followUpDate": "2024-01-25T00:00:00.000Z",
    "followUpInstructions": "Tái khám sau 3 ngày nếu sốt không giảm",
    "notes": "Bệnh nhân không có tiền sử dị ứng thuốc"
}
```

**Response Success (201):**

```json
{
    "success": true,
    "message": "Tạo phiếu khám thành công",
    "data": {
        "_id": "64f8b2c1d4e5f6a7b8c9d0e2",
        "examinationCode": "BN000001-20240120001",
        "patient": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
            "patientCode": "BN000001",
            "fullName": "Nguyễn Văn A"
        },
        "appointment": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e4",
            "appointmentCode": "LH20240120001"
        },
        "doctor": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e3",
            "fullName": "BS. Nguyễn Văn B"
        },
        "examinationDate": "2024-01-20T09:15:00.000Z",
        "reasonForVisit": "Đau đầu, sốt cao",
        "symptoms": "Bệnh nhân than phiền đau đầu dữ dội",
        "diagnosis": "Có thể do nhiễm virus",
        "treatment": "Nghỉ ngơi, uống nhiều nước",
        "followUpDate": "2024-01-25T00:00:00.000Z",
        "followUpInstructions": "Tái khám sau 3 ngày nếu sốt không giảm",
        "status": "in_progress",
        "notes": "Bệnh nhân không có tiền sử dị ứng thuốc",
        "createdAt": "2024-01-20T09:15:00.000Z"
    }
}
```

### 5.2 Lấy Danh Sách Phiếu Khám

**GET** `/api/v1/examinations`

Lấy danh sách phiếu khám với phân trang và bộ lọc.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

-   `page` (optional): Số trang (default: 1)
-   `limit` (optional): Số lượng mỗi trang (default: 10)
-   `patient` (optional): ID bệnh nhân
-   `doctor` (optional): ID bác sĩ
-   `status` (optional): Trạng thái (in_progress, completed, cancelled)
-   `examinationDate` (optional): Ngày khám (YYYY-MM-DD)

**Response Success (200):**

```json
{
    "success": true,
    "data": {
        "examinations": [
            {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e2",
                "examinationCode": "BN000001-20240120001",
                "patient": {
                    "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
                    "patientCode": "BN000001",
                    "fullName": "Nguyễn Văn A"
                },
                "doctor": {
                    "_id": "64f8b2c1d4e5f6a7b8c9d0e3",
                    "fullName": "BS. Nguyễn Văn B"
                },
                "examinationDate": "2024-01-20T09:15:00.000Z",
                "reasonForVisit": "Đau đầu, sốt cao",
                "diagnosis": "Có thể do nhiễm virus",
                "status": "in_progress"
            }
        ],
        "pagination": {
            "current": 1,
            "pages": 5,
            "total": 50
        }
    }
}
```

### 5.3 Lấy Chi Tiết Phiếu Khám

**GET** `/api/v1/examinations/:id`

Lấy thông tin chi tiết của một phiếu khám.

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
    "success": true,
    "data": {
        "_id": "64f8b2c1d4e5f6a7b8c9d0e2",
        "examinationCode": "BN000001-20240120001",
        "patient": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
            "patientCode": "BN000001",
            "fullName": "Nguyễn Văn A",
            "dateOfBirth": "1990-05-15T00:00:00.000Z",
            "gender": "male",
            "phone": "0987654321"
        },
        "appointment": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e4",
            "appointmentCode": "LH20240120001",
            "appointmentDate": "2024-01-20T00:00:00.000Z",
            "timeSlot": {
                "start": "09:00",
                "end": "09:30",
                "duration": 30
            }
        },
        "doctor": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e3",
            "fullName": "BS. Nguyễn Văn B",
            "doctorInfo": {
                "department": "Khoa Nội",
                "specialization": "Tim mạch"
            }
        },
        "examinationDate": "2024-01-20T09:15:00.000Z",
        "reasonForVisit": "Đau đầu, sốt cao",
        "symptoms": "Bệnh nhân than phiền đau đầu dữ dội",
        "diagnosis": "Có thể do nhiễm virus",
        "treatment": "Nghỉ ngơi, uống nhiều nước",
        "followUpDate": "2024-01-25T00:00:00.000Z",
        "followUpInstructions": "Tái khám sau 3 ngày nếu sốt không giảm",
        "status": "in_progress",
        "notes": "Bệnh nhân không có tiền sử dị ứng thuốc",
        "createdAt": "2024-01-20T09:15:00.000Z"
    }
}
```

### 5.4 Cập Nhật Phiếu Khám

**PUT** `/api/v1/examinations/:id`

Cập nhật thông tin phiếu khám.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
    "symptoms": "Cập nhật triệu chứng",
    "diagnosis": "Cập nhật chẩn đoán",
    "treatment": "Cập nhật hướng dẫn điều trị"
}
```

**Response Success (200):**

```json
{
    "success": true,
    "message": "Cập nhật phiếu khám thành công",
    "data": {
        "_id": "64f8b2c1d4e5f6a7b8c9d0e2",
        "examinationCode": "BN000001-20240120001",
        "symptoms": "Cập nhật triệu chứng",
        "diagnosis": "Cập nhật chẩn đoán",
        "treatment": "Cập nhật hướng dẫn điều trị",
        "updatedAt": "2024-01-20T10:30:00.000Z"
    }
}
```

### 5.5 Hoàn Thành Phiếu Khám

**PATCH** `/api/v1/examinations/:id/complete`

Hoàn thành phiếu khám.

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
    "success": true,
    "message": "Hoàn thành phiếu khám thành công",
    "data": {
        "_id": "64f8b2c1d4e5f6a7b8c9d0e2",
        "examinationCode": "BN000001-20240120001",
        "status": "completed",
        "completedAt": "2024-01-20T10:45:00.000Z",
        "completedBy": "64f8b2c1d4e5f6a7b8c9d0e3",
        "appointment": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e4",
            "status": "completed",
            "checkOutTime": "2024-01-20T10:45:00.000Z"
        }
    }
}
```

### 5.6 Lấy Lịch Sử Khám Của Bệnh Nhân

**GET** `/api/v1/examinations/patient/:patientId`

Lấy lịch sử khám của một bệnh nhân.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

-   `page` (optional): Số trang (default: 1)
-   `limit` (optional): Số lượng mỗi trang (default: 10)

**Response Success (200):**

```json
{
    "success": true,
    "data": {
        "patient": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
            "patientCode": "BN000001",
            "fullName": "Nguyễn Văn A"
        },
        "examinations": [
            {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e2",
                "examinationCode": "BN000001-20240120001",
                "examinationDate": "2024-01-20T09:15:00.000Z",
                "reasonForVisit": "Đau đầu, sốt cao",
                "diagnosis": "Có thể do nhiễm virus",
                "status": "completed",
                "doctor": {
                    "_id": "64f8b2c1d4e5f6a7b8c9d0e3",
                    "fullName": "BS. Nguyễn Văn B"
                }
            }
        ],
        "pagination": {
            "current": 1,
            "pages": 2,
            "total": 15
        }
    }
}
```

---

## 6. Error Responses

### 6.1 Validation Error (400)

```json
{
    "success": false,
    "message": "Validation error",
    "errors": ["Họ tên là bắt buộc", "Số điện thoại không hợp lệ"]
}
```

### 6.2 Unauthorized (401)

```json
{
    "success": false,
    "message": "Access token là bắt buộc"
}
```

### 6.3 Forbidden (403)

```json
{
    "success": false,
    "message": "Không có quyền truy cập"
}
```

### 6.4 Not Found (404)

```json
{
    "success": false,
    "message": "Bệnh nhân không tồn tại"
}
```

### 6.5 Conflict (409)

```json
{
    "success": false,
    "message": "Bác sĩ đã có lịch trực trong ca này"
}
```

### 6.6 Server Error (500)

```json
{
    "success": false,
    "message": "Lỗi server",
    "error": "Chi tiết lỗi"
}
```

---

## 7. Status Codes

### Appointment Status

-   `scheduled`: Đã đặt lịch
-   `confirmed`: Đã xác nhận
-   `checked_in`: Đã đến khám
-   `in_progress`: Đang khám
-   `completed`: Hoàn thành
-   `cancelled`: Đã hủy
-   `no_show`: Không đến khám
-   `rescheduled`: Đã đổi lịch

### Examination Status

-   `in_progress`: Đang khám
-   `completed`: Hoàn thành
-   `cancelled`: Đã hủy

### Doctor Schedule Status

-   `scheduled`: Đã lên lịch
-   `active`: Đang hoạt động
-   `completed`: Hoàn thành
-   `cancelled`: Đã hủy

### Shift Types

-   `morning`: Ca sáng
-   `afternoon`: Ca chiều
-   `evening`: Ca tối
-   `night`: Ca đêm

### User Roles

-   `admin`: Quản trị viên
-   `doctor`: Bác sĩ
-   `receptionist`: Lễ tân
-   `nurse`: Y tá
-   `user`: Người dùng thường

---

## 8. Authentication

### JWT Token

Tất cả API yêu cầu xác thực (trừ các API public) cần header:

```
Authorization: Bearer <jwt_token>
```

### Token Expiration

-   Token có thời hạn 24 giờ
-   Refresh token có thời hạn 7 ngày

---

## 9. Rate Limiting

-   **Public APIs**: 100 requests/minute
-   **Authenticated APIs**: 1000 requests/minute
-   **Admin APIs**: 5000 requests/minute

---

## 10. Pagination

Tất cả API list đều hỗ trợ pagination:

**Query Parameters:**

-   `page`: Số trang (default: 1)
-   `limit`: Số lượng mỗi trang (default: 10, max: 100)

**Response Format:**

```json
{
    "success": true,
    "data": {
        "items": [...],
        "pagination": {
            "current": 1,
            "pages": 5,
            "total": 50,
            "limit": 10
        }
    }
}
```

---

## 11. Filtering & Sorting

### Filtering

Hầu hết API list đều hỗ trợ filtering qua query parameters.

### Sorting

**Query Parameters:**

-   `sortBy`: Trường sắp xếp
-   `sortOrder`: Thứ tự (asc, desc)

**Example:**

```
GET /api/v1/patients?sortBy=fullName&sortOrder=asc
```

---

## 12. Search

### Text Search

Một số API hỗ trợ tìm kiếm văn bản:

**Query Parameters:**

-   `search`: Từ khóa tìm kiếm

**Example:**

```
GET /api/v1/patients?search=Nguyễn Văn A
```

---

**Lưu ý:** Tất cả các API đều hỗ trợ pagination, filtering và sorting. Các API yêu cầu authentication sẽ cần header `Authorization: Bearer <token>`.
