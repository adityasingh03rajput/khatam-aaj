package com.example.letsbunk

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.cardview.widget.CardView
import androidx.recyclerview.widget.RecyclerView

data class StudentAttendanceWithRing(
    val student: StudentAttendance,
    var isRandomRingSelected: Boolean = false,
    var ringStatus: String = "pending" // pending, accepted, rejected, student_confirmed
)

class AttendanceAdapter(
    private val onAccept: (String) -> Unit = {},
    private val onReject: (String) -> Unit = {},
    private val onResume: (String) -> Unit = {}
) : RecyclerView.Adapter<AttendanceAdapter.ViewHolder>() {
    private val students = mutableListOf<StudentAttendanceWithRing>()
    private val randomRingStudentNames = mutableSetOf<String>()

    fun updateStudents(newStudents: List<StudentAttendance>) {
        students.clear()
        students.addAll(newStudents.map { StudentAttendanceWithRing(it) })
        notifyDataSetChanged()
    }

    fun markRandomRingStudents(studentNames: List<String>) {
        randomRingStudentNames.clear()
        randomRingStudentNames.addAll(studentNames)
        students.forEach { 
            it.isRandomRingSelected = studentNames.contains(it.student.name)
            if (it.isRandomRingSelected) {
                it.ringStatus = "pending"
            }
        }
        notifyDataSetChanged()
    }

    fun updateRandomRingStatus(studentName: String, status: String) {
        students.find { it.student.name == studentName }?.let {
            it.ringStatus = status
            notifyDataSetChanged()
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_attendance_enhanced, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = students[position]
        val student = item.student
        
        // Add animation
        holder.itemView.alpha = 0f
        holder.itemView.animate()
            .alpha(1f)
            .setDuration(300)
            .setStartDelay((position * 50).toLong())
            .start()
        
        holder.nameTextView.text = student.name
        holder.departmentTextView.text = student.department
        holder.locationTextView.text = student.location
        val minutes = student.timeRemaining / 60
        val seconds = student.timeRemaining % 60
        holder.timeRemainingTextView.text = String.format("%02d:%02d", minutes, seconds)
        
        // Display status based on attendanceStatus
        val statusText = when (student.attendanceStatus) {
            "attending" -> "✓ Attending"
            "absent" -> "⏸️ Absent (Paused)"
            "attended" -> "✅ Attended"
            else -> if (student.isPresent) "✓ Present" else "✗ Absent"
        }
        val statusColor = when (student.attendanceStatus) {
            "attending" -> "#4CAF50" // Green
            "absent" -> "#FF9800" // Orange
            "attended" -> "#2196F3" // Blue
            else -> if (student.isPresent) "#4CAF50" else "#F44336"
        }
        
        holder.statusTextView.text = statusText
        holder.statusTextView.setTextColor(android.graphics.Color.parseColor(statusColor))

        // Handle Random Ring UI
        if (item.isRandomRingSelected) {
            holder.randomRingBadge.visibility = View.VISIBLE
            
            when (item.ringStatus) {
                "pending" -> {
                    holder.actionButtonsLayout.visibility = View.VISIBLE
                    holder.statusMessageTextView.visibility = View.GONE
                    holder.cardView.setCardBackgroundColor(android.graphics.Color.parseColor("#FFF3E0"))
                    
                    holder.acceptButton.setOnClickListener {
                        onAccept(student.name)
                    }
                    holder.rejectButton.setOnClickListener {
                        onReject(student.name)
                    }
                }
                "accepted" -> {
                    holder.actionButtonsLayout.visibility = View.GONE
                    holder.statusMessageTextView.visibility = View.VISIBLE
                    holder.statusMessageTextView.text = "✓ Accepted by Teacher"
                    holder.statusMessageTextView.setTextColor(android.graphics.Color.parseColor("#4CAF50"))
                    holder.cardView.setCardBackgroundColor(android.graphics.Color.parseColor("#E8F5E9"))
                }
                "rejected" -> {
                    holder.actionButtonsLayout.visibility = View.GONE
                    holder.statusMessageTextView.visibility = View.VISIBLE
                    holder.statusMessageTextView.text = "✗ Rejected by Teacher"
                    holder.statusMessageTextView.setTextColor(android.graphics.Color.parseColor("#F44336"))
                    holder.cardView.setCardBackgroundColor(android.graphics.Color.parseColor("#FFEBEE"))
                    
                    // Show resume button for rejected students
                    holder.resumeButton.visibility = View.VISIBLE
                    holder.resumeButton.setOnClickListener {
                        onResume(student.name)
                    }
                }
                "student_confirmed" -> {
                    holder.actionButtonsLayout.visibility = View.GONE
                    holder.statusMessageTextView.visibility = View.VISIBLE
                    holder.statusMessageTextView.text = "🔒 Confirmed by Student (Locked)"
                    holder.statusMessageTextView.setTextColor(android.graphics.Color.parseColor("#2196F3"))
                    holder.cardView.setCardBackgroundColor(android.graphics.Color.parseColor("#E3F2FD"))
                }
            }
        } else {
            holder.randomRingBadge.visibility = View.GONE
            holder.actionButtonsLayout.visibility = View.GONE
            holder.statusMessageTextView.visibility = View.GONE
            holder.resumeButton.visibility = View.GONE
            holder.cardView.setCardBackgroundColor(android.graphics.Color.WHITE)
        }
    }

    override fun getItemCount(): Int = students.size

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val cardView: CardView = itemView.findViewById(R.id.cardView)
        val nameTextView: TextView = itemView.findViewById(R.id.nameTextView)
        val departmentTextView: TextView = itemView.findViewById(R.id.departmentTextView) 
        val locationTextView: TextView = itemView.findViewById(R.id.locationTextView)
        val timeRemainingTextView: TextView = itemView.findViewById(R.id.timeRemainingTextView)
        val statusTextView: TextView = itemView.findViewById(R.id.statusTextView)
        val randomRingBadge: TextView = itemView.findViewById(R.id.randomRingBadge)
        val actionButtonsLayout: LinearLayout = itemView.findViewById(R.id.actionButtonsLayout)
        val acceptButton: Button = itemView.findViewById(R.id.acceptButton)
        val rejectButton: Button = itemView.findViewById(R.id.rejectButton)
        val statusMessageTextView: TextView = itemView.findViewById(R.id.statusMessageTextView)
        val resumeButton: Button = itemView.findViewById(R.id.resumeButton)
    }
}