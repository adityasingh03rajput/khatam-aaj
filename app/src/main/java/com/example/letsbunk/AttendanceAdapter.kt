package com.example.letsbunk

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class AttendanceAdapter : RecyclerView.Adapter<AttendanceAdapter.ViewHolder>() {
    private val students = mutableListOf<StudentAttendance>()

    fun updateStudents(newStudents: List<StudentAttendance>) {
        students.clear()
        students.addAll(newStudents)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_attendance, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val student = students[position]
        holder.nameTextView.text = student.name
        holder.departmentTextView.text = student.department
        holder.locationTextView.text = student.location
        val minutes = student.timeRemaining / 60
        val seconds = student.timeRemaining % 60
        holder.timeRemainingTextView.text = String.format("%02d:%02d", minutes, seconds)
        holder.statusTextView.text = if (student.isPresent) "Present" else "Absent"
    }

    override fun getItemCount(): Int = students.size

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val nameTextView: TextView = itemView.findViewById(R.id.nameTextView)
        val departmentTextView: TextView = itemView.findViewById(R.id.departmentTextView) 
        val locationTextView: TextView = itemView.findViewById(R.id.locationTextView)
        val timeRemainingTextView: TextView = itemView.findViewById(R.id.timeRemainingTextView)
        val statusTextView: TextView = itemView.findViewById(R.id.statusTextView)
    }
}