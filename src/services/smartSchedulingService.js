import DoctorSchedule from '../models/doctorScheduleModel.js';
import User from '../models/userModel.js';
import Appointment from '../models/appointmentModel.js';

class SmartSchedulingService {
    /**
     * Tìm bác sĩ còn trống lịch theo ngày/giờ
     */
    static async findAvailableDoctors(filters) {
        const {
            date,
            time,
            department,
            specialization,
            duration = 30,
        } = filters;

        try {
            // Tìm các lịch trực trong ngày
            const schedules = await DoctorSchedule.find({
                scheduleDate: {
                    $gte: new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate(),
                    ),
                    $lt: new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate() + 1,
                    ),
                },
                status: 'active',
                isActive: true,
                'timeSlots.isAvailable': true,
            })
                .populate('doctor', 'fullName email phone doctorInfo')
                .lean();

            // Lọc theo khoa và chuyên khoa
            let filteredSchedules = schedules;
            if (department) {
                filteredSchedules = filteredSchedules.filter(
                    (schedule) => schedule.department === department,
                );
            }

            // Tìm các slot phù hợp với thời gian yêu cầu
            const availableSlots = [];

            for (const schedule of filteredSchedules) {
                const doctor = schedule.doctor;

                // Kiểm tra chuyên khoa
                if (
                    specialization &&
                    doctor.doctorInfo?.specialization !== specialization
                ) {
                    continue;
                }

                // Kiểm tra từng time slot
                for (const slot of schedule.timeSlots) {
                    if (!slot.isAvailable) continue;

                    const slotStart = new Date(`2000-01-01T${slot.start}:00`);
                    const slotEnd = new Date(`2000-01-01T${slot.end}:00`);
                    const requestedTime = new Date(`2000-01-01T${time}:00`);

                    // Kiểm tra thời gian có phù hợp không
                    if (
                        requestedTime >= slotStart &&
                        requestedTime.getTime() + duration * 60000 <=
                            slotEnd.getTime()
                    ) {
                        // Kiểm tra xem slot có bị đặt lịch chưa
                        const existingAppointments =
                            await Appointment.countDocuments({
                                doctorSchedule: schedule._id,
                                appointmentDate: {
                                    $gte: new Date(
                                        date.getFullYear(),
                                        date.getMonth(),
                                        date.getDate(),
                                    ),
                                    $lt: new Date(
                                        date.getFullYear(),
                                        date.getMonth(),
                                        date.getDate() + 1,
                                    ),
                                },
                                'timeSlot.start': slot.start,
                                status: {
                                    $in: [
                                        'scheduled',
                                        'confirmed',
                                        'checked_in',
                                        'in_progress',
                                    ],
                                },
                            });

                        if (existingAppointments < slot.maxPatients) {
                            availableSlots.push({
                                doctor: {
                                    _id: doctor._id,
                                    fullName: doctor.fullName,
                                    department: schedule.department,
                                    specialization:
                                        doctor.doctorInfo?.specialization,
                                    experience: doctor.doctorInfo?.experience,
                                    consultationFee:
                                        doctor.doctorInfo?.consultationFee,
                                },
                                schedule: {
                                    _id: schedule._id,
                                    shiftType: schedule.shiftType,
                                    timeSlot: slot,
                                },
                                availableCapacity:
                                    slot.maxPatients - existingAppointments,
                            });
                        }
                    }
                }
            }

