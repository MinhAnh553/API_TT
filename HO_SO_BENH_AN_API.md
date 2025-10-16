# API Hồ Sơ Bệnh Án - Hướng Dẫn Sử Dụng

## Tổng Quan

API này cung cấp các chức năng quản lý hồ sơ bệnh án cho hệ thống quản lý bệnh viện, bao gồm:

-   Tạo hồ sơ bệnh án ban đầu cho bệnh nhân
-   Ghi nhận lý do khám, tiền sử bệnh, chẩn đoán sơ bộ
-   Xem lịch sử các lần khám
-   Quản lý trạng thái hồ sơ khám bệnh

## Các Endpoint API

### 1. Tạo Hồ Sơ Bệnh Án Ban Đầu

**POST** `/api/v1/examinations`

Tạo hồ sơ bệnh án mới cho bệnh nhân.

#### Request Body

```json
{
    "patient": "64f8b2c1d4e5f6a7b8c9d0e1",
    "reasonForVisit": "Đau đầu, sốt cao",
    "symptoms": "Bệnh nhân than phiền đau đầu dữ dội, sốt 38.5°C, mệt mỏi",
    "diagnosis": "Có thể do nhiễm virus hoặc vi khuẩn",
    "treatment": {
        "instructions": "Nghỉ ngơi, uống nhiều nước, theo dõi nhiệt độ",
        "followUpDate": "2024-01-20T00:00:00.000Z",
        "followUpInstructions": "Tái khám sau 3 ngày nếu sốt không giảm"
    },
    "notes": "Bệnh nhân không có tiền sử dị ứng thuốc"
}
```

**Các trường bắt buộc:**

-   `patient`: Mã bệnh nhân
-   `reasonForVisit`: Lý do khám
-   `diagnosis`: Chẩn đoán

**Các trường tùy chọn:**

-   `symptoms`: Triệu chứng
-   `treatment`: Thông tin điều trị
-   `notes`: Ghi chú

#### Response

```json
{
    "success": true,
    "message": "Tạo hồ sơ bệnh án thành công",
    "data": {
        "examination": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e3",
            "examinationCode": "PK20240115001",
            "patient": {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
                "patientCode": "BN000001",
                "fullName": "Nguyễn Văn A",
                "dateOfBirth": "1990-05-15T00:00:00.000Z",
                "gender": "male",
                "phone": "0987654321"
            },
            "doctor": {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e2",
                "username": "doctor1",
                "fullName": "Bác sĩ Nguyễn Văn B"
            },
            "examinationDate": "2024-01-15T08:30:00.000Z",
            "reasonForVisit": "Đau đầu, sốt cao",
            "symptoms": "Bệnh nhân than phiền đau đầu dữ dội, sốt 38.5°C, mệt mỏi",
            "diagnosis": "Có thể do nhiễm virus hoặc vi khuẩn",
            "treatment": {
                "instructions": "Nghỉ ngơi, uống nhiều nước, theo dõi nhiệt độ",
                "followUpDate": "2024-01-20T00:00:00.000Z",
                "followUpInstructions": "Tái khám sau 3 ngày nếu sốt không giảm"
            },
            "status": "in_progress",
            "notes": "Bệnh nhân không có tiền sử dị ứng thuốc",
            "totalCost": 0,
            "paymentStatus": "pending",
            "createdAt": "2024-01-15T08:30:00.000Z",
            "updatedAt": "2024-01-15T08:30:00.000Z"
        }
    }
}
```

### 2. Cập Nhật Hồ Sơ Bệnh Án

**PUT** `/api/v1/examinations/:id`

Cập nhật thông tin hồ sơ bệnh án (chỉ bác sĩ tạo mới có thể cập nhật).

#### Request Body (tương tự như tạo mới, tất cả trường đều optional)

```json
{
    "symptoms": "Cập nhật triệu chứng mới",
    "diagnosis": {
        "primary": {
            "description": "Cập nhật chẩn đoán chính"
        }
    },
    "treatment": {
        "instructions": "Cập nhật hướng dẫn điều trị"
    }
}
```

### 3. Xem Chi Tiết Hồ Sơ Bệnh Án

**GET** `/api/v1/examinations/:id`

Lấy thông tin chi tiết của một hồ sơ khám bệnh.

#### Response

