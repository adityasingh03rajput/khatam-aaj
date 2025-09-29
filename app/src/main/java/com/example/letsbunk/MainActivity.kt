package com.example.letsbunk

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager 
import android.net.wifi.WifiManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.tabs.TabLayout

class MainActivity : AppCompatActivity() {

    private lateinit var timerTextView: TextView
    private lateinit var connectionStatusTextView: TextView
    private lateinit var wifiBssidTextView: TextView
    private lateinit var markAttendanceButton: Button
    private lateinit var userNameTextView: TextView
    private lateinit var wifiManager: WifiManager
    private lateinit var teacherView: LinearLayout
    private lateinit var studentView: LinearLayout
    private lateinit var attendanceRecyclerView: RecyclerView
    private lateinit var attendanceAdapter: AttendanceAdapter
    
    // Timetable related views
    private lateinit var teacherTabLayout: TabLayout
    private lateinit var attendanceSection: LinearLayout
    private lateinit var timetableSection: LinearLayout
    private lateinit var timetableRecyclerView: RecyclerView
    private lateinit var timetableAdapter: TimetableAdapter
    private lateinit var branchSpinner: Spinner
    private lateinit var semesterSpinner: Spinner
    private lateinit var addTimeSlotButton: Button
    private lateinit var timeSlotEditor: androidx.cardview.widget.CardView

    private val handler = Handler(Looper.getMainLooper())
    private var isRunning = false
    private var seconds = 600 // 10 minutes
    private val TIMER_INTERVAL = 1000L // 1 second
    private val TARGET_BSSID = "78:90:a2:ea:ea:3c" // Authorized Wi-Fi MAC address
    private var isConnectedToAuthorizedWifi = false
    private var userName = ""
    private var wasRunning = false // To track if timer was running before disconnection
    private var isStudent = false // To track user role
    private lateinit var runnable: Runnable

    private val locationPermissions = arrayOf(
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
    )

    companion object {
        private const val PERMISSION_REQUEST_CODE = 100
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        initializeViews()
        setupRecyclerView()
        setupTimetableViews()
        setupTabLayout()
        setupClickListeners()
        checkPermissions()
        initTimer()
        
        // Show role selection dialog immediately
        showRoleSelectionDialog()
    }

    private fun initializeViews() {
        timerTextView = findViewById(R.id.timerTextView)
        connectionStatusTextView = findViewById(R.id.connectionStatusTextView)
        wifiBssidTextView = findViewById(R.id.wifiBssidTextView)
        markAttendanceButton = findViewById(R.id.markAttendanceButton)
        userNameTextView = findViewById(R.id.userNameTextView)
        teacherView = findViewById(R.id.teacherView)
        studentView = findViewById(R.id.studentView)
        attendanceRecyclerView = findViewById(R.id.attendanceRecyclerView)
    }

