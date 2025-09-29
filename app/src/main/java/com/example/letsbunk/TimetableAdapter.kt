package com.example.letsbunk

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

data class TimeSlot(
    var id: String,
    var day: String,
    var startTime: String,
    var endTime: String,
    var subject: String,
    var room: String,
    var branch: String,
    var semester: String
)

class TimetableAdapter(
    private var timeSlots: MutableList<TimeSlot>,
    private val onItemClick: (TimeSlot) -> Unit
) : RecyclerView.Adapter<TimetableAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val timeText: TextView = view.findViewById(android.R.id.text1)
        val subjectText: TextView = view.findViewById(android.R.id.text2)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(android.R.layout.simple_list_item_2, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val timeSlot = timeSlots[position]
        holder.timeText.text = "${timeSlot.day} (${timeSlot.startTime} - ${timeSlot.endTime})"
        holder.subjectText.text = "${timeSlot.subject} - Room ${timeSlot.room}"
        holder.itemView.setOnClickListener { onItemClick(timeSlot) }
    }

    override fun getItemCount() = timeSlots.size

    fun updateTimeSlots(newSlots: List<TimeSlot>) {
        timeSlots.clear()
        timeSlots.addAll(newSlots)
        notifyDataSetChanged()
    }

    fun addTimeSlot(timeSlot: TimeSlot) {
        timeSlots.add(timeSlot)
        notifyItemInserted(timeSlots.size - 1)
    }

    fun updateTimeSlot(updatedSlot: TimeSlot) {
        val position = timeSlots.indexOfFirst { it.id == updatedSlot.id }
        if (position != -1) {
            timeSlots[position] = updatedSlot
            notifyItemChanged(position)
        }
    }

    fun deleteTimeSlot(timeSlotId: String) {
        val position = timeSlots.indexOfFirst { it.id == timeSlotId }
        if (position != -1) {
            timeSlots.removeAt(position)
            notifyItemRemoved(position)
        }
    }
}