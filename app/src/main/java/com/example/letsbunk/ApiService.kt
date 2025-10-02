package com.example.letsbunk

import retrofit2.Call
import retrofit2.http.*

data class BSSIDResponse(
    val authorizedBSSID: String,
    val message: String
)

data class VerifyBSSIDRequest(
    val bssid: String
)

data class VerifyBSSIDResponse(
    val authorized: Boolean,
    val bssid: String,
    val authorizedBSSID: String
)

data class StartAttendanceRequest(
    val studentName: String,
    val department: String,
    val room: String,
    val bssid: String
)

data class StartAttendanceResponse(
    val success: Boolean,
    val studentId: String,
    val message: String,
    val student: StudentAttendanceServer
)

data class UpdateAttendanceRequest(
    val studentId: String,
    val timeRemaining: Int,
    val isPresent: Boolean
)

data class UpdateAttendanceResponse(
    val success: Boolean,
    val student: StudentAttendanceServer
)

data class StudentAttendanceServer(
    val id: String,
    val name: String,
    val department: String,
    val room: String,
    var timeRemaining: Int,
    var timerState: String, // running, paused, completed
    var attendanceStatus: String, // attending, absent, attended
    var isPresent: Boolean,
    val startTime: String,
    val bssid: String
)

data class AttendanceListResponse(
    val students: List<StudentAttendanceServer>,
    val count: Int,
    val timestamp: String
)

data class RandomRingStartRequest(
    val numberOfStudents: Int
)

data class RandomRingStartResponse(
    val success: Boolean,
    val selectedStudents: List<RandomRingStudent>,
    val count: Int
)

data class RandomRingStudent(
    val id: String,
    val name: String,
    val department: String,
    val room: String,
    val timeRemaining: Int,
    val isPresent: Boolean,
    val ringStatus: String,
    val ringTime: String
)

data class RandomRingTeacherResponse(
    val studentId: String,
    val action: String // "accept" or "reject"
)

data class RandomRingStudentConfirm(
    val studentId: String
)

data class RandomRingResponse(
    val success: Boolean,
    val student: RandomRingStudent? = null,
    val message: String? = null
)

interface ApiService {
    
    @GET("api/config/bssid")
    fun getAuthorizedBSSID(): Call<BSSIDResponse>
    
    @POST("api/verify-bssid")
    fun verifyBSSID(@Body request: VerifyBSSIDRequest): Call<VerifyBSSIDResponse>
    
    @POST("api/attendance/start")
    fun startAttendance(@Body request: StartAttendanceRequest): Call<StartAttendanceResponse>
    
    @POST("api/attendance/update")
    fun updateAttendance(@Body request: UpdateAttendanceRequest): Call<UpdateAttendanceResponse>
    
    @POST("api/attendance/complete")
    fun completeAttendance(@Body request: Map<String, String>): Call<UpdateAttendanceResponse>
    
    @POST("api/attendance/pause")
    fun pauseAttendance(@Body request: Map<String, String>): Call<UpdateAttendanceResponse>
    
    @POST("api/attendance/resume")
    fun resumeAttendance(@Body request: Map<String, String>): Call<UpdateAttendanceResponse>
    
    @GET("api/attendance/list")
    fun getAttendanceList(): Call<AttendanceListResponse>
    
    // Random Ring endpoints
    @POST("api/random-ring/start")
    fun startRandomRing(@Body request: RandomRingStartRequest): Call<RandomRingStartResponse>
    
    @POST("api/random-ring/teacher-response")
    fun teacherRandomRingResponse(@Body request: RandomRingTeacherResponse): Call<RandomRingResponse>
    
    @POST("api/random-ring/student-confirm")
    fun studentConfirmRandomRing(@Body request: RandomRingStudentConfirm): Call<RandomRingResponse>
    
    @GET("api/random-ring/status")
    fun getRandomRingStatus(): Call<RandomRingStartResponse>
    
    // Tabular Timetable endpoints
    @GET("api/timetable-table/{branch}/{semester}")
    fun getTabularTimetable(
        @Path("branch") branch: String,
        @Path("semester") semester: String
    ): Call<TimetableTableResponse>
    
    @POST("api/timetable-table")
    fun saveTabularTimetable(@Body request: TimetableTableRequest): Call<TimetableTableResponse>
    
    @DELETE("api/timetable-table/{branch}/{semester}")
    fun deleteTabularTimetable(
        @Path("branch") branch: String,
        @Path("semester") semester: String
    ): Call<TimetableTableResponse>
    
    // BSSID Management endpoints
    @PUT("api/config/bssid")
    fun updateBSSID(@Body request: Map<String, String>): Call<BSSIDUpdateResponse>
    
    @GET("api/config/bssid-list")
    fun getBSSIDList(): Call<BSSIDListResponse>
    
