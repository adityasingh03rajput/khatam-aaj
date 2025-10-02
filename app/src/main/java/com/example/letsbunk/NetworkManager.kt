package com.example.letsbunk

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.net.URISyntaxException

object NetworkManager {
    
    // Server configuration - PC IP on same WiFi network
    private const val SERVER_URL = "http://192.168.246.31:3000"
    private const val MAX_RETRY_ATTEMPTS = 3
    private const val RETRY_DELAY_MS = 2000L
    
    private var socket: Socket? = null
    private var isConnected = false
    private var reconnectAttempts = 0
    private var shouldReconnect = true
    
    // Retrofit instance with timeout configuration
    val apiService: ApiService by lazy {
        val okHttpClient = okhttp3.OkHttpClient.Builder()
            .connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
            .writeTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
            .addInterceptor { chain ->
                val request = chain.request()
                Log.d("NetworkManager", "API Request: ${request.method} ${request.url}")
                try {
                    val response = chain.proceed(request)
                    Log.d("NetworkManager", "API Response: ${response.code} ${request.url}")
                    response
                } catch (e: Exception) {
                    Log.e("NetworkManager", "API Error: ${request.url}", e)
                    throw e
                }
            }
            .build()
        
        Retrofit.Builder()
            .baseUrl(SERVER_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
    
    // Socket.IO connection with auto-reconnect
    fun connectSocket(
        onConnected: () -> Unit = {},
        onDisconnected: () -> Unit = {},
        onError: (String) -> Unit = {}
    ) {
        try {
            if (socket == null) {
                val options = IO.Options().apply {
                    reconnection = true
                    reconnectionAttempts = MAX_RETRY_ATTEMPTS
                    reconnectionDelay = RETRY_DELAY_MS
                    timeout = 10000
                }
                socket = IO.socket(SERVER_URL, options)
            }
            
            socket?.apply {
                on(Socket.EVENT_CONNECT) {
                    Log.d("NetworkManager", "✓ Socket connected successfully")
                    isConnected = true
                    reconnectAttempts = 0
                    onConnected()
                }
                
                on(Socket.EVENT_DISCONNECT) {
                    Log.d("NetworkManager", "Socket disconnected")
                    isConnected = false
                    onDisconnected()
                    
                    // Attempt reconnection if enabled
                    if (shouldReconnect && reconnectAttempts < MAX_RETRY_ATTEMPTS) {
                        reconnectAttempts++
                        Log.d("NetworkManager", "Reconnection attempt $reconnectAttempts/$MAX_RETRY_ATTEMPTS")
                        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                            if (!isConnected && shouldReconnect) {
                                connect()
                            }
                        }, RETRY_DELAY_MS)
                    }
                }
                
                on(Socket.EVENT_CONNECT_ERROR) { args ->
                    Log.e("NetworkManager", "Socket connection error: ${args.getOrNull(0)}")
                    onError("Connection error: ${args.getOrNull(0)}")
                }
                
                on("reconnect") { args ->
                    Log.d("NetworkManager", "Socket reconnected after ${args.getOrNull(0)} attempts")
                }
                
                on("reconnect_error") { args ->
                    Log.e("NetworkManager", "Socket reconnection error: ${args.getOrNull(0)}")
                }
                
                on("reconnect_failed") {
                    Log.e("NetworkManager", "Socket reconnection failed after $MAX_RETRY_ATTEMPTS attempts")
                    onError("Failed to reconnect to server")
                }
                
                connect()
            }
        } catch (e: URISyntaxException) {
            Log.e("NetworkManager", "Socket URI error", e)
            onError("Invalid server URL")
        } catch (e: Exception) {
            Log.e("NetworkManager", "Socket connection error", e)
            onError("Connection failed: ${e.message}")
        }
    }
    
    fun disconnectSocket() {
        shouldReconnect = false
        socket?.disconnect()
        socket?.off()
        isConnected = false
        reconnectAttempts = 0
        Log.d("NetworkManager", "Socket disconnected manually")
    }
    
    fun isSocketConnected(): Boolean = isConnected
    
    fun enableReconnection() {
        shouldReconnect = true
    }
    
    fun disableReconnection() {
        shouldReconnect = false
    }
    
    fun getServerUrl(): String = SERVER_URL
    
    fun getConnectionStatus(): String {
        return when {
            isConnected -> "Connected"
            reconnectAttempts > 0 -> "Reconnecting... ($reconnectAttempts/$MAX_RETRY_ATTEMPTS)"
            else -> "Disconnected"
        }
    }
    
