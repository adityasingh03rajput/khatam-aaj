package com.example.letsbunk

data class StudentAttendance(
    val name: String,
    val department: String,
    val location: String,
    var timeRemaining: Int,
    var timerState: String = "running", // running, paused, completed
    var attendanceStatus: String = "attending", // attending, absent, attended
    var isPresent: Boolean
)