    private fun setupRecyclerView() {
        attendanceAdapter = AttendanceAdapter()
        attendanceRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = attendanceAdapter
        }
    }

    private fun setupClickListeners() {
        markAttendanceButton.setOnClickListener {
            if (!hasLocationPermission()) {
                Toast.makeText(this, "Location permission is required", Toast.LENGTH_SHORT).show()
                requestLocationPermission()
                return@setOnClickListener
            }

            if (!isConnectedToAuthorizedWifi) {
                Toast.makeText(this, "Not connected to authorized Wi-Fi", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (isRunning) {
                stopTimer()
            } else {
                startTimer()
            }
        }
    }

    private fun hasLocationPermission(): Boolean {
        return locationPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun showRoleSelectionDialog() {
        val dialog = AlertDialog.Builder(this)
        dialog.setTitle("Select Your Role")
        dialog.setCancelable(false)
        
        val options = arrayOf("Teacher", "Student")
        dialog.setSingleChoiceItems(options, -1) { dialogInterface, index ->
            isStudent = index == 1 // index 1 is Student
            dialogInterface.dismiss()
            
            if (isStudent) {
                // For student, show the name input dialog and proceed with attendance
                if (userName.isEmpty()) {
                    showNameInputDialog()
                }
                updateUIForStudent()
            } else {
                // For teacher, show welcome message and hide attendance UI
                updateUIForTeacher()
            }
        }
        dialog.show()
    }

    private fun updateUIForStudent() {
        studentView.visibility = android.view.View.VISIBLE
        teacherView.visibility = android.view.View.GONE
        timerTextView.visibility = android.view.View.VISIBLE
        connectionStatusTextView.visibility = android.view.View.VISIBLE
        wifiBssidTextView.visibility = android.view.View.VISIBLE
        markAttendanceButton.visibility = android.view.View.VISIBLE
        userNameTextView.visibility = android.view.View.VISIBLE
    }

    private fun updateUIForTeacher() {
        // Hide attendance-related views
        studentView.visibility = android.view.View.GONE
        teacherView.visibility = android.view.View.VISIBLE
        timerTextView.visibility = android.view.View.GONE
        connectionStatusTextView.visibility = android.view.View.GONE
        wifiBssidTextView.visibility = android.view.View.GONE
        markAttendanceButton.visibility = android.view.View.GONE
        userNameTextView.visibility = android.view.View.VISIBLE
        
        // Show welcome message
        userNameTextView.text = "Hello Sir"
        
        loadMockAttendanceData() // For demonstration
    }

    private fun loadMockAttendanceData() {
        // Mock data for demonstration
        val mockStudents = listOf(
            StudentAttendance("John Doe", "CSE", "Room 101", 600, true),
            StudentAttendance("Jane Smith", "CSE", "Room 101", 540, true),
            StudentAttendance("Bob Johnson", "CSE", "Room 101", 0, false)
        )
        attendanceAdapter.updateStudents(mockStudents)

        // Start updating times
        handler.postDelayed(object : Runnable {
            override fun run() {
                updateAttendanceTimes()
                handler.postDelayed(this, 1000)
            }
        }, 1000)
    }

    private fun updateAttendanceTimes() {
        // Update time for each student
        attendanceAdapter.notifyDataSetChanged()
    }

    private fun requestLocationPermission() {
        ActivityCompat.requestPermissions(
            this,
            locationPermissions,
            PERMISSION_REQUEST_CODE
        )
    }

    private fun checkPermissions() {
        if (!hasLocationPermission()) {
            requestLocationPermission()
        } else {
            updateWifiInfo()
        }
    }

    private fun updateWifiInfo() {
        if (!hasLocationPermission()) {
            Toast.makeText(this, "Location permission required!", Toast.LENGTH_SHORT).show()
            return
        }

        val wifiInfo = wifiManager.connectionInfo
        val currentBSSID = wifiInfo?.bssid ?: ""
        val wasAuthorized = isConnectedToAuthorizedWifi

        isConnectedToAuthorizedWifi = currentBSSID == TARGET_BSSID
        wifiBssidTextView.text = "BSSID: $currentBSSID"

        connectionStatusTextView.text = if (isConnectedToAuthorizedWifi) {
            "Connected to authorized network"
        } else {
            "Not connected to authorized network"
        }

        connectionStatusTextView.setTextColor(
            ContextCompat.getColor(
                this,
                if (isConnectedToAuthorizedWifi) android.R.color.holo_green_dark else android.R.color.holo_red_dark
            )
        )

        // Handle timer based on connection state
        if (!wasAuthorized && isConnectedToAuthorizedWifi && wasRunning) {
            // Resume timer if we were running before
            startTimer()
        } else if (wasAuthorized && !isConnectedToAuthorizedWifi && isRunning) {
            // Pause timer if we lose connection
            stopTimer()
        }

        updateMarkAttendanceButtonState()
    }

    private fun updateMarkAttendanceButtonState() {
        markAttendanceButton.isEnabled = isConnectedToAuthorizedWifi && userName.isNotEmpty()
        markAttendanceButton.text = if (isRunning) "Stop" else "Start"
    }

    private fun showNameInputDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_name_input, null)
        val nameInput = dialogView.findViewById<EditText>(R.id.nameInput)

        AlertDialog.Builder(this)
            .setTitle("Enter Your Name")
            .setView(dialogView)
            .setPositiveButton("OK") { _, _ ->
                val enteredName = nameInput.text.toString().trim()
                if (enteredName.isNotEmpty()) {
                    userName = enteredName
                    userNameTextView.text = "User: $userName"
                    updateMarkAttendanceButtonState()
                } else {
                    Toast.makeText(this, "Please enter a valid name", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .setCancelable(false)
            .show()
    }

    private fun initTimer() {
        runnable = Runnable {
            if (isRunning && isConnectedToAuthorizedWifi) {
                if (seconds > 0) {
                    seconds--
                    updateTimerDisplay()
                    handler.postDelayed(runnable, TIMER_INTERVAL)
                } else {
                    stopTimer()
                    Toast.makeText(this, "Attendance completed!", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun startTimer() {
        if (!isRunning) {
            if (seconds <= 0) seconds = 600 // Reset to 10 minutes if needed
            isRunning = true
            handler.post(runnable)
            updateMarkAttendanceButtonState()
            Toast.makeText(this, "Attendance started!", Toast.LENGTH_SHORT).show()
        }
    }

    private fun stopTimer() {
        wasRunning = isRunning // Store the running state
        isRunning = false
        handler.removeCallbacks(runnable)
        updateMarkAttendanceButtonState()
        if (seconds <= 0) {
            Toast.makeText(this, "Attendance completed!", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "Attendance paused!", Toast.LENGTH_SHORT).show()
        }
    }

    private fun updateTimerDisplay() {
        val minutes = seconds / 60
        val secs = seconds % 60
        timerTextView.text = String.format("%02d:%02d", minutes, secs)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                updateWifiInfo()
            } else {
                Toast.makeText(this, "Location permission is required for Wi-Fi scanning", Toast.LENGTH_LONG).show()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        updateWifiInfo()
        if (isConnectedToAuthorizedWifi && !isRunning && userName.isNotEmpty()) {
            startTimer()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(runnable)
    }
}
