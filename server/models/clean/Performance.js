const mongoose = require('mongoose');

/**
 * Performance Model - Auto-calculated student performance metrics
 * Calculates from attendance records
 */

const performanceSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        unique: true,
        ref: 'User',
        index: true
    },

    // Overall metrics
    totalLectures: {
        type: Number,
        default: 0
    },
    attendedLectures: {
        type: Number,
        default: 0
    },
    overallPercentage: {
        type: Number,
        default: 0
    },

    // Subject-wise breakdown
    subjectWise: [{
        subject: String,
        total: Number,
        attended: Number,
        percentage: Number
    }],

    // Academic metrics
    sessionalMarks: {
        type: Number,
        default: 0
    },
    cgpa: {
        type: Number,
        default: 0
    },

    // Behavioral metrics
    onTimeCount: {
        type: Number,
        default: 0
    },
    lateCount: {
        type: Number,
        default: 0
    },

    // Metadata
    lastCalculated: {
        type: Date,
        default: Date.now
    },
    academicYear: {
        type: String,
        default: '2024-2025'
    }
}, {
    timestamps: true
});

// Indexes
performanceSchema.index({ studentId: 1 }, { unique: true });
performanceSchema.index({ overallPercentage: -1 });
performanceSchema.index({ academicYear: 1 });

/**
 * Calculate or recalculate performance for a student
 */
performanceSchema.statics.recalculateForStudent = async function (studentId) {
    try {
        const Attendance = require('./Attendance');

        // Get all attendance records for this student
        const attendanceRecords = await Attendance.find({ studentId: studentId });

        if (attendanceRecords.length === 0) {
            return null;
        }

        // Calculate overall metrics
        const totalLectures = attendanceRecords.length;
        const attendedLectures = attendanceRecords.filter(r => r.status === 'present').length;
        const overallPercentage = totalLectures > 0 ? (attendedLectures / totalLectures) * 100 : 0;

        // Calculate subject-wise metrics
        const subjectMap = new Map();

        attendanceRecords.forEach(record => {
            if (!subjectMap.has(record.subject)) {
                subjectMap.set(record.subject, {
                    subject: record.subject,
                    total: 0,
                    attended: 0,
                    percentage: 0
                });
            }

            const subjectData = subjectMap.get(record.subject);
            subjectData.total++;
            if (record.status === 'present') {
                subjectData.attended++;
            }
        });

        // Calculate percentages for each subject
        const subjectWise = Array.from(subjectMap.values()).map(subject => ({
            ...subject,
            percentage: subject.total > 0 ? (subject.attended / subject.total) * 100 : 0
        }));

        // Calculate behavioral metrics
        const onTimeCount = attendanceRecords.filter(r =>
            r.status === 'present' && !r.isLate
        ).length;
        const lateCount = attendanceRecords.filter(r =>
            r.status === 'late'
        ).length;

        // Calculate CGPA based on attendance (simplified)
        // 90-100% = 10 CGPA, 80-90% = 9 CGPA, etc.
        let cgpa = 0;
        if (overallPercentage >= 90) cgpa = 10;
        else if (overallPercentage >= 80) cgpa = 9;
        else if (overallPercentage >= 70) cgpa = 8;
        else if (overallPercentage >= 60) cgpa = 7;
        else if (overallPercentage >= 50) cgpa = 6;
        else if (overallPercentage >= 40) cgpa = 5;
        else cgpa = 4;

        // Update or create performance record
        const performance = await this.findOneAndUpdate(
            { studentId: studentId },
            {
                studentId: studentId,
                totalLectures: totalLectures,
                attendedLectures: attendedLectures,
                overallPercentage: Math.round(overallPercentage * 100) / 100,
                subjectWise: subjectWise,
                cgpa: cgpa,
                onTimeCount: onTimeCount,
                lateCount: lateCount,
                lastCalculated: new Date()
            },
            { upsert: true, new: true }
        );

        return performance;
    } catch (error) {
        console.error('Error calculating performance:', error);
        return null;
    }
};

/**
 * Get performance summary for a student
 */
performanceSchema.methods.getSummary = function () {
    return {
        studentId: this.studentId,
        overallPercentage: this.overallPercentage,
        totalLectures: this.totalLectures,
        attendedLectures: this.attendedLectures,
        cgpa: this.cgpa,
        subjectCount: this.subjectWise.length,
        lastCalculated: this.lastCalculated
    };
};

/**
 * Check if student is at risk (below 75% attendance)
 */
performanceSchema.methods.isAtRisk = function () {
    return this.overallPercentage < 75;
};

/**
 * Get subject with lowest attendance
 */
performanceSchema.methods.getLowestSubject = function () {
    if (this.subjectWise.length === 0) return null;

    return this.subjectWise.reduce((lowest, current) =>
        current.percentage < lowest.percentage ? current : lowest
    );
};

/**
 * Get subject with highest attendance
 */
performanceSchema.methods.getHighestSubject = function () {
    if (this.subjectWise.length === 0) return null;

    return this.subjectWise.reduce((highest, current) =>
        current.percentage > highest.percentage ? current : highest
    );
};

const Performance = mongoose.model('Performance', performanceSchema);

module.exports = Performance;
