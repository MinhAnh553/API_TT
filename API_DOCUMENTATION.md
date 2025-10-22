# API Documentation - Hệ Thống Quản Lý Bệnh Viện

## Tổng Quan

Hệ thống API quản lý bệnh viện với các chức năng chính:

-   **Xác thực người dùng (Authentication)** - Dành cho admin/bác sĩ
-   **Quản lý bệnh nhân (Patient Management)** - Tạo và quản lý hồ sơ bệnh nhân
-   **Đặt lịch khám bệnh (Appointment Booking)** - Bệnh nhân tự đặt online
-   **Quản lý phiếu khám (Examination Management)** - Bác sĩ tạo khi khám

## Quy Trình Hoạt Động

```
1. Bệnh nhân đặt lịch online → Appointment (scheduled)
2. Bệnh nhân đến khám → Check-in (checked_in)
3. Bác sĩ tạo phiếu khám → Examination + Update Appointment (in_progress)
4. Hoàn thành khám → Update Examination (completed) + Update Appointment (completed)
```

## Các API Endpoints

### 1. Authentication APIs (Dành cho Admin/Bác sĩ)

#### 1.1 Đăng Ký Tài Khoản

**POST** `/api/v1/auth/register`

Đăng ký tài khoản admin/bác sĩ mới.

**Request Body:**

```json
{
    "username": "doctor1",
    "email": "doctor1@hospital.com",
    "password": "password123",
    "fullName": "Bác sĩ Nguyễn Văn A",
    "role": "doctor"
}
```

#### 1.2 Đăng Nhập

**POST** `/api/v1/auth/login`

Đăng nhập vào hệ thống.

**Request Body:**

```json
{
    "username": "doctor1",
    "password": "password123"
}
```

#### 1.3 Xác Thực Token

**GET** `/api/v1/auth/verify`

Xác thực JWT token.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

### 2. Patient Management APIs (Cần Auth)

#### 2.1 Tạo Bệnh Nhân Mới

**POST** `/api/v1/patients`

Tạo hồ sơ bệnh nhân mới.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
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
        "ward": "Phường XYZ",
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

#### 2.2 Lấy Danh Sách Bệnh Nhân

**GET** `/api/v1/patients`

Lấy danh sách bệnh nhân với bộ lọc và phân trang.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**

-   `page`: Số trang (mặc định: 1)
-   `limit`: Số lượng mỗi trang (mặc định: 10)
-   `gender`: Lọc theo giới tính (`male`, `female`, `other`)
-   `minAge`: Tuổi tối thiểu
-   `maxAge`: Tuổi tối đa
-   `registrationDateFrom`: Ngày đăng ký từ
-   `registrationDateTo`: Ngày đăng ký đến
-   `sortBy`: Sắp xếp theo (`createdAt`, `fullName`, `patientCode`, `dateOfBirth`)
-   `sortOrder`: Thứ tự sắp xếp (`asc`, `desc`)

#### 2.3 Tìm Kiếm Bệnh Nhân

**GET** `/api/v1/patients/search`

Tìm kiếm bệnh nhân với nhiều tiêu chí.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**

-   `search`: Tìm kiếm chung (mã bệnh nhân, họ tên, SĐT, CMND, BHYT)
-   `patientCode`: Tìm theo mã bệnh nhân
-   `fullName`: Tìm theo họ tên
-   `phone`: Tìm theo số điện thoại
-   `idNumber`: Tìm theo số CMND
-   `insuranceNumber`: Tìm theo số BHYT
-   `gender`: Lọc theo giới tính
-   `minAge`: Tuổi tối thiểu
-   `maxAge`: Tuổi tối đa
-   `registrationDateFrom`: Ngày đăng ký từ
-   `registrationDateTo`: Ngày đăng ký đến
-   `page`: Số trang
-   `limit`: Số lượng mỗi trang
-   `sortBy`: Sắp xếp theo
-   `sortOrder`: Thứ tự sắp xếp

#### 2.4 Lấy Chi Tiết Bệnh Nhân

**GET** `/api/v1/patients/:id`

Lấy thông tin chi tiết của một bệnh nhân.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

#### 2.5 Cập Nhật Thông Tin Bệnh Nhân

**PUT** `/api/v1/patients/:id`

Cập nhật thông tin bệnh nhân.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

#### 2.6 Xóa Bệnh Nhân

**DELETE** `/api/v1/patients/:id`

Xóa bệnh nhân (soft delete).

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

#### 2.7 Lấy Lịch Sử Khám Bệnh

