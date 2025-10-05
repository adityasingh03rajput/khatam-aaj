package com.example.letsbunk

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View
import java.text.SimpleDateFormat
import java.util.*

class AttendanceCalendarView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    private val monthFormat = SimpleDateFormat("MMMM yyyy", Locale.getDefault())
    
    private var calendarData: Map<String, CalendarDay> = emptyMap()
    private var currentMonth: Calendar = Calendar.getInstance()
    
    // Colors
    private val absentColor = Color.parseColor("#F44336")
    private val attendingColor = Color.parseColor("#4CAF50")
    private val presentLowColor = Color.parseColor("#81C784")
    private val presentHighColor = Color.parseColor("#2E7D32")
    private val holidayColor = Color.parseColor("#BDBDBD")
    private val futureColor = Color.parseColor("#E0E0E0")
    private val todayBorderColor = Color.parseColor("#2196F3")
    
    init {
        textPaint.textAlign = Paint.Align.CENTER
        textPaint.textSize = 32f
    }
    
    fun setCalendarData(data: Map<String, CalendarDay>) {
        calendarData = data
        invalidate()
    }
    
    fun setMonth(year: Int, month: Int) {
        currentMonth.set(Calendar.YEAR, year)
        currentMonth.set(Calendar.MONTH, month)
        invalidate()
    }
    
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        
        val width = width.toFloat()
        val height = height.toFloat()
        
        // Draw month header
        textPaint.textSize = 48f
        textPaint.color = Color.BLACK
        textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText(monthFormat.format(currentMonth.time), width / 2, 60f, textPaint)
        
        // Draw day headers (Mon, Tue, Wed, etc.)
        val dayHeaders = arrayOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
        val cellWidth = width / 7
        val headerY = 120f
        
        textPaint.textSize = 32f
        textPaint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
        textPaint.color = Color.DKGRAY
        
        for (i in dayHeaders.indices) {
            val x = cellWidth * i + cellWidth / 2
            canvas.drawText(dayHeaders[i], x, headerY, textPaint)
        }
        
        // Draw calendar grid
        val startY = 160f
        val cellHeight = (height - startY) / 6
        
        val cal = currentMonth.clone() as Calendar
        cal.set(Calendar.DAY_OF_MONTH, 1)
        
        // Adjust to Monday start
        var dayOfWeek = cal.get(Calendar.DAY_OF_WEEK)
        dayOfWeek = if (dayOfWeek == Calendar.SUNDAY) 7 else dayOfWeek - 1
        
        cal.add(Calendar.DAY_OF_MONTH, -(dayOfWeek - 1))
        
        val today = dateFormat.format(Date())
        
        for (week in 0..5) {
            for (day in 0..6) {
                val x = cellWidth * day
                val y = startY + cellHeight * week
                
                val dateStr = dateFormat.format(cal.time)
                val dayNum = cal.get(Calendar.DAY_OF_MONTH)
                val isCurrentMonth = cal.get(Calendar.MONTH) == currentMonth.get(Calendar.MONTH)
                
                // Draw cell background
                if (isCurrentMonth) {
                    val calDay = calendarData[dateStr]
                    if (calDay != null) {
                        paint.style = Paint.Style.FILL
                        paint.color = when (calDay.status) {
                            DayStatus.ABSENT -> absentColor
                            DayStatus.ATTENDING -> attendingColor
                            DayStatus.PRESENT_LOW -> presentLowColor
                            DayStatus.PRESENT_HIGH -> presentHighColor
                            DayStatus.HOLIDAY -> holidayColor
                            DayStatus.FUTURE -> futureColor
                        }
                        paint.alpha = 200
                        canvas.drawCircle(x + cellWidth / 2, y + cellHeight / 2, cellWidth / 3, paint)
                    }
                }
                
                // Draw today border
                if (dateStr == today) {
                    paint.style = Paint.Style.STROKE
                    paint.strokeWidth = 4f
                    paint.color = todayBorderColor
                    canvas.drawCircle(x + cellWidth / 2, y + cellHeight / 2, cellWidth / 3, paint)
                }
                
                // Draw day number
                textPaint.textSize = 36f
                textPaint.color = if (isCurrentMonth) Color.BLACK else Color.LTGRAY
                textPaint.typeface = if (dateStr == today) {
                    Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                } else {
                    Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
                }
                
                canvas.drawText(
                    dayNum.toString(),
                    x + cellWidth / 2,
                    y + cellHeight / 2 + 12f,
                    textPaint
                )
                
                // Draw attendance percentage
                if (isCurrentMonth) {
                    val calDay = calendarData[dateStr]
                    if (calDay != null && calDay.status != DayStatus.HOLIDAY && calDay.status != DayStatus.FUTURE) {
                        textPaint.textSize = 20f
                        textPaint.color = Color.WHITE
                        canvas.drawText(
                            "${calDay.attendancePercent}%",
                            x + cellWidth / 2,
                            y + cellHeight / 2 + 35f,
                            textPaint
                        )
                    }
                }
                
                cal.add(Calendar.DAY_OF_MONTH, 1)
            }
        }
    }
    
    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val width = MeasureSpec.getSize(widthMeasureSpec)
        val height = width * 6 / 7 + 200 // Maintain aspect ratio
        setMeasuredDimension(width, height)
    }
}
