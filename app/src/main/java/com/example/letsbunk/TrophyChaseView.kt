package com.example.letsbunk

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import kotlin.math.cos
import kotlin.math.sin

class TrophyChaseView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    
    // Animation properties
    private var distance: Float = 100f // 0-100, 100 = far apart, 0 = caught
    private var studentX: Float = 0f
    private var trophyX: Float = 0f
    private var animationProgress: Float = 0f
    private var isCelebrating: Boolean = false
    
    // Colors
    private val trackColor = Color.parseColor("#E0E0E0")
    private val studentColor = Color.parseColor("#4CAF50")
    private val trophyColor = Color.parseColor("#FFD700")
    private val celebrationColor = Color.parseColor("#FF6B6B")
    
    private var animator: ValueAnimator? = null
    
    init {
        textPaint.textSize = 40f
        textPaint.textAlign = Paint.Align.CENTER
        textPaint.color = Color.BLACK
    }
    
    fun setDistance(newDistance: Float) {
        if (distance != newDistance) {
            distance = newDistance.coerceIn(0f, 100f)
            
            // Animate to new distance
            animator?.cancel()
            animator = ValueAnimator.ofFloat(animationProgress, distance).apply {
                duration = 500
                interpolator = AccelerateDecelerateInterpolator()
                addUpdateListener {
                    animationProgress = it.animatedValue as Float
                    invalidate()
                }
                start()
            }
        }
    }
    
    fun celebrate() {
        isCelebrating = true
        
        // Celebration animation
        ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 2000
            addUpdateListener {
                invalidate()
            }
            start()
        }
        
        // Reset celebration after animation
        postDelayed({
            isCelebrating = false
            invalidate()
        }, 2000)
    }
    
    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        
        val width = width.toFloat()
        val height = height.toFloat()
        val centerY = height / 2
        
        // Draw track
        paint.color = trackColor
        paint.strokeWidth = 8f
        paint.style = Paint.Style.STROKE
        canvas.drawLine(50f, centerY, width - 50f, centerY, paint)
        
        // Calculate positions based on distance
        val trackLength = width - 100f
        studentX = 50f + (trackLength * (100f - animationProgress) / 100f)
        trophyX = width - 50f
        
        if (isCelebrating) {
            drawCelebration(canvas, width, height)
        } else {
            drawStudent(canvas, studentX, centerY)
            drawTrophy(canvas, trophyX, centerY)
        }
        
        // Draw distance text
        val distanceText = "${(animationProgress).toInt()}% to go"
        textPaint.textSize = 36f
        textPaint.color = Color.DKGRAY
        canvas.drawText(distanceText, width / 2, centerY - 100f, textPaint)
    }
    
    private fun drawStudent(canvas: Canvas, x: Float, y: Float) {
        paint.style = Paint.Style.FILL
        paint.color = studentColor
        
        // Draw running student (simplified)
        // Body
        canvas.drawCircle(x, y - 30f, 20f, paint)
        
        // Head
        paint.color = Color.parseColor("#FFA726")
        canvas.drawCircle(x, y - 60f, 15f, paint)
        
        // Legs (animated running)
        paint.color = studentColor
        paint.strokeWidth = 6f
        paint.style = Paint.Style.STROKE
        
        val legOffset = (System.currentTimeMillis() % 500) / 500f * 20f
        canvas.drawLine(x, y - 10f, x - 10f + legOffset, y + 20f, paint)
        canvas.drawLine(x, y - 10f, x + 10f - legOffset, y + 20f, paint)
        
        // Arms
        canvas.drawLine(x, y - 40f, x - 15f, y - 20f, paint)
        canvas.drawLine(x, y - 40f, x + 15f, y - 20f, paint)
        
        // Keep animating
        postInvalidateDelayed(50)
    }
    
    private fun drawTrophy(canvas: Canvas, x: Float, y: Float) {
        paint.style = Paint.Style.FILL
        paint.color = trophyColor
        
        // Trophy cup
        val path = Path()
        path.moveTo(x - 20f, y - 40f)
        path.lineTo(x - 15f, y - 10f)
        path.lineTo(x + 15f, y - 10f)
        path.lineTo(x + 20f, y - 40f)
        path.close()
        canvas.drawPath(path, paint)
        
        // Trophy base
        canvas.drawRect(x - 25f, y - 10f, x + 25f, y, paint)
        canvas.drawRect(x - 15f, y, x + 15f, y + 10f, paint)
        
        // Trophy handles
        paint.style = Paint.Style.STROKE
        paint.strokeWidth = 4f
        canvas.drawArc(x - 30f, y - 35f, x - 15f, y - 20f, 90f, 180f, false, paint)
        canvas.drawArc(x + 15f, y - 35f, x + 30f, y - 20f, 270f, 180f, false, paint)
        
        // Shine effect
        paint.color = Color.WHITE
        paint.alpha = 150
        canvas.drawCircle(x - 5f, y - 30f, 5f, paint)
    }
    
    private fun drawCelebration(canvas: Canvas, width: Float, height: Float) {
        val centerX = width / 2
        val centerY = height / 2
        
        // Draw trophy in center
        drawTrophy(canvas, centerX, centerY)
        
        // Draw student celebrating
        paint.style = Paint.Style.FILL
        paint.color = studentColor
        canvas.drawCircle(centerX, centerY - 30f, 25f, paint)
        
        // Draw confetti
        paint.color = celebrationColor
        for (i in 0..20) {
            val angle = (i * 18f + System.currentTimeMillis() % 360) * Math.PI / 180
            val radius = 100f + (System.currentTimeMillis() % 1000) / 10f
            val confettiX = centerX + (cos(angle) * radius).toFloat()
            val confettiY = centerY + (sin(angle) * radius).toFloat()
            canvas.drawCircle(confettiX, confettiY, 5f, paint)
        }
        
        // Celebration text
        textPaint.textSize = 48f
        textPaint.color = celebrationColor
        canvas.drawText("🎉 Trophy Caught! 🎉", centerX, centerY + 100f, textPaint)
        
        postInvalidateDelayed(50)
    }
    
    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        animator?.cancel()
    }
}