    // Listen for initial state
    fun onInitialState(callback: (JSONObject) -> Unit) {
        socket?.on("initial-state") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing initial state", e)
            }
        }
    }
    
    // Listen for student connected
    fun onStudentConnected(callback: (JSONObject) -> Unit) {
        socket?.on("student-connected") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing student connected", e)
            }
        }
    }
    
    // Listen for student updated
    fun onStudentUpdated(callback: (JSONObject) -> Unit) {
        socket?.on("student-updated") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing student updated", e)
            }
        }
    }
    
    // Listen for student timer update
    fun onStudentTimerUpdate(callback: (JSONObject) -> Unit) {
        socket?.on("student-timer-update") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing timer update", e)
            }
        }
    }
    
    // Listen for student completed
    fun onStudentCompleted(callback: (JSONObject) -> Unit) {
        socket?.on("student-completed") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing student completed", e)
            }
        }
    }
    
    // Listen for student paused
    fun onStudentPaused(callback: (JSONObject) -> Unit) {
        socket?.on("student-paused") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing student paused", e)
            }
        }
    }
    
    // Listen for student resumed
    fun onStudentResumed(callback: (JSONObject) -> Unit) {
        socket?.on("student-resumed") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing student resumed", e)
            }
        }
    }
    
    // Emit timer update
    fun emitTimerUpdate(studentId: String, timeRemaining: Int) {
        try {
            val data = JSONObject().apply {
                put("studentId", studentId)
                put("timeRemaining", timeRemaining)
            }
            socket?.emit("timer-update", data)
        } catch (e: Exception) {
            Log.e("NetworkManager", "Error emitting timer update", e)
        }
    }
    
    // Emit student disconnect
    fun emitStudentDisconnect(studentId: String) {
        try {
            val data = JSONObject().apply {
                put("studentId", studentId)
            }
            socket?.emit("student-disconnect", data)
        } catch (e: Exception) {
            Log.e("NetworkManager", "Error emitting student disconnect", e)
        }
    }
    
    // Random Ring WebSocket listeners
    fun onRandomRingStarted(callback: (JSONObject) -> Unit) {
        socket?.on("random-ring-started") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing random ring started", e)
            }
        }
    }
    
    fun onRandomRingNotification(callback: (JSONObject) -> Unit) {
        socket?.on("random-ring-notification") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing random ring notification", e)
            }
        }
    }
    
    fun onRandomRingUpdated(callback: (JSONObject) -> Unit) {
        socket?.on("random-ring-updated") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing random ring updated", e)
            }
        }
    }
    
    fun onRandomRingRejected(callback: (JSONObject) -> Unit) {
        socket?.on("random-ring-rejected") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing random ring rejected", e)
            }
        }
    }
    
    fun onRandomRingStudentConfirmed(callback: (JSONObject) -> Unit) {
        socket?.on("random-ring-student-confirmed") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing random ring student confirmed", e)
            }
        }
    }
    
    // Tabular Timetable WebSocket listeners
    fun onTimetableTableUpdated(callback: (JSONObject) -> Unit) {
        socket?.on("timetable-table-updated") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing timetable table updated", e)
            }
        }
    }
    
    fun onTimetableTableDeleted(callback: (JSONObject) -> Unit) {
        socket?.on("timetable-table-deleted") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing timetable table deleted", e)
            }
        }
    }
    
    fun onTimetableCleared(callback: (JSONObject) -> Unit) {
        socket?.on("timetable-cleared") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing timetable cleared", e)
            }
        }
    }
    
    // BSSID update listener
    fun onBSSIDUpdated(callback: (JSONObject) -> Unit) {
        socket?.on("bssid-updated") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing BSSID updated", e)
            }
        }
    }
    
    fun onBSSIDListUpdated(callback: (JSONObject) -> Unit) {
        socket?.on("bssid-list-updated") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing BSSID list updated", e)
            }
        }
    }
    
    // Classroom listener
    fun onClassroomAdded(callback: (JSONObject) -> Unit) {
        socket?.on("classroom-added") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing classroom added", e)
            }
        }
    }
    
    // Attendance cleared listener
    fun onAttendanceCleared(callback: (JSONObject) -> Unit) {
        socket?.on("attendance-cleared") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing attendance cleared", e)
            }
        }
    }
    
    fun onRandomRingAccepted(callback: (JSONObject) -> Unit) {
        socket?.on("random-ring-accepted") { args ->
            try {
                val data = args[0] as JSONObject
                callback(data)
            } catch (e: Exception) {
                Log.e("NetworkManager", "Error parsing random ring accepted", e)
            }
        }
    }
}
