package com.example.letsbunk

import java.util.*

// College Schedule Configuration
object CollegeSchedule {
    const val COLLEGE_START_TIME = "09:40"
    const val COLLEGE_END_TIME = "16:10"
    
    // Lecture timings
    val LECTURE_SLOTS = listOf(
        LectureSlot(1, "09:40", "10:40", 60),
        LectureSlot(2, "10:40", "11:40", 60),
        LectureSlot(3, "11:40", "12:40", 60),
        // Lunch break 12:40-13:10
        LectureSlot(4, "13:10", "14:10", 60),
        // 10 min break 14:10-14:20
        LectureSlot(5, "14:20", "15:15", 55),
        LectureSlot(6, "15:15", "16:10", 55)
    )
    
    // Minimum attendance percentage required
    const val MIN_ATTENDANCE_PERCENT = 83 // 50/60 minutes
    
    fun isCollegeHours(): Boolean {
        val calendar = Calendar.getInstance()
        val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK)
        
        // Saturday = 7, Sunday = 1
        if (dayOfWeek == Calendar.SATURDAY || dayOfWeek == Calendar.SUNDAY) {
            return false
        }
        
        val currentTime = String.format("%02d:%02d", 
            calendar.get(Calendar.HOUR_OF_DAY),
            calendar.get(Calendar.MINUTE))
        
        return currentTime >= COLLEGE_START_TIME && currentTime <= COLLEGE_END_TIME
    }
    
    fun getCurrentLecture(): LectureSlot? {
        if (!isCollegeHours()) return null
        
        val calendar = Calendar.getInstance()
        val currentTime = String.format("%02d:%02d", 
            calendar.get(Calendar.HOUR_OF_DAY),
            calendar.get(Calendar.MINUTE))
        
        return LECTURE_SLOTS.find { 
            currentTime >= it.startTime && currentTime < it.endTime 
        }
    }
    
    fun getNextLecture(): LectureSlot? {
        val current = getCurrentLecture()
        if (current == null) {
            // Find next lecture after current time
            val calendar = Calendar.getInstance()
            val currentTime = String.format("%02d:%02d", 
                calendar.get(Calendar.HOUR_OF_DAY),
                calendar.get(Calendar.MINUTE))
            
            return LECTURE_SLOTS.find { it.startTime > currentTime }
        }
        
        val currentIndex = LECTURE_SLOTS.indexOf(current)
        return if (currentIndex < LECTURE_SLOTS.size - 1) {
            LECTURE_SLOTS[currentIndex + 1]
        } else null
    }
}

data class LectureSlot(
    val number: Int,
    val startTime: String,
    val endTime: String,
    val durationMinutes: Int
)

// Daily attendance session for a student
data class DailyAttendanceSession(
    val studentId: String,
    val studentName: String,
    val branch: String,
    val semester: String,
    val date: String,
    val dayOfWeek: String,
    var isActive: Boolean = true,
    var startedAt: String? = null,
    val lectures: MutableList<LectureAttendance> = mutableListOf()
)

// Individual lecture attendance
data class LectureAttendance(
    val lectureNumber: Int,
    val subject: String,
    val teacher: String,
    val room: String,
    val startTime: String,
    val endTime: String,
    val durationMinutes: Int,
    var status: AttendanceStatus = AttendanceStatus.PENDING,
    var joinedAt: String? = null,
    var minutesAttended: Int = 0,
    var attendancePercent: Int = 0,
    var distance: Float = 100f, // 100 = far, 0 = caught trophy
    var trophyCaught: Boolean = false
)

enum class AttendanceStatus {
    PENDING,      // Lecture not started yet
    ATTENDING,    // Currently in lecture
    PRESENT,      // Completed with attendance marked
    ABSENT,       // Missed or insufficient attendance
    BREAK         // Break period
}

// Trophy chase animation state
data class TrophyChaseState(
    var currentLecture: Int = 1,
    var distance: Float = 100f,
    var isChasing: Boolean = false,
    var isCelebrating: Boolean = false,
    var trophiesCaught: Int = 0,
    var currentSubject: String = "",
    var timeInLecture: Int = 0,
    var timeRemaining: Int = 0
)

// Calendar day data
data class CalendarDay(
    val date: String,
    val dayOfWeek: String,
    val totalLectures: Int,
    val attended: Int,
    val absent: Int,
    val attendancePercent: Int,
    val status: DayStatus
)

enum class DayStatus {
    ABSENT,           // Red - no attendance
    ATTENDING,        // Green - currently attending
    PRESENT_LOW,      // Light green - present but low %
    PRESENT_HIGH,     // Dark green - present with high %
    HOLIDAY,          // Gray - weekend/holiday
    FUTURE            // Light gray - future date
}

// Teacher's current lecture view
data class TeacherLectureView(
    val teacherId: String,
    val teacherName: String,
    val currentLecture: LectureSlot?,
    val subject: String,
    val room: String,
    val branch: String,
    val semester: String,
    val section: String,
    val students: List<StudentLectureStatus>
)

data class StudentLectureStatus(
    val studentId: String,
    val studentName: String,
    val rollNo: String,
    val status: AttendanceStatus,
    val joinedAt: String?,
    val minutesInClass: Int,
    val distance: Float,
    val totalAttendancePercent: Int // Overall attendance %
)
