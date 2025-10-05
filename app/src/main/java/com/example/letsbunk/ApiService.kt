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
    val bssid: String,
    val deviceId: String
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

// Use unified StudentData model instead of duplicate
typealias StudentAttendanceServer = StudentData

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
    
    // Authentication
    @POST("api/auth/login")
    fun login(@Body request: LoginRequest): Call<LoginResponse>
    
    @POST("api/auth/register")
    fun register(@Body request: RegisterRequest): Call<RegisterResponse>
    
    @POST("api/auth/verify")
    fun verifyToken(@Body request: VerifyTokenRequest): Call<VerifyTokenResponse>
    
    @GET("api/auth/profile/{userId}")
    fun getProfile(@Path("userId") userId: String): Call<ProfileResponse>
    
    @GET("api/config/bssid")
    fun getAuthorizedBSSID(): Call<BSSIDResponse>
    
    @POST("api/verify-bssid")
    fun verifyBSSID(@Body request: VerifyBSSIDRequest): Call<VerifyBSSIDResponse>
    
    // Period-based Attendance (NEW)
    @POST("api/period-attendance/start")
    fun startPeriodAttendance(@Body request: PeriodAttendanceStartRequest): Call<PeriodAttendanceStartResponse>
    
    @POST("api/period-attendance/checkin")
    fun checkInPeriod(@Body request: PeriodAttendanceCheckInRequest): Call<PeriodAttendanceCheckInResponse>
    
    @GET("api/period-attendance/status/{studentId}")
    fun getPeriodStatus(@Path("studentId") studentId: String): Call<PeriodStatusResponse>
    
    @GET("api/period-attendance/today/{studentId}")
    fun getTodayAttendance(
        @Path("studentId") studentId: String,
        @Query("branch") branch: String,
        @Query("semester") semester: String
    ): Call<TodayAttendanceResponse>
    
    @POST("api/period-attendance/end")
    fun endPeriodSession(@Body request: Map<String, String>): Call<EndSessionResponse>
    
    @GET("api/period-attendance/active-sessions")
    fun getActiveSessions(
        @Query("branch") branch: String? = null,
        @Query("semester") semester: String? = null
    ): Call<ActiveSessionsResponse>
    
    // Legacy timer-based attendance (for backward compatibility)
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
    
    // Timer state endpoints
    @POST("api/period-attendance/timer/update")
    fun updateTimerState(@Body request: TimerStateRequest): Call<TimerStateResponse>
    
    @GET("api/period-attendance/timer/state/{studentId}")
    fun getTimerState(@Path("studentId") studentId: String): Call<TimerStateResponse>
    
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
    fun getTimetableTable(
        @Path("branch") branch: String,
        @Path("semester") semester: String
    ): Call<TimetableResponse>
    
    @POST("api/timetable-table")
    fun saveTimetableTable(@Body request: TimetableRequest): Call<TimetableResponse>
    
    @DELETE("api/timetable-table/{branch}/{semester}")
    fun deleteTimetableTable(
        @Path("branch") branch: String,
        @Path("semester") semester: String
    ): Call<TimetableResponse>
    
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

// Timetable Table Data Classes (matching web frontend structure)
data class TimetableRequest(
    val branch: String,
    val semester: String,
    val periods: List<Period>
)

data class TimetableResponse(
    val success: Boolean,
    val message: String? = null,
    val timetable: TimetableData? = null
)

data class TimetableData(
    val branch: String,
    val semester: String,
    val periods: List<Period>
)

data class Period(
    val periodNumber: Int,
    val startTime: String,
    val endTime: String,
    val monday: PeriodEntry = PeriodEntry(),
    val tuesday: PeriodEntry = PeriodEntry(),
    val wednesday: PeriodEntry = PeriodEntry(),
    val thursday: PeriodEntry = PeriodEntry(),
    val friday: PeriodEntry = PeriodEntry(),
    val saturday: PeriodEntry = PeriodEntry()
)

data class PeriodEntry(
    val subject: String = "",
    val room: String = "",
    val teacher: String = ""
) {
    fun isEmpty(): Boolean = subject.isEmpty() && room.isEmpty() && teacher.isEmpty()
    fun isBreak(): Boolean = subject.equals("BREAK", ignoreCase = true)
}

// Period-based Attendance Data Classes
data class PeriodAttendanceStartRequest(
    val studentId: String,
    val studentName: String,
    val branch: String,
    val semester: String,
    val bssid: String
)

data class PeriodAttendanceCheckInRequest(
    val studentId: String,
    val studentName: String,
    val branch: String,
    val semester: String,
    val bssid: String
)