    @POST("api/config/bssid-list")
    fun addBSSID(@Body request: Map<String, String>): Call<BSSIDListResponse>
    
    // Student Management endpoints
    @GET("api/students")
    fun getStudents(
        @Query("department") department: String? = null,
        @Query("limit") limit: Int? = null
    ): Call<StudentsResponse>
    
    @GET("api/students/{id}")
    fun getStudent(@Path("id") id: String): Call<StudentResponse>
    
    // Attendance History & Statistics
    @GET("api/attendance/history")
    fun getAttendanceHistory(
        @Query("department") department: String? = null,
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null,
        @Query("limit") limit: Int? = null
    ): Call<AttendanceHistoryResponse>
    
    @GET("api/attendance/statistics")
    fun getAttendanceStatistics(
        @Query("department") department: String? = null,
        @Query("date") date: String? = null
    ): Call<AttendanceStatisticsResponse>
    
    @POST("api/attendance/disconnect")
    fun disconnectStudent(@Body request: Map<String, String>): Call<UpdateAttendanceResponse>
    
    @POST("api/attendance/clear-all")
    fun clearAllAttendance(): Call<ClearAttendanceResponse>
    
    @GET("api/attendance/export")
    fun exportAttendance(@Query("format") format: String? = null): Call<ExportAttendanceResponse>
    
    // Classroom Management
    @GET("api/classrooms")
    fun getClassrooms(): Call<ClassroomsResponse>
    
    @POST("api/classrooms")
    fun addClassroom(@Body request: ClassroomRequest): Call<ClassroomResponse>
    
    // Server Statistics
    @GET("api/statistics/server")
    fun getServerStatistics(): Call<ServerStatisticsResponse>
}

// Additional Response Models
data class BSSIDUpdateResponse(
    val success: Boolean,
    val authorizedBSSID: String,
    val message: String
)

data class BSSIDListResponse(
    val bssidList: List<BSSIDItem>,
    val count: Int
)

data class BSSIDItem(
    val name: String,
    val bssid: String
)

data class StudentsResponse(
    val students: List<StudentAttendanceServer>,
    val count: Int
)

data class StudentResponse(
    val student: StudentAttendanceServer
)

data class AttendanceHistoryResponse(
    val records: List<AttendanceRecordItem>,
    val count: Int
)

data class AttendanceRecordItem(
    val id: String,
    val name: String,
    val department: String,
    val room: String,
    val timeRemaining: Int,
    val timerState: String,
    val attendanceStatus: String,
    val isPresent: Boolean,
    val startTime: String,
    val completedAt: String? = null
)

data class AttendanceStatisticsResponse(
    val totalStudents: Int,
    val presentStudents: Int,
    val absentStudents: Int,
    val completedStudents: Int,
    val averageAttendanceTime: Int,
    val attendanceRate: String,
    val timestamp: String
)

data class ClearAttendanceResponse(
    val success: Boolean,
    val message: String,
    val clearedCount: Int
)

data class ExportAttendanceResponse(
    val students: List<StudentAttendanceServer>,
    val count: Int,
    val exportTime: String
)

data class ClassroomsResponse(
    val classrooms: List<ClassroomItem>,
    val count: Int
)

data class ClassroomItem(
    val name: String,
    val bssid: String,
    val capacity: Int? = null,
    val building: String? = null,
    val floor: String? = null
)

data class ClassroomRequest(
    val name: String,
    val bssid: String,
    val capacity: Int? = null,
    val building: String? = null,
    val floor: String? = null
)

data class ClassroomResponse(
    val success: Boolean,
    val classroom: ClassroomItem
)

data class ServerStatisticsResponse(
    val connectedStudents: Int,
    val totalAttendanceRecords: Int,
    val randomRingActive: Boolean,
    val randomRingCount: Int,
    val authorizedBSSID: String,
    val bssidListCount: Int,
    val uptime: Double,
    val mongoDBConnected: Boolean,
    val timestamp: String
)

// Timetable Table Data Classes
data class TimetableTableRequest(
    val branch: String,
    val semester: String,
    val periods: List<Period>
)

data class TimetableTableResponse(
    val success: Boolean,
    val message: String? = null,
    val timetable: TimetableTable? = null
)

data class TimetableTable(
    val branch: String,
    val semester: String,
    val periods: List<Period>
)

data class Period(
    val periodNumber: Int,
    val startTime: String,
    val endTime: String,
    val monday: PeriodEntry? = null,
    val tuesday: PeriodEntry? = null,
    val wednesday: PeriodEntry? = null,
    val thursday: PeriodEntry? = null,
    val friday: PeriodEntry? = null,
    val saturday: PeriodEntry? = null
)

data class PeriodEntry(
    val subject: String,
    val room: String,
    val teacher: String
)