**GET** `/api/v1/patients/:id/medical-history`

Lấy lịch sử khám bệnh của bệnh nhân.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**

-   `page`: Số trang (mặc định: 1)
-   `limit`: Số lượng mỗi trang (mặc định: 10)

### 3. Appointment APIs (Đặt Lịch Khám)

#### 3.1 Đặt Lịch Khám Bệnh (Public)

**POST** `/api/v1/appointments`

Đặt lịch khám mới (không cần đăng nhập).

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
    }
}
```

**Response:**

```json
{
    "success": true,
    "message": "Đặt lịch khám thành công",
    "data": {
        "appointment": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e4",
            "appointmentCode": "LH20240120001",
            "fullName": "Nguyễn Văn A",
            "phone": "0987654321",
            "patient": null,
            "appointmentDate": "2024-01-20T00:00:00.000Z",
            "timeSlot": {
                "start": "09:00",
                "end": "09:30",
                "duration": 30
            },
            "status": "scheduled",
            "source": "online",
            "createdAt": "2024-01-15T08:30:00.000Z"
        }
    }
}
```

#### 3.2 Lấy Danh Sách Lịch Khám (Cần Auth)

**GET** `/api/v1/appointments`

Lấy danh sách lịch khám với các bộ lọc.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**

-   `status`: Lọc theo trạng thái (`scheduled`, `confirmed`, `checked_in`, `in_progress`, `completed`, `cancelled`, `no_show`)
-   `appointmentDateFrom`: Lọc từ ngày
-   `appointmentDateTo`: Lọc đến ngày
-   `page`: Số trang
-   `limit`: Số lượng mỗi trang
-   `sortBy`: Sắp xếp theo
-   `sortOrder`: Thứ tự sắp xếp

#### 3.3 Lấy Chi Tiết Lịch Khám (Cần Auth)

**GET** `/api/v1/appointments/:id`

Lấy thông tin chi tiết của một lịch khám.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

#### 3.4 Check-in Lịch Khám (Cần Auth)

**PATCH** `/api/v1/appointments/:id/checkin`

Bệnh nhân check-in khi đến khám.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

#### 3.5 Hủy Lịch Khám (Cần Auth)

**PATCH** `/api/v1/appointments/:id/cancel`

Hủy lịch khám.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**

```json
{
    "reason": "Bệnh nhân không thể đến khám"
}
```

### 4. Examination APIs (Quản Lý Phiếu Khám - Cần Auth)

#### 4.1 Tạo Phiếu Khám Mới

**POST** `/api/v1/examinations`

Tạo phiếu khám mới cho bệnh nhân.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
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

**Response:**

```json
{
    "success": true,
    "message": "Tạo phiếu khám thành công",
    "data": {
        "examination": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e5",
            "examinationCode": "BN000001-20240120001",
            "patient": {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
                "patientCode": "BN000001",
                "fullName": "Nguyễn Văn A",
                "phone": "0987654321"
            },
            "doctor": {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e2",
                "username": "doctor1",
                "fullName": "Bác sĩ Nguyễn Văn B"
            },
            "appointment": {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e4",
                "appointmentCode": "LH20240120001",
                "appointmentDate": "2024-01-20T00:00:00.000Z",
                "timeSlot": {
                    "start": "09:00",
                    "end": "09:30"
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
            "notes": "Bệnh nhân không có tiền sử dị ứng thuốc"
        }
    }
}
```

#### 4.2 Lấy Danh Sách Phiếu Khám

**GET** `/api/v1/examinations`

Lấy danh sách phiếu khám với bộ lọc.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**

-   `patient`: Lọc theo mã bệnh nhân
-   `doctor`: Lọc theo mã bác sĩ
-   `status`: Lọc theo trạng thái (`in_progress`, `completed`, `cancelled`)
-   `examinationDateFrom`: Lọc từ ngày
-   `examinationDateTo`: Lọc đến ngày
-   `page`: Số trang
-   `limit`: Số lượng mỗi trang
-   `sortBy`: Sắp xếp theo
-   `sortOrder`: Thứ tự sắp xếp

#### 4.3 Lấy Chi Tiết Phiếu Khám

**GET** `/api/v1/examinations/:id`

Lấy thông tin chi tiết của một phiếu khám.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

#### 4.4 Cập Nhật Phiếu Khám

**PUT** `/api/v1/examinations/:id`

Cập nhật thông tin phiếu khám.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Request Body:**

```json
{
    "symptoms": "Cập nhật triệu chứng",
    "diagnosis": "Cập nhật chẩn đoán",
    "treatment": "Cập nhật hướng dẫn điều trị"
}
```

#### 4.5 Hoàn Thành Phiếu Khám

**PATCH** `/api/v1/examinations/:id/complete`

Hoàn thành phiếu khám.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

#### 4.6 Lấy Lịch Sử Khám Của Bệnh Nhân

**GET** `/api/v1/examinations/patient/:patientId/history`

Lấy tất cả phiếu khám của một bệnh nhân.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**

-   `page`: Số trang
-   `limit`: Số lượng mỗi trang

## Trạng Thái Appointment

| Trạng thái    | Mô tả                      |
| ------------- | -------------------------- |
| `scheduled`   | Đã đặt lịch (mặc định)     |
| `confirmed`   | Đã xác nhận                |
| `checked_in`  | Bệnh nhân đã đến khám      |
| `in_progress` | Đang khám (có examination) |
| `completed`   | Hoàn thành khám            |
| `cancelled`   | Đã hủy                     |
| `no_show`     | Không đến khám             |

## Trạng Thái Examination

| Trạng thái    | Mô tả                |
| ------------- | -------------------- |
| `in_progress` | Đang khám (mặc định) |
| `completed`   | Hoàn thành khám      |
| `cancelled`   | Đã hủy               |

## Xử Lý Lỗi

### Validation Errors

```json
{
    "success": false,
    "message": "Định dạng không hợp lệ",
    "errors": ["Họ tên là bắt buộc", "Số điện thoại đã tồn tại"]
}
```

### Authentication Errors

```json
{
    "success": false,
    "message": "Token không hợp lệ"
}
```

### Authorization Errors

```json
{
    "success": false,
    "message": "Bạn không có quyền thực hiện hành động này"
}
```

### Not Found Errors

```json
{
    "success": false,
    "message": "Bệnh nhân không tồn tại"
}
```

### Conflict Errors

```json
{
    "success": false,
    "message": "Thời gian này đã có lịch khám khác"
}
```

## Ví Dụ Sử Dụng

### Đặt Lịch Khám (Bệnh Nhân)

```javascript
const bookAppointment = async (appointmentData) => {
    const response = await fetch('/api/v1/appointments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
    });
    return response.json();
};

