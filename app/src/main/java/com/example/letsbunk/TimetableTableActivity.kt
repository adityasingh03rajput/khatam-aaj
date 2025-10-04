package com.example.letsbunk

import android.app.TimePickerDialog
import android.content.Context
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.gson.Gson
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.util.*

/**
 * Tabular Timetable Activity
 * Displays timetable in a grid format with periods as rows and days as columns
 */
class TimetableTableActivity : AppCompatActivity() {

    private lateinit var branchSpinner: Spinner
    private lateinit var semesterSpinner: Spinner
    private lateinit var periodsRecyclerView: RecyclerView
    private lateinit var addPeriodButton: Button
    private lateinit var saveTimetableButton: Button
    
    private lateinit var adapter: TimetableTableAdapter
    private val periods = mutableListOf<Period>()
    private var currentBranch = "Computer Science"
    private var currentSemester = "1st Semester"
    private val gson = Gson()
    private lateinit var sharedPreferences: android.content.SharedPreferences
    
    private var isTeacher = true // Set based on user role
    private var isSaving = false // Flag to prevent reload during save
    private var isLoading = false // Flag to prevent multiple simultaneous loads

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.fragment_timetable_table)
        
        supportActionBar?.title = "Timetable Management"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        
        // Initialize SharedPreferences
        sharedPreferences = getSharedPreferences("LetsBunkPrefs", Context.MODE_PRIVATE)
        
        // Get user role from SharedPreferences
        isTeacher = !sharedPreferences.getBoolean("isStudent", false)
        
        initializeViews()
        setupSpinners()
        setupRecyclerView()
        setupButtons()
        setupWebSocketListeners()
        
        // Load saved timetable for current branch/semester
        loadTimetableFromServer()
    }

    private fun initializeViews() {
        branchSpinner = findViewById(R.id.tableBranchSpinner)
        semesterSpinner = findViewById(R.id.tableSemesterSpinner)
        periodsRecyclerView = findViewById(R.id.timetableRowsRecyclerView)
        addPeriodButton = findViewById(R.id.addPeriodButton)
        saveTimetableButton = findViewById(R.id.saveTimetableButton)
    }

    private fun setupSpinners() {
        // Branch spinner
        val branches = arrayOf("Computer Science", "Electronics", "Mechanical", "Civil", "IT")
        val branchAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, branches)
        branchAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        branchSpinner.adapter = branchAdapter
        
        branchSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val newBranch = branches[position]
                if (newBranch != currentBranch) {
                    currentBranch = newBranch
                    if (!isSaving) {
                        loadTimetableFromServer()
                    }
                }
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        // Semester spinner
        val semesters = arrayOf("1st Semester", "2nd Semester", "3rd Semester", "4th Semester", 
                                "5th Semester", "6th Semester", "7th Semester", "8th Semester")
        val semesterAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, semesters)
        semesterAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        semesterSpinner.adapter = semesterAdapter
        
        semesterSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val newSemester = semesters[position]
                if (newSemester != currentSemester) {
                    currentSemester = newSemester
                    if (!isSaving) {
                        loadTimetableFromServer()
                    }
                }
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }

    private fun setupRecyclerView() {
        // Initialize with at least one empty period to show the grid structure
        if (periods.isEmpty()) {
            periods.add(Period(
                periodNumber = 1,
                startTime = "08:00",
                endTime = "09:00"
            ))
        }
        
        adapter = TimetableTableAdapter(
            periods = periods,
            isReadOnly = !isTeacher,
            onPeriodChanged = { position, updatedPeriod ->
                Log.d("TimetableTable", "Period $position updated: ${updatedPeriod.periodNumber}")
                // Update the period in the list
                if (position < periods.size) {
                    periods[position] = updatedPeriod
                }
                // Auto-save on change (optional - can be disabled for manual save only)
                // saveTimetableToServer()
            },
            onDeletePeriod = { position ->
                showDeleteConfirmation(position)
            }
        )

        periodsRecyclerView.layoutManager = LinearLayoutManager(this)
        periodsRecyclerView.adapter = adapter

        Log.d("TimetableTable", "RecyclerView setup complete. Read-only: ${!isTeacher}")
    }

    private fun setupButtons() {
        addPeriodButton.setOnClickListener {
            showAddPeriodDialog()
        }
        
        saveTimetableButton.setOnClickListener {
            saveTimetableToServer()
        }
        
        // Hide buttons for students
        if (!isTeacher) {
            addPeriodButton.visibility = View.GONE
            saveTimetableButton.text = "Refresh"
            saveTimetableButton.setOnClickListener {
                // For students, refresh button reloads data
                loadTimetableFromServer()
            }
        }
    }

    private fun showAddPeriodDialog() {
        val dialogView = layoutInflater.inflate(android.R.layout.simple_list_item_1, null)
        
        // Quick time slot options
        val timeSlots = arrayOf(
            "08:00 - 09:00",
            "09:00 - 10:00",
            "10:00 - 11:00",
            "11:00 - 12:00",
            "12:00 - 13:00",
            "13:00 - 14:00",
            "14:00 - 15:00",
            "15:00 - 16:00",
            "16:00 - 17:00",
            "Custom Time"
        )
        
        AlertDialog.Builder(this)
            .setTitle("Select Time Slot")
            .setItems(timeSlots) { _, which ->
                if (which == timeSlots.size - 1) {
                    // Custom time
                    showCustomTimeDialog()
                } else {
                    // Quick add with predefined time
                    val times = timeSlots[which].split(" - ")
                    addPeriodWithTime(times[0], times[1])
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun showCustomTimeDialog() {
        val startTimeInput = EditText(this).apply {
            hint = "Start Time (HH:MM)"
            isFocusable = false
            setOnClickListener { showTimePicker { time -> setText(time) } }
        }
        val endTimeInput = EditText(this).apply {
            hint = "End Time (HH:MM)"
            isFocusable = false
            setOnClickListener { showTimePicker { time -> setText(time) } }
        }
        
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(50, 20, 50, 20)
            addView(startTimeInput)
            addView(endTimeInput)
        }
        
        AlertDialog.Builder(this)
            .setTitle("Custom Time Slot")
            .setView(container)
            .setPositiveButton("Add") { _, _ ->
                val startTime = startTimeInput.text.toString()
                val endTime = endTimeInput.text.toString()
                
                if (startTime.isNotEmpty() && endTime.isNotEmpty()) {
                    addPeriodWithTime(startTime, endTime)
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun addPeriodWithTime(startTime: String, endTime: String) {
        val newPeriod = Period(
            periodNumber = periods.size + 1,
            startTime = startTime,
            endTime = endTime
        )
        periods.add(newPeriod)
        adapter.notifyItemInserted(periods.size - 1)
        Toast.makeText(this, "Period ${newPeriod.periodNumber} added", Toast.LENGTH_SHORT).show()
        Log.d("TimetableTable", "Added period: ${newPeriod.periodNumber} (${startTime} - ${endTime})")
    }

    private fun showTimePicker(onTimeSelected: (String) -> Unit) {
        val calendar = Calendar.getInstance()
        TimePickerDialog(this, { _, hour, minute ->
            onTimeSelected(String.format("%02d:%02d", hour, minute))
        }, calendar.get(Calendar.HOUR_OF_DAY), calendar.get(Calendar.MINUTE), true).show()
    }

    private fun showDeleteConfirmation(position: Int) {
        // Don't allow deleting the last period - keep at least one row visible
        if (periods.size <= 1) {
            Toast.makeText(this, "Cannot delete the last period. At least one period must remain.", Toast.LENGTH_SHORT).show()
            return
        }
        
        AlertDialog.Builder(this)
            .setTitle("Delete Period")
            .setMessage("Are you sure you want to delete Period ${position + 1}?")
            .setPositiveButton("Delete") { _, _ ->
                adapter.removePeriod(position)
                // Renumber periods
                periods.forEachIndexed { index, period ->
                    periods[index] = period.copy(periodNumber = index + 1)
                }
                adapter.notifyDataSetChanged()
                Toast.makeText(this, "Period deleted", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun loadTimetableFromServer() {
        if (isLoading) {
            Log.d("TimetableTable", "Already loading, skipping duplicate request")
            return
        }
        
        isLoading = true
        Log.d("TimetableTable", "=== LOADING TIMETABLE ===")
        Log.d("TimetableTable", "Branch: $currentBranch")
        Log.d("TimetableTable", "Semester: $currentSemester")
        
        // Try to load from server first
        val apiService = NetworkManager.apiService
        apiService.getTimetableTable(currentBranch, currentSemester).enqueue(object : Callback<TimetableResponse> {
            override fun onResponse(call: Call<TimetableResponse>, response: Response<TimetableResponse>) {
                if (response.isSuccessful && response.body()?.success == true) {
                    val timetableData = response.body()?.timetable
                    if (timetableData != null && timetableData.periods.isNotEmpty()) {
                        periods.clear()
                        periods.addAll(timetableData.periods)
                        adapter.updatePeriods(timetableData.periods.toList())
                        
                        // Save to local storage as backup
                        saveTimetableLocally(timetableData.periods)
                        
                        Log.d("TimetableTable", "✓ Loaded ${periods.size} periods from server")
                        runOnUiThread {
                            Toast.makeText(
                                this@TimetableTableActivity,
                                "✓ Timetable loaded (${periods.size} periods)",
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                        isLoading = false
                        return
                    }
                }
                
                // Fallback to local storage if server fails
                loadTimetableFromLocal()
            }
            
            override fun onFailure(call: Call<TimetableResponse>, t: Throwable) {
                Log.e("TimetableTable", "Failed to load from server", t)
                // Fallback to local storage
                loadTimetableFromLocal()
            }
        })
    }
    
    private fun loadTimetableFromLocal() {
        Log.d("TimetableTable", "Loading from local storage (fallback)")
        
        val timetableKey = "timetable_${currentBranch}_${currentSemester}"
        val savedJson = sharedPreferences.getString(timetableKey, null)
        
        if (savedJson != null && savedJson.isNotEmpty()) {
            try {
                val periodsArray = gson.fromJson(savedJson, Array<Period>::class.java)
                val savedPeriods = periodsArray.toList()
                
                if (savedPeriods.isNotEmpty()) {
                    periods.clear()
                    periods.addAll(savedPeriods)
                    adapter.updatePeriods(savedPeriods.toList())
                    Log.d("TimetableTable", "✓ Loaded ${periods.size} periods from local storage")
                    Toast.makeText(
                        this@TimetableTableActivity,
                        "✓ Timetable loaded (${periods.size} periods) - Offline",
                        Toast.LENGTH_SHORT
                    ).show()
                } else {
                    showEmptyState()
                }
            } catch (e: Exception) {
                Log.e("TimetableTable", "Error parsing saved timetable", e)
                showEmptyState()
            }
        } else {
            showEmptyState()
        }
        isLoading = false
    }
    
    private fun saveTimetableLocally(periodsToSave: List<Period>) {
        val timetableKey = "timetable_${currentBranch}_${currentSemester}"
        val json = gson.toJson(periodsToSave)
        sharedPreferences.edit().putString(timetableKey, json).apply()
        Log.d("TimetableTable", "Saved timetable locally as backup")
    }
    
    private fun showEmptyState() {
        periods.clear()
        periods.add(Period(
            periodNumber = 1,
            startTime = "08:00",
            endTime = "09:00"
        ))
        adapter.updatePeriods(periods.toList())
        Log.d("TimetableTable", "Showing empty state with 1 default period")
        Toast.makeText(
            this@TimetableTableActivity,
            "No timetable found. Add periods to get started.",
            Toast.LENGTH_SHORT
        ).show()
    }


    private fun saveTimetableToServer() {
        if (periods.isEmpty()) {
            Toast.makeText(this, "⚠ No periods to save", Toast.LENGTH_SHORT).show()
            return
        }
        
        isSaving = true
        showLoadingIndicator(true)
        
        Log.d("TimetableTable", "=== SAVING TIMETABLE ===")
        Log.d("TimetableTable", "Branch: $currentBranch")
        Log.d("TimetableTable", "Semester: $currentSemester")
        Log.d("TimetableTable", "Periods count: ${periods.size}")
        
        // Save to local storage first (immediate backup)
        saveTimetableLocally(periods)
        
        // Then sync to server
        val timetableRequest = TimetableRequest(
            branch = currentBranch,
            semester = currentSemester,
            periods = periods
        )
        
        val apiService = NetworkManager.apiService
        apiService.saveTimetableTable(timetableRequest).enqueue(object : Callback<TimetableResponse> {
            override fun onResponse(call: Call<TimetableResponse>, response: Response<TimetableResponse>) {
                runOnUiThread {
                    if (response.isSuccessful && response.body()?.success == true) {
                        Toast.makeText(
                            this@TimetableTableActivity,
                            "✓ Timetable saved and synced! (${periods.size} periods)",
                            Toast.LENGTH_LONG
                        ).show()
                        Log.d("TimetableTable", "✓ Timetable saved to server successfully")
                    } else {
                        Toast.makeText(
                            this@TimetableTableActivity,
                            "✓ Timetable saved locally (${periods.size} periods) - Server sync failed",
                            Toast.LENGTH_LONG
                        ).show()
                        Log.w("TimetableTable", "Server save failed, but local save succeeded")
                    }
                    isSaving = false
                    showLoadingIndicator(false)
                }
            }
            
            override fun onFailure(call: Call<TimetableResponse>, t: Throwable) {
                Log.e("TimetableTable", "Failed to save to server", t)
                runOnUiThread {
                    Toast.makeText(
                        this@TimetableTableActivity,
                        "✓ Timetable saved locally (${periods.size} periods) - Offline mode",
                        Toast.LENGTH_LONG
                    ).show()
                    isSaving = false
                    showLoadingIndicator(false)
                }
            }
        })
    }





    private fun showLoadingIndicator(show: Boolean) {
        runOnUiThread {
            if (show) {
                saveTimetableButton.isEnabled = false
                saveTimetableButton.text = "Saving..."
            } else {
                saveTimetableButton.isEnabled = true
                saveTimetableButton.text = if (isTeacher) "Save Timetable" else "Refresh"
            }
        }
    }

    private fun setupWebSocketListeners() {
        // Timetable is now offline-only, no WebSocket listeners needed
        Log.d("TimetableTable", "Timetable running in offline mode")
    }

    override fun onResume() {
        super.onResume()
        // Reload timetable when returning to this activity
        if (::sharedPreferences.isInitialized && !isSaving) {
            Log.d("TimetableTable", "onResume: Reloading timetable")
            loadTimetableFromServer()
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}