data class CurrentPeriodInfo(
    val periodNumber: Int,
    val startTime: String,
    val endTime: String,
    val subject: String,
    val teacher: String,
    val room: String,
    val dayOfWeek: String
)

data class PeriodAttendanceRecord(
    val periodNumber: Int,
    val subject: String,
    val status: String,
    val checkInTime: String? = null,
    val checkOutTime: String? = null
)

data class TodayAttendanceSummary(
    val date: String,
    val totalPeriods: Int,
    val periodsPresent: Int,
    val periodsAbsent: Int,
    val attendancePercentage: Int,
    val periods: List<CurrentPeriodInfo>,
    val attendanceRecords: List<PeriodAttendanceRecord>
)

data class ActiveSessionInfo(
    val studentId: String,
    val studentName: String,
    val branch: String,
    val semester: String,
    val sessionDate: String,
    val dayOfWeek: String,
    val currentPeriod: CurrentPeriodInfo?,
    val isPresent: Boolean,
    val totalPeriodsToday: Int,
    val periodsPresent: Int,
    val periodsAbsent: Int,
    val todayAttendancePercentage: Int,
    val bssid: String? = null,
    val timerState: TimerState? = null
)

data class PeriodAttendanceStartResponse(
    val success: Boolean,
    val message: String,
    val session: ActiveSessionInfo? = null,
    val currentPeriod: CurrentPeriodInfo? = null,
    val todayAttendance: TodayAttendanceSummary? = null,
    val attendanceMarked: Boolean = false,
    val alreadyActive: Boolean = false,
    val error: String? = null
)

data class PeriodAttendanceCheckInResponse(
    val success: Boolean,
    val message: String,
    val currentPeriod: CurrentPeriodInfo? = null,
    val todayAttendance: TodayAttendanceSummary? = null,
    val error: String? = null
)

data class PeriodStatusResponse(
    val success: Boolean,
    val message: String? = null,
    val hasSession: Boolean,
    val session: ActiveSessionInfo? = null,
    val currentPeriod: CurrentPeriodInfo? = null,
    val nextPeriod: CurrentPeriodInfo? = null,
    val todayAttendance: TodayAttendanceSummary? = null,
    val isCollegeHours: Boolean = false
)

data class TodayAttendanceResponse(
    val success: Boolean,
    val attendance: TodayAttendanceSummary? = null
)

data class EndSessionResponse(
    val success: Boolean,
    val message: String,
    val finalAttendance: TodayAttendanceSummary? = null
)

data class ActiveSessionsResponse(
    val success: Boolean,
    val sessions: List<ActiveSessionInfo>,
    val count: Int
)

// Timer State Data Classes
data class TimerStateRequest(
    val studentId: String,
    val isRunning: Boolean? = null,
    val secondsRemaining: Int? = null
)

data class TimerStateResponse(
    val success: Boolean,
    val message: String? = null,
    val timerState: TimerState? = null
)

data class TimerState(
    val isRunning: Boolean,
    val secondsRemaining: Int,
    val lastUpdated: String
)

// Authentication Data Classes
data class LoginRequest(
    val userId: String,
    val password: String,
    val deviceId: String? = null
)

data class LoginResponse(
    val success: Boolean,
    val message: String? = null,
    val token: String? = null,
    val user: UserProfile? = null,
    val error: String? = null
)

data class RegisterRequest(
    val userId: String,
    val email: String,
    val password: String,
    val name: String,
    val role: String, // "student" or "teacher"
    val branch: String? = null,
    val semester: String? = null,
    val rollNo: String? = null,
    val department: String? = null,
    val subject: String? = null,
    val phone: String? = null
)

data class RegisterResponse(
    val success: Boolean,
    val message: String? = null,
    val token: String? = null,
    val user: UserProfile? = null,
    val error: String? = null
)

data class VerifyTokenRequest(
    val token: String
)

data class VerifyTokenResponse(
    val success: Boolean,
    val message: String? = null,
    val user: UserProfile? = null,
    val error: String? = null
)

data class ProfileResponse(
    val success: Boolean,
    val user: UserProfile? = null,
    val error: String? = null
)

data class UserProfile(
    val userId: String,
    val email: String,
    val name: String,
    val role: String,
    val phone: String? = null,
    val isActive: Boolean = true,
    val lastLogin: String? = null,
    // Student fields
    val branch: String? = null,
    val semester: String? = null,
    val rollNo: String? = null,
    // Teacher fields
    val department: String? = null,
    val subject: String? = null
)
