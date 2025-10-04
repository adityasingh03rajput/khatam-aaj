package com.example.letsbunk

import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ImageButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

/**
 * Enhanced Adapter for Tabular Timetable View
 * Optimized for performance with proper ViewHolder pattern
 */
class TimetableTableAdapter(
    private val periods: MutableList<Period>,
    private val isReadOnly: Boolean = false,
    private val onPeriodChanged: (Int, Period) -> Unit = { _, _ -> },
    private val onDeletePeriod: (Int) -> Unit = {}
) : RecyclerView.Adapter<TimetableTableAdapter.PeriodRowViewHolder>() {

    companion object {
        private const val TAG = "TimetableAdapter"
    }

    class PeriodRowViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val periodNumberText: TextView = view.findViewById(R.id.periodNumberText)
        val startTimeText: TextView = view.findViewById(R.id.startTimeText)
        val endTimeText: TextView = view.findViewById(R.id.endTimeText)
        val deleteButton: ImageButton = view.findViewById(R.id.deletePeriodButton)
        
        // Input fields for each day
        val mondaySubject: EditText = view.findViewById(R.id.mondaySubject)
        val mondayRoom: EditText = view.findViewById(R.id.mondayRoom)
        val mondayTeacher: EditText = view.findViewById(R.id.mondayTeacher)
        
        val tuesdaySubject: EditText = view.findViewById(R.id.tuesdaySubject)
        val tuesdayRoom: EditText = view.findViewById(R.id.tuesdayRoom)
        val tuesdayTeacher: EditText = view.findViewById(R.id.tuesdayTeacher)
        
        val wednesdaySubject: EditText = view.findViewById(R.id.wednesdaySubject)
        val wednesdayRoom: EditText = view.findViewById(R.id.wednesdayRoom)
        val wednesdayTeacher: EditText = view.findViewById(R.id.wednesdayTeacher)
        
        val thursdaySubject: EditText = view.findViewById(R.id.thursdaySubject)
        val thursdayRoom: EditText = view.findViewById(R.id.thursdayRoom)
        val thursdayTeacher: EditText = view.findViewById(R.id.thursdayTeacher)
        
        val fridaySubject: EditText = view.findViewById(R.id.fridaySubject)
        val fridayRoom: EditText = view.findViewById(R.id.fridayRoom)
        val fridayTeacher: EditText = view.findViewById(R.id.fridayTeacher)
        
        val saturdaySubject: EditText = view.findViewById(R.id.saturdaySubject)
        val saturdayRoom: EditText = view.findViewById(R.id.saturdayRoom)
        val saturdayTeacher: EditText = view.findViewById(R.id.saturdayTeacher)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PeriodRowViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_timetable_period, parent, false)
        return PeriodRowViewHolder(view)
    }

    override fun onBindViewHolder(holder: PeriodRowViewHolder, position: Int) {
        if (position >= periods.size) {
            Log.w(TAG, "Invalid position: $position, periods size: ${periods.size}")
            return
        }
        val period = periods[position]
        
        // Set period info
        holder.periodNumberText.text = "Period ${period.periodNumber}"
        holder.startTimeText.text = period.startTime
        holder.endTimeText.text = period.endTime
        
        // Setup delete button
        if (isReadOnly) {
            holder.deleteButton.visibility = View.GONE
        } else {
            holder.deleteButton.visibility = View.VISIBLE
            holder.deleteButton.setOnClickListener {
                onDeletePeriod(position)
            }
        }
        
        // Bind Monday
        bindDayEntry(holder.mondaySubject, holder.mondayRoom, holder.mondayTeacher, period.monday, isReadOnly) { subject, room, teacher ->
            val updatedPeriod = period.copy(monday = PeriodEntry(subject, room, teacher))
            periods[position] = updatedPeriod
            onPeriodChanged(position, updatedPeriod)
        }
        
        // Bind Tuesday
        bindDayEntry(holder.tuesdaySubject, holder.tuesdayRoom, holder.tuesdayTeacher, period.tuesday, isReadOnly) { subject, room, teacher ->
            val updatedPeriod = period.copy(tuesday = PeriodEntry(subject, room, teacher))
            periods[position] = updatedPeriod
            onPeriodChanged(position, updatedPeriod)
        }
        
        // Bind Wednesday
        bindDayEntry(holder.wednesdaySubject, holder.wednesdayRoom, holder.wednesdayTeacher, period.wednesday, isReadOnly) { subject, room, teacher ->
            val updatedPeriod = period.copy(wednesday = PeriodEntry(subject, room, teacher))
            periods[position] = updatedPeriod
            onPeriodChanged(position, updatedPeriod)
        }
        
        // Bind Thursday
        bindDayEntry(holder.thursdaySubject, holder.thursdayRoom, holder.thursdayTeacher, period.thursday, isReadOnly) { subject, room, teacher ->
            val updatedPeriod = period.copy(thursday = PeriodEntry(subject, room, teacher))
            periods[position] = updatedPeriod
            onPeriodChanged(position, updatedPeriod)
        }
        
        // Bind Friday
        bindDayEntry(holder.fridaySubject, holder.fridayRoom, holder.fridayTeacher, period.friday, isReadOnly) { subject, room, teacher ->
            val updatedPeriod = period.copy(friday = PeriodEntry(subject, room, teacher))
            periods[position] = updatedPeriod
            onPeriodChanged(position, updatedPeriod)
        }
        
        // Bind Saturday
        bindDayEntry(holder.saturdaySubject, holder.saturdayRoom, holder.saturdayTeacher, period.saturday, isReadOnly) { subject, room, teacher ->
            val updatedPeriod = period.copy(saturday = PeriodEntry(subject, room, teacher))
            periods[position] = updatedPeriod
            onPeriodChanged(position, updatedPeriod)
        }
    }

    private fun bindDayEntry(
        subjectEdit: EditText,
        roomEdit: EditText,
        teacherEdit: EditText,
        entry: PeriodEntry?,
        readOnly: Boolean,
        onChange: (String, String, String) -> Unit
    ) {
        // Remove any existing text watchers to prevent duplicates
        subjectEdit.tag?.let { 
            if (it is TextWatcher) subjectEdit.removeTextChangedListener(it)
        }
        roomEdit.tag?.let { 
            if (it is TextWatcher) roomEdit.removeTextChangedListener(it)
        }
        teacherEdit.tag?.let { 
            if (it is TextWatcher) teacherEdit.removeTextChangedListener(it)
        }
        
        // Set values
        subjectEdit.setText(entry?.subject ?: "")
        roomEdit.setText(entry?.room ?: "")
        teacherEdit.setText(entry?.teacher ?: "")
        
        // Set read-only state
        subjectEdit.isEnabled = !readOnly
        roomEdit.isEnabled = !readOnly
        teacherEdit.isEnabled = !readOnly
        
        if (!readOnly) {
            // Add text watchers for live updates
            val subjectWatcher = object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                override fun afterTextChanged(s: Editable?) {
                    onChange(s.toString(), roomEdit.text.toString(), teacherEdit.text.toString())
                }
            }
            subjectEdit.addTextChangedListener(subjectWatcher)
            subjectEdit.tag = subjectWatcher
            
            val roomWatcher = object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                override fun afterTextChanged(s: Editable?) {
                    onChange(subjectEdit.text.toString(), s.toString(), teacherEdit.text.toString())
                }
            }
            roomEdit.addTextChangedListener(roomWatcher)
            roomEdit.tag = roomWatcher
            
            val teacherWatcher = object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                override fun afterTextChanged(s: Editable?) {
                    onChange(subjectEdit.text.toString(), roomEdit.text.toString(), s.toString())
                }
            }
            teacherEdit.addTextChangedListener(teacherWatcher)
            teacherEdit.tag = teacherWatcher
        }
    }

    override fun getItemCount() = periods.size

    fun updatePeriods(newPeriods: List<Period>) {
        val oldSize = periods.size
        periods.clear()
        periods.addAll(newPeriods)
        
        // Use more efficient notifications
        if (oldSize == newPeriods.size) {
            notifyItemRangeChanged(0, newPeriods.size)
        } else {
            notifyDataSetChanged()
        }
        
        Log.d(TAG, "Updated ${periods.size} periods (was $oldSize)")
    }

    fun addPeriod(period: Period) {
        val position = periods.size
        periods.add(period)
        notifyItemInserted(position)
        Log.d(TAG, "Added period ${period.periodNumber} at position $position")
    }

    fun removePeriod(position: Int) {
        if (position in periods.indices) {
            val removedPeriod = periods.removeAt(position)
            notifyItemRemoved(position)
            notifyItemRangeChanged(position, periods.size)
            Log.d(TAG, "Removed period ${removedPeriod.periodNumber} from position $position")
        } else {
            Log.w(TAG, "Invalid remove position: $position")
        }
    }
}