// Sử dụng
const newAppointment = await bookAppointment({
    fullName: 'Nguyễn Văn A',
    phone: '0987654321',
    appointmentDate: '2024-01-20T00:00:00.000Z',
    timeSlot: {
        start: '09:00',
        end: '09:30',
    },
});
```

### Tạo Phiếu Khám (Bác Sĩ)

```javascript
const createExamination = async (examinationData) => {
    const response = await fetch('/api/v1/examinations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(examinationData),
    });
    return response.json();
};

// Sử dụng
const newExamination = await createExamination({
    patient: '64f8b2c1d4e5f6a7b8c9d0e1',
    appointment: '64f8b2c1d4e5f6a7b8c9d0e4',
    reasonForVisit: 'Đau đầu, sốt cao',
    diagnosis: 'Có thể do nhiễm virus',
    treatment: 'Nghỉ ngơi, uống nhiều nước',
});
```

### Check-in Lịch Khám

```javascript
const checkIn = async (appointmentId) => {
    const response = await fetch(
        `/api/v1/appointments/${appointmentId}/checkin`,
        {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );
    return response.json();
};
```

## Lưu Ý Quan Trọng

1. **Đặt lịch không cần xác thực** - Bệnh nhân có thể đặt lịch mà không cần đăng nhập
2. **Tự động liên kết patient** - Nếu đã có patient với số điện thoại, sẽ tự động liên kết
3. **Kiểm tra xung đột lịch** - Hệ thống tự động kiểm tra xung đột thời gian
4. **Liên kết appointment-examination** - Appointment và examination được liên kết tự động
5. **Mã lịch khám** được tạo theo định dạng `LH{YYYYMMDD}{001}`
6. **Mã phiếu khám** được tạo theo định dạng `{PatientCode}-{YYYYMMDD}{001}`
7. **Không thể đặt lịch trong quá khứ** - Validation tự động
8. **Quản lý trạng thái** - Trạng thái được cập nhật tự động theo quy trình
9. **Phân quyền rõ ràng** - Admin/Bác sĩ mới có thể tạo phiếu khám
10. **Soft Delete** - Bệnh nhân bị xóa sẽ được đánh dấu `isActive: false`
