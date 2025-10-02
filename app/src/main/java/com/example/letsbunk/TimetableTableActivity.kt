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
    
    private var isTeacher = true // Set based on user role

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.fragment_timetable_table)
        
        supportActionBar?.title = "Timetable Management"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        
        // Get user role from SharedPreferences
        val sharedPreferences = getSharedPreferences("LetsBunkPrefs", Context.MODE_PRIVATE)
        isTeacher = !sharedPreferences.getBoolean("isStudent", false)
        
        initializeViews()
        setupSpinners()
        setupRecyclerView()
        setupButtons()
        setupWebSocketListeners()
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
                currentBranch = branches[position]
                loadTimetableFromServer()
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
                currentSemester = semesters[position]
                loadTimetableFromServer()
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }

    private fun setupRecyclerView() {
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
            .setTitle("Add New Period")
            .setView(container)
            .setPositiveButton("Add") { _, _ ->
                val startTime = startTimeInput.text.toString()
                val endTime = endTimeInput.text.toString()
                
                if (startTime.isNotEmpty() && endTime.isNotEmpty()) {
                    val newPeriod = Period(
                        periodNumber = periods.size + 1,
                        startTime = startTime,
                        endTime = endTime
                    )
                    periods.add(newPeriod)
                    adapter.addPeriod(newPeriod)
                    Toast.makeText(this, "Period added", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showTimePicker(onTimeSelected: (String) -> Unit) {
        val calendar = Calendar.getInstance()
        TimePickerDialog(this, { _, hour, minute ->
            onTimeSelected(String.format("%02d:%02d", hour, minute))
        }, calendar.get(Calendar.HOUR_OF_DAY), calendar.get(Calendar.MINUTE), true).show()
    }

    private fun showDeleteConfirmation(position: Int) {
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
        Log.d("TimetableTable", "Loading timetable for $currentBranch - $currentSemester")
        
        NetworkManager.apiService.getTabularTimetable(currentBranch, currentSemester)
            .enqueue(object : Callback<TimetableTableResponse> {
                override fun onResponse(
                    call: Call<TimetableTableResponse>,
                    response: Response<TimetableTableResponse>
                ) {
                    if (response.isSuccessful) {
                        response.body()?.let { timetableResponse ->
                            runOnUiThread {
                                if (timetableResponse.success && timetableResponse.timetable != null) {
                                    // Clear and update periods to avoid duplicates
                                    periods.clear()
                                    periods.addAll(timetableResponse.timetable.periods)
                                    adapter.updatePeriods(periods)
                                    Log.d("TimetableTable", "Periods updated: ${periods.size} items")
                                    Toast.makeText(
                                        this@TimetableTableActivity,
                                        "✓ Timetable loaded (${periods.size} periods)",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                    Log.d("TimetableTable", "Loaded ${periods.size} periods from server")
                                } else {
                                    // No timetable found, load sample data for teachers
                                    if (isTeacher && periods.isEmpty()) {
                                        loadSampleData()
                                        Toast.makeText(
                                            this@TimetableTableActivity,
                                            "No timetable found. Sample data loaded.",
                                            Toast.LENGTH_SHORT
                                        ).show()
                                    } else {
                                        Toast.makeText(
                                            this@TimetableTableActivity,
                                            "No timetable available for this branch/semester",
                                            Toast.LENGTH_SHORT
                                        ).show()
                                    }
                                }
                            }
                        }
                    } else {
                        runOnUiThread {
                            Log.e("TimetableTable", "Failed to load: ${response.code()}")
                            Toast.makeText(
                                this@TimetableTableActivity,
                                "⚠ Failed to load timetable (${response.code()})",
                                Toast.LENGTH_SHORT
                            ).show()
                            // Load sample data as fallback for teachers
                            if (isTeacher && periods.isEmpty()) {
                                loadSampleData()
                            }
                        }
                    }
                }

                override fun onFailure(call: Call<TimetableTableResponse>, t: Throwable) {
                    runOnUiThread {
                        Log.e("TimetableTable", "Network error loading timetable", t)
                        Toast.makeText(
                            this@TimetableTableActivity,
                            "✗ Network error: ${t.message}",
                            Toast.LENGTH_LONG
                        ).show()
                        // Load sample data as fallback for teachers
                        if (isTeacher && periods.isEmpty()) {
                            loadSampleData()
                        }
                    }
                }
            })
    }

    private fun loadSampleData() {
        periods.clear()
        periods.addAll(listOf(
            Period(
                periodNumber = 1,
                startTime = "08:00",
                endTime = "09:00",
                monday = PeriodEntry("Mathematics", "A101", "Dr. Smith"),
                tuesday = PeriodEntry("Physics", "B202", "Dr. Johnson"),
                wednesday = PeriodEntry("Chemistry", "C303", "Dr. Williams"),
                thursday = PeriodEntry("Mathematics", "A101", "Dr. Smith"),
                friday = PeriodEntry("Physics Lab", "Lab1", "Dr. Johnson"),
                saturday = PeriodEntry("Computer Science", "D404", "Dr. Davis")
            ),
            Period(
                periodNumber = 2,
                startTime = "09:00",
                endTime = "10:00",
                monday = PeriodEntry("English", "A102", "Prof. Brown"),
                tuesday = PeriodEntry("Mathematics", "A101", "Dr. Smith"),
                wednesday = PeriodEntry("Data Structures", "D405", "Dr. Wilson"),
                thursday = PeriodEntry("English", "A102", "Prof. Brown"),
                friday = PeriodEntry("Chemistry Lab", "Lab2", "Dr. Williams"),
                saturday = PeriodEntry("Project Work", "Lab3", "Dr. Davis")
            ),
            Period(
                periodNumber = 3,
                startTime = "10:00",
                endTime = "11:00",
                monday = PeriodEntry("Computer Science", "D404", "Dr. Davis"),
                tuesday = PeriodEntry("Chemistry", "C303", "Dr. Williams"),
                wednesday = PeriodEntry("Physics", "B202", "Dr. Johnson"),
                thursday = PeriodEntry("Computer Science", "D404", "Dr. Davis"),
                friday = PeriodEntry("Mathematics Tutorial", "A101", "Dr. Smith"),
                saturday = PeriodEntry("Seminar", "Auditorium", "Guest Faculty")
            ),
            Period(
                periodNumber = 4,
                startTime = "11:00",
                endTime = "12:00",
                monday = PeriodEntry("BREAK", "", "")
            ),
            Period(
                periodNumber = 5,
                startTime = "12:00",
                endTime = "13:00",
                monday = PeriodEntry("Digital Electronics", "E505", "Dr. Kumar"),
                tuesday = PeriodEntry("Algorithms", "D406", "Dr. Wilson"),
                wednesday = PeriodEntry("Computer Networks", "D407", "Dr. Patel"),
                thursday = PeriodEntry("Digital Electronics", "E505", "Dr. Kumar"),
                friday = PeriodEntry("Software Engineering", "D408", "Dr. Sharma"),
                saturday = PeriodEntry("Break", "", "")
            ),
            Period(
                periodNumber = 6,
                startTime = "13:00",
                endTime = "14:00",
                monday = PeriodEntry("LUNCH", "", "")
            ),
            Period(
                periodNumber = 7,
                startTime = "14:00",
                endTime = "15:00",
                monday = PeriodEntry("Database Systems", "D409", "Dr. Singh"),
                tuesday = PeriodEntry("Operating Systems", "D410", "Dr. Gupta"),
                wednesday = PeriodEntry("Machine Learning", "AI Lab", "Dr. Sharma"),
                thursday = PeriodEntry("Database Systems", "D409", "Dr. Singh"),
                friday = PeriodEntry("Web Development", "D411", "Dr. Patel"),
                saturday = PeriodEntry("Sports", "Ground", "PE Teacher")
            ),
            Period(
                periodNumber = 8,
                startTime = "15:00",
                endTime = "16:00",
                monday = PeriodEntry("Project Work", "Lab3", "Dr. Davis"),
                tuesday = PeriodEntry("Elective Course", "E506", "Dr. Kumar"),
                wednesday = PeriodEntry("Break", "", ""),
                thursday = PeriodEntry("Project Work", "Lab3", "Dr. Davis"),
                friday = PeriodEntry("Elective Course", "E506", "Dr. Kumar"),
                saturday = PeriodEntry("Library Time", "Library", "Librarian")
            )
        ))
        adapter.updatePeriods(periods)
        Log.d("TimetableTable", "Sample data loaded: ${periods.size} periods")
    }

    private fun saveTimetableToServer() {
        if (periods.isEmpty()) {
            Toast.makeText(this, "⚠ No periods to save", Toast.LENGTH_SHORT).show()
            return
        }
        
        val request = TimetableTableRequest(
            branch = currentBranch,
            semester = currentSemester,
            periods = periods
        )
        
        Log.d("TimetableTable", "Saving timetable: ${gson.toJson(request)}")
        
        NetworkManager.apiService.saveTabularTimetable(request)
            .enqueue(object : Callback<TimetableTableResponse> {
                override fun onResponse(
                    call: Call<TimetableTableResponse>,
                    response: Response<TimetableTableResponse>
                ) {
                    if (response.isSuccessful) {
                        response.body()?.let { timetableResponse ->
                            runOnUiThread {
                                if (timetableResponse.success) {
                                    Toast.makeText(
                                        this@TimetableTableActivity,
                                        "✓ Timetable saved successfully!",
                                        Toast.LENGTH_LONG
                                    ).show()
                                    Log.d("TimetableTable", "Timetable saved to server successfully")
                                } else {
                                    Toast.makeText(
                                        this@TimetableTableActivity,
                                        "⚠ Save failed: ${timetableResponse.message}",
                                        Toast.LENGTH_SHORT
                                    ).show()
                                }
                            }
                        }
                    } else {
                        runOnUiThread {
                            Log.e("TimetableTable", "Failed to save: ${response.code()}")
                            Toast.makeText(
                                this@TimetableTableActivity,
                                "✗ Failed to save timetable (${response.code()})",
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                    }
                }

                override fun onFailure(call: Call<TimetableTableResponse>, t: Throwable) {
                    runOnUiThread {
                        Log.e("TimetableTable", "Network error saving timetable", t)
                        Toast.makeText(
                            this@TimetableTableActivity,
                            "✗ Network error: ${t.message}",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            })
    }

    private fun setupWebSocketListeners() {
        // Listen for timetable updates from other users
        NetworkManager.onTimetableTableUpdated { data ->
            runOnUiThread {
                try {
                    val branch = data.getString("branch")
                    val semester = data.getString("semester")
                    
                    // Only reload if it matches current selection
                    if (branch == currentBranch && semester == currentSemester) {
                        Log.d("TimetableTable", "Received real-time update for $branch - $semester")
                        loadTimetableFromServer()
                        Toast.makeText(
                            this@TimetableTableActivity,
                            "✓ Timetable updated by another user",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                } catch (e: Exception) {
                    Log.e("TimetableTable", "Error parsing timetable update", e)
                }
            }
        }
        
        NetworkManager.onTimetableTableDeleted { data ->
            runOnUiThread {
                try {
                    val branch = data.getString("branch")
                    val semester = data.getString("semester")
                    
                    if (branch == currentBranch && semester == currentSemester) {
                        Log.d("TimetableTable", "Timetable deleted for $branch - $semester")
                        periods.clear()
                        adapter.updatePeriods(periods)
                        Toast.makeText(
                            this@TimetableTableActivity,
                            "Timetable deleted",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                } catch (e: Exception) {
                    Log.e("TimetableTable", "Error parsing timetable deletion", e)
                }
            }
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}