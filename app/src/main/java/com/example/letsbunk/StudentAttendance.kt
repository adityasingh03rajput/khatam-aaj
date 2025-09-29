package com.example.letsbunk

data class StudentAttendance(
    val name: String,
    val department: String,
    val location: String,
    var timeRemaining: Int,
    var isPresent: Boolean
)