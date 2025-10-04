package com.example.letsbunk

/**
 * Unified student data model for the application
 * Combines student information with attendance tracking
 */
data class StudentData(
    val id: String = "",
    val name: String,
    val department: String, // Previously className
    val room: String,
    var timeRemaining: Int = 0,
    var timerState: TimerState = TimerState.RUNNING,
    var attendanceStatus: AttendanceStatus = AttendanceStatus.ATTENDING,
    var isPresent: Boolean = false,
    val bssid: String = "",
    val startTime: String = ""
) {
    enum class TimerState {
        RUNNING, PAUSED, COMPLETED
    }
    
    enum class AttendanceStatus {
        ATTENDING, ABSENT, ATTENDED
    }
    
    fun isTimerActive(): Boolean = timerState == TimerState.RUNNING
    
    fun hasCompleted(): Boolean = timerState == TimerState.COMPLETED
    
    fun getFormattedTime(): String {
        val minutes = timeRemaining / 60
        val seconds = timeRemaining % 60
        return String.format("%02d:%02d", minutes, seconds)
    }
}