package com.example.letsbunk

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.util.Base64
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.security.MessageDigest

class LoginActivity : AppCompatActivity() {

    private lateinit var userIdEditText: EditText
    private lateinit var passwordEditText: EditText
    private lateinit var loginButton: Button
    // private lateinit var registerButton: Button // Removed
    private lateinit var progressBar: ProgressBar
    private lateinit var errorTextView: TextView
    private lateinit var sharedPreferences: SharedPreferences

    companion object {
        const val PREF_NAME = "LetsBunkAuth"
        const val KEY_TOKEN = "auth_token"
        const val KEY_USER_ID = "user_id"
        const val KEY_USER_NAME = "user_name"
        const val KEY_USER_ROLE = "user_role"
        const val KEY_USER_BRANCH = "user_branch"
        const val KEY_USER_SEMESTER = "user_semester"
        const val KEY_USER_DEPARTMENT = "user_department"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        sharedPreferences = getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

        initializeViews()
        setupClickListeners()

        // Check if already logged in
        checkExistingLogin()
    }

    private fun initializeViews() {
        userIdEditText = findViewById(R.id.userIdEditText)
        passwordEditText = findViewById(R.id.passwordEditText)
        loginButton = findViewById(R.id.loginButton)
        // registerButton = findViewById(R.id.registerButton) // Removed
        progressBar = findViewById(R.id.progressBar)
        errorTextView = findViewById(R.id.errorTextView)
    }

    private fun setupClickListeners() {
        loginButton.setOnClickListener {
            val userId = userIdEditText.text.toString().trim()
            val password = passwordEditText.text.toString().trim()

            if (validateInput(userId, password)) {
                performLogin(userId, password)
            }
        }

        // registerButton.setOnClickListener { } // Removed
    }

    private fun validateInput(userId: String, password: String): Boolean {
        if (userId.isEmpty()) {
            showError("Please enter User ID or Email")
            return false
        }

        if (password.isEmpty()) {
            showError("Please enter Password")
            return false
        }

        if (password.length < 6) {
            showError("Password must be at least 6 characters")
            return false
        }

        return true
    }

    private fun performLogin(userId: String, password: String) {
        showLoading(true)
        hideError()

        // Get or create device ID
        val deviceId = getOrCreateDeviceId()
        val request = LoginRequest(userId, password, deviceId)

        NetworkManager.apiService.login(request).enqueue(object : Callback<LoginResponse> {
            override fun onResponse(call: Call<LoginResponse>, response: Response<LoginResponse>) {
                showLoading(false)

                if (response.isSuccessful) {
                    val loginResponse = response.body()
                    if (loginResponse?.success == true && loginResponse.token != null && loginResponse.user != null) {
                        saveUserData(loginResponse.token, loginResponse.user)
                        navigateToMainActivity(loginResponse.user)
                    } else {
                        showError(loginResponse?.message ?: "Login failed")
                    }
                } else {
                    try {
                        val errorBody = response.errorBody()?.string()
                        val errorMessage = if (errorBody != null) {
                            org.json.JSONObject(errorBody).optString("message", "Login failed")
                        } else {
                            "Login failed"
                        }
                        showError(errorMessage)
                    } catch (e: Exception) {
                        showError("Login failed. Please try again.")
                    }
                }
            }

            override fun onFailure(call: Call<LoginResponse>, t: Throwable) {
                showLoading(false)
                showError("Connection error: ${t.message}")
            }
        })
    }

    private fun checkExistingLogin() {
        val token = sharedPreferences.getString(KEY_TOKEN, null)

        if (token != null) {
            // Verify token with server
            showLoading(true)

            NetworkManager.apiService.verifyToken(VerifyTokenRequest(token))
                .enqueue(object : Callback<VerifyTokenResponse> {
                    override fun onResponse(call: Call<VerifyTokenResponse>, response: Response<VerifyTokenResponse>) {
                        showLoading(false)

                        if (response.isSuccessful && response.body()?.success == true) {
                            val user = response.body()?.user
                            if (user != null) {
                                navigateToMainActivity(user)
                            } else {
                                clearUserData()
                            }
                        } else {
                            clearUserData()
                        }
                    }

                    override fun onFailure(call: Call<VerifyTokenResponse>, t: Throwable) {
                        showLoading(false)
                        // Continue to login screen
                    }
                })
        }
    }

    private fun saveUserData(token: String, user: UserProfile) {
        sharedPreferences.edit().apply {
            putString(KEY_TOKEN, token)
            putString(KEY_USER_ID, user.userId)
            putString(KEY_USER_NAME, user.name)
            putString(KEY_USER_ROLE, user.role)
            putString(KEY_USER_BRANCH, user.branch)
            putString(KEY_USER_SEMESTER, user.semester)
            putString(KEY_USER_DEPARTMENT, user.department)
            apply()
        }
    }

    private fun clearUserData() {
        sharedPreferences.edit().clear().apply()
    }

    private fun navigateToMainActivity(user: UserProfile) {
        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra("USER_ID", user.userId)
            putExtra("USER_NAME", user.name)
            putExtra("USER_ROLE", user.role)
            putExtra("USER_BRANCH", user.branch)
            putExtra("USER_SEMESTER", user.semester)
            putExtra("USER_DEPARTMENT", user.department)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }

    private fun showLoading(show: Boolean) {
        progressBar.visibility = if (show) View.VISIBLE else View.GONE
        loginButton.isEnabled = !show
        // registerButton.isEnabled = !show // Removed
        userIdEditText.isEnabled = !show
        passwordEditText.isEnabled = !show
    }

    private fun showError(message: String) {
        errorTextView.text = message
        errorTextView.visibility = View.VISIBLE
    }

    private fun hideError() {
        errorTextView.visibility = View.GONE
    }
    
    private fun getOrCreateDeviceId(): String {
        // Try to get existing device ID
        var id = sharedPreferences.getString("DEVICE_ID", null)
        
        if (id == null) {
            // Generate a unique device ID using Android ID and timestamp
            val androidId = android.provider.Settings.Secure.getString(
                contentResolver,
                android.provider.Settings.Secure.ANDROID_ID
            )
            val timestamp = System.currentTimeMillis()
            val combined = "$androidId-$timestamp"
            
            // Create a hash for the device ID
            val digest = MessageDigest.getInstance("SHA-256")
            val hash = digest.digest(combined.toByteArray())
            id = Base64.encodeToString(hash, Base64.NO_WRAP).take(32)
            
            // Save it
            sharedPreferences.edit().putString("DEVICE_ID", id).apply()
        }
        
        return id
    }
}