```json
{
    "success": true,
    "message": "Lấy thông tin hồ sơ khám bệnh thành công",
    "data": {
        "examination": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e3",
            "examinationCode": "PK20240115001",
            "patient": {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
                "patientCode": "BN000001",
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
                "medicalHistory": {
                    "allergies": ["Penicillin"],
                    "chronicDiseases": ["Diabetes"],
                    "currentMedications": ["Metformin"],
                    "notes": "Patient notes here"
                }
            },
            "doctor": {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e2",
                "username": "doctor1",
                "fullName": "Bác sĩ Nguyễn Văn B"
            },
            "examinationDate": "2024-01-15T08:30:00.000Z",
            "reasonForVisit": "Đau đầu, sốt cao",
            "symptoms": "Bệnh nhân than phiền đau đầu dữ dội, sốt 38.5°C, mệt mỏi",
            "diagnosis": "Có thể do nhiễm virus hoặc vi khuẩn",
            "treatment": {
                "instructions": "Nghỉ ngơi, uống nhiều nước, theo dõi nhiệt độ",
                "followUpDate": "2024-01-20T00:00:00.000Z",
                "followUpInstructions": "Tái khám sau 3 ngày nếu sốt không giảm"
            },
            "status": "in_progress",
            "notes": "Bệnh nhân không có tiền sử dị ứng thuốc",
            "totalCost": 0,
            "paymentStatus": "pending",
            "createdAt": "2024-01-15T08:30:00.000Z",
            "updatedAt": "2024-01-15T08:30:00.000Z"
        }
    }
}
```

### 4. Xem Lịch Sử Khám Bệnh Của Bệnh Nhân

**GET** `/api/v1/examinations/patient/:patientId/history`

Lấy lịch sử tất cả các lần khám của một bệnh nhân.

#### Query Parameters

| Tham số     | Loại   | Mô tả                             | Ví dụ                     |
| ----------- | ------ | --------------------------------- | ------------------------- |
| `page`      | number | Số trang (mặc định: 1)            | `?page=2`                 |
| `limit`     | number | Số lượng mỗi trang (mặc định: 10) | `?limit=20`               |
| `sortBy`    | string | Sắp xếp theo (`examinationDate`)  | `?sortBy=examinationDate` |
| `sortOrder` | string | Thứ tự sắp xếp (`asc`, `desc`)    | `?sortOrder=desc`         |

#### Example Request

```bash
GET /api/v1/examinations/patient/64f8b2c1d4e5f6a7b8c9d0e1/history?page=1&limit=10
```

#### Response

```json
{
    "success": true,
    "message": "Lấy lịch sử khám bệnh thành công",
    "data": {
        "patient": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e1",
            "patientCode": "BN000001",
            "fullName": "Nguyễn Văn A",
            "dateOfBirth": "1990-05-15T00:00:00.000Z",
            "gender": "male",
            "phone": "0987654321"
        },
        "examinations": [
            {
                "_id": "64f8b2c1d4e5f6a7b8c9d0e3",
                "examinationCode": "PK20240115001",
                "patient": "64f8b2c1d4e5f6a7b8c9d0e1",
                "doctor": {
                    "_id": "64f8b2c1d4e5f6a7b8c9d0e2",
                    "username": "doctor1",
                    "fullName": "Bác sĩ Nguyễn Văn B"
                },
                "examinationDate": "2024-01-15T08:30:00.000Z",
                "reasonForVisit": "Đau đầu, sốt cao",
                "status": "completed",
                "diagnosis": {
                    "primary": {
                        "code": "R50.9",
                        "description": "Sốt không rõ nguyên nhân"
                    }
                },
                "createdAt": "2024-01-15T08:30:00.000Z"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 3,
            "totalItems": 25,
            "itemsPerPage": 10,
            "hasNextPage": true,
            "hasPrevPage": false
        },
        "statistics": {
            "totalExaminations": 25,
            "lastVisitDate": "2024-01-15T08:30:00.000Z",
            "firstVisitDate": "2023-06-01T09:00:00.000Z"
        }
    }
}
```

### 5. Lấy Danh Sách Hồ Sơ Khám Bệnh

**GET** `/api/v1/examinations`

Lấy danh sách hồ sơ khám bệnh với các bộ lọc.

#### Query Parameters

| Tham số               | Loại   | Mô tả                                                         | Ví dụ                               |
| --------------------- | ------ | ------------------------------------------------------------- | ----------------------------------- |
| `patient`             | string | Lọc theo mã bệnh nhân                                         | `?patient=64f8b2c1d4e5f6a7b8c9d0e1` |
| `doctor`              | string | Lọc theo mã bác sĩ                                            | `?doctor=64f8b2c1d4e5f6a7b8c9d0e2`  |
| `status`              | string | Lọc theo trạng thái (`in_progress`, `completed`, `cancelled`) | `?status=completed`                 |
| `examinationDateFrom` | date   | Lọc từ ngày                                                   | `?examinationDateFrom=2024-01-01`   |
| `examinationDateTo`   | date   | Lọc đến ngày                                                  | `?examinationDateTo=2024-01-31`     |
| `page`                | number | Số trang                                                      | `?page=1`                           |
| `limit`               | number | Số lượng mỗi trang                                            | `?limit=20`                         |
| `sortBy`              | string | Sắp xếp theo                                                  | `?sortBy=examinationDate`           |
| `sortOrder`           | string | Thứ tự sắp xếp                                                | `?sortOrder=desc`                   |