            return availableSlots;
        } catch (error) {
            throw new Error(`Lỗi tìm bác sĩ: ${error.message}`);
        }
    }

    /**
     * Kiểm tra xung đột lịch
     */
    static async checkAppointmentConflict(appointmentData) {
        const {
            doctor,
            appointmentDate,
            timeSlot,
            excludeAppointmentId = null,
        } = appointmentData;

        try {
            // Tìm lịch trực của bác sĩ trong ngày
            const doctorSchedule = await DoctorSchedule.findOne({
                doctor,
                scheduleDate: {
                    $gte: new Date(
                        appointmentDate.getFullYear(),
                        appointmentDate.getMonth(),
                        appointmentDate.getDate(),
                    ),
                    $lt: new Date(
                        appointmentDate.getFullYear(),
                        appointmentDate.getMonth(),
                        appointmentDate.getDate() + 1,
                    ),
                },
                status: 'active',
                isActive: true,
            });

            if (!doctorSchedule) {
                return {
                    hasConflict: true,
                    reason: 'Bác sĩ không có lịch trực trong ngày này',
                };
            }

            // Kiểm tra time slot có tồn tại không
            const validSlot = doctorSchedule.timeSlots.find(
                (slot) =>
                    slot.start === timeSlot.start && slot.end === timeSlot.end,
            );

            if (!validSlot || !validSlot.isAvailable) {
                return {
                    hasConflict: true,
                    reason: 'Khung giờ không khả dụng',
                };
            }

            // Kiểm tra số lượng bệnh nhân đã đặt
            const existingAppointments = await Appointment.countDocuments({
                doctorSchedule: doctorSchedule._id,
                appointmentDate: {
                    $gte: new Date(
                        appointmentDate.getFullYear(),
                        appointmentDate.getMonth(),
                        appointmentDate.getDate(),
                    ),
                    $lt: new Date(
                        appointmentDate.getFullYear(),
                        appointmentDate.getMonth(),
                        appointmentDate.getDate() + 1,
                    ),
                },
                'timeSlot.start': timeSlot.start,
                status: {
                    $in: [
                        'scheduled',
                        'confirmed',
                        'checked_in',
                        'in_progress',
                    ],
                },
                ...(excludeAppointmentId && {
                    _id: { $ne: excludeAppointmentId },
                }),
            });

            if (existingAppointments >= validSlot.maxPatients) {
                return {
                    hasConflict: true,
                    reason: 'Khung giờ đã đầy',
                };
            }

            return {
                hasConflict: false,
                availableCapacity: validSlot.maxPatients - existingAppointments,
            };
        } catch (error) {
            throw new Error(`Lỗi kiểm tra xung đột: ${error.message}`);
        }
    }

    /**
     * Gợi ý bác sĩ thay thế
     */
    static async suggestAlternativeDoctors(filters) {
        const {
            preferredDoctor,
            date,
            time,
            department,
            specialization,
            duration = 30,
        } = filters;

        try {
            // Tìm bác sĩ thay thế trong cùng khoa
            const alternativeDoctors = await this.findAvailableDoctors({
                date,
                time,
                department,
                specialization,
                duration,
            });

            // Loại bỏ bác sĩ mong muốn khỏi danh sách
            const filteredAlternatives = alternativeDoctors.filter(
                (slot) => slot.doctor._id.toString() !== preferredDoctor,
            );

            // Sắp xếp theo độ phù hợp (cùng chuyên khoa, kinh nghiệm cao)
            const sortedAlternatives = filteredAlternatives.sort((a, b) => {
                // Ưu tiên cùng chuyên khoa
                if (
                    a.doctor.specialization === specialization &&
                    b.doctor.specialization !== specialization
                ) {
                    return -1;
                }
                if (
                    b.doctor.specialization === specialization &&
                    a.doctor.specialization !== specialization
                ) {
                    return 1;
                }

                // Ưu tiên kinh nghiệm cao hơn
                return (b.doctor.experience || 0) - (a.doctor.experience || 0);
            });

            return sortedAlternatives.slice(0, 5); // Trả về tối đa 5 gợi ý
        } catch (error) {
            throw new Error(`Lỗi gợi ý bác sĩ: ${error.message}`);
        }
    }

    /**
     * Lấy lịch trực của bác sĩ theo tuần
     */
    static async getDoctorWeeklySchedule(doctorId, weekStartDate) {
        try {
            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekEndDate.getDate() + 6);

            const schedules = await DoctorSchedule.find({
                doctor: doctorId,
                scheduleDate: {
                    $gte: weekStartDate,
                    $lte: weekEndDate,
                },
                isActive: true,
            })
                .populate('doctor', 'fullName email phone doctorInfo')
                .sort({ scheduleDate: 1, 'timeSlots.start': 1 });

            return schedules;
        } catch (error) {
            throw new Error(`Lỗi lấy lịch tuần: ${error.message}`);
        }
    }

    /**
     * Thống kê lịch trực
     */
    static async getScheduleStatistics(filters) {
        const { doctor, department, startDate, endDate } = filters;

        try {
            const matchFilter = {
                isActive: true,
                ...(doctor && { doctor }),
                ...(department && { department }),
                ...(startDate &&
                    endDate && {
                        scheduleDate: {
                            $gte: startDate,
                            $lte: endDate,
                        },
                    }),
            };

            const schedules = await DoctorSchedule.aggregate([
                { $match: matchFilter },
                {
                    $group: {
                        _id: {
                            department: '$department',
                            shiftType: '$shiftType',
                        },
                        totalSchedules: { $sum: 1 },
                        totalSlots: { $sum: { $size: '$timeSlots' } },
                        availableSlots: {
                            $sum: {
                                $size: {
                                    $filter: {
                                        input: '$timeSlots',
                                        cond: {
                                            $eq: ['$$this.isAvailable', true],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalSchedules: { $sum: '$totalSchedules' },
                        totalSlots: { $sum: '$totalSlots' },
                        availableSlots: { $sum: '$availableSlots' },
                        byDepartment: {
                            $push: {
                                department: '$_id.department',
                                shiftType: '$_id.shiftType',
                                schedules: '$totalSchedules',
                                slots: '$totalSlots',
                                available: '$availableSlots',
                            },
                        },
                    },
                },
            ]);

            return (
                schedules[0] || {
                    totalSchedules: 0,
                    totalSlots: 0,
                    availableSlots: 0,
                    byDepartment: [],
                }
            );
        } catch (error) {
            throw new Error(`Lỗi thống kê: ${error.message}`);
        }
    }
}

export default SmartSchedulingService;