#### Example Request

```bash
GET /api/v1/examinations?status=completed&examinationDateFrom=2024-01-01&page=1&limit=20
```

### 6. Hoàn Thành Hồ Sơ Khám Bệnh

**PATCH** `/api/v1/examinations/:id/complete`

Đánh dấu hồ sơ khám bệnh là đã hoàn thành.

#### Response

```json
{
    "success": true,
    "message": "Hoàn thành hồ sơ khám bệnh thành công",
    "data": {
        "examination": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e3",
            "status": "completed",
            "examinationCode": "PK20240115001"
            // ... các thông tin khác
        }
    }
}
```

### 7. Hủy Hồ Sơ Khám Bệnh

**PATCH** `/api/v1/examinations/:id/cancel`

Hủy hồ sơ khám bệnh (chỉ áp dụng cho hồ sơ đang trong quá trình).

#### Request Body

```json
{
    "reason": "Bệnh nhân không đến khám"
}
```

#### Response

```json
{
    "success": true,
    "message": "Hủy hồ sơ khám bệnh thành công",
    "data": {
        "examination": {
            "_id": "64f8b2c1d4e5f6a7b8c9d0e3",
            "status": "cancelled",
            "notes": "Lý do hủy: Bệnh nhân không đến khám"
            // ... các thông tin khác
        }
    }
}
```

## Cấu Trúc Dữ Liệu

### Diagnosis (Chẩn Đoán)

```json
{
    "diagnosis": "Có thể do nhiễm virus hoặc vi khuẩn" // Mô tả chẩn đoán (bắt buộc)
}
```

### Treatment (Điều Trị)

```json
{
    "treatment": {
        "instructions": "Nghỉ ngơi, uống nhiều nước, theo dõi nhiệt độ",
        "followUpDate": "2024-01-20T00:00:00.000Z",
        "followUpInstructions": "Tái khám sau 3 ngày nếu sốt không giảm"
    }
}
```

## Xử Lý Lỗi

### Validation Errors

```json
{
    "success": false,
    "message": "Định dạng không hợp lệ",
    "errors": ["Lý do khám là bắt buộc", "Mô tả chẩn đoán chính là bắt buộc"]
}
```

### Not Found Errors

```json
{
    "success": false,
    "message": "Hồ sơ khám bệnh không tồn tại"
}
```

### Permission Errors

```json
{
    "success": false,
    "message": "Hồ sơ khám bệnh không tồn tại hoặc bạn không có quyền cập nhật"
}
```

## Xác Thực và Phân Quyền

-   **Tất cả endpoints** đều yêu cầu xác thực JWT token
-   **Chỉ admin và doctor** mới có thể tạo, cập nhật, hoàn thành, hủy hồ sơ
-   **Chỉ bác sĩ tạo hồ sơ** mới có thể cập nhật hồ sơ đó
-   **Tất cả user** đều có thể xem danh sách và chi tiết hồ sơ

### Header Authorization

```bash
Authorization: Bearer <your-jwt-token>
```

## Ví Dụ Sử Dụng

### Tạo Hồ Sơ Mới

```javascript
const createExamination = async (examinationData) => {
    const response = await fetch('/api/v1/examinations', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(examinationData),
    });
    return response.json();
};

// Sử dụng
const newExamination = await createExamination({
    patient: '64f8b2c1d4e5f6a7b8c9d0e1',
    reasonForVisit: 'Đau đầu, sốt cao',
    symptoms: 'Bệnh nhân than phiền đau đầu dữ dội, sốt 38.5°C',
    diagnosis: 'Sốt không rõ nguyên nhân',
});
```

### Xem Lịch Sử Khám

```javascript
const getPatientHistory = async (patientId, page = 1) => {
    const response = await fetch(
        `/api/v1/examinations/patient/${patientId}/history?page=${page}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    );
    return response.json();
};
```

### Hoàn Thành Hồ Sơ

```javascript
const completeExamination = async (examinationId) => {
    const response = await fetch(
        `/api/v1/examinations/${examinationId}/complete`,
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

1. **Mã hồ sơ khám** được tự động tạo theo định dạng `PK{YYYYMMDD}{001}` (ví dụ: PK20240115001)
2. **Chỉ hồ sơ đang trong quá trình** (`in_progress`) mới có thể cập nhật hoặc hủy
3. **Để hoàn thành hồ sơ**, bắt buộc phải có chẩn đoán
4. **Tất cả thời gian** đều sử dụng định dạng ISO 8601
5. **Phân trang** được áp dụng cho tất cả danh sách để tối ưu hiệu suất
