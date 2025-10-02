# 📚 Let's Bunk - Smart Attendance & Timetable Management System

<div align="center">

![Android](https://img.shields.io/badge/Platform-Android-green.svg)
![Kotlin](https://img.shields.io/badge/Language-Kotlin-blue.svg)
![Min SDK](https://img.shields.io/badge/Min%20SDK-21-orange.svg)
![Target SDK](https://img.shields.io/badge/Target%20SDK-33-orange.svg)
![License](https://img.shields.io/badge/License-Educational-red.svg)

**A comprehensive dual-mode Android application for educational institutions to manage attendance and timetables efficiently.**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Documentation](#-documentation) • [Building](#-building)

</div>

---

## 🎯 Overview

**Let's Bunk** is a modern Android application designed to streamline attendance tracking and timetable management in educational institutions. It features a dual-mode system that caters to both teachers and students, providing a seamless experience for managing classroom activities.

### Why Let's Bunk?

- ✅ **Wi-Fi Based Verification**: Secure attendance marking using Wi-Fi BSSID validation
- ✅ **Real-time Tracking**: Live attendance monitoring with countdown timers
- ✅ **Data Persistence**: All data automatically saved and restored
- ✅ **Dual Role System**: Separate interfaces for teachers and students
- ✅ **Easy to Use**: Intuitive UI with minimal learning curve
- ✅ **Offline First**: Works without internet connection

---

## ✨ Features

### 👨‍🏫 Teacher Mode

#### Timetable Management
- 📅 Create, edit, and delete class schedules
- 🕐 Time picker for easy time selection
- 🏫 Organize by branch and semester
- 📝 Track subject, room, and timing details
- 💾 Automatic data persistence

#### Attendance Monitoring
- 👥 Real-time student attendance list
- ⏱️ Live countdown for each student
- 📊 Status indicators (Present/Absent)
- 🏢 Department and room information
- 🔄 Automatic updates every second

#### Interface
- 📑 Tabbed navigation (Attendance/Timetable)
- 🎨 Clean, professional design
- 📱 Responsive layout
- 🔍 Filter by branch and semester

### 👨‍🎓 Student Mode

#### Attendance Marking
- 📡 Wi-Fi based verification
- 🔐 Authorized network validation
- ⏲️ 10-minute countdown timer
- ⏸️ Auto-pause on disconnect
- ▶️ Auto-resume on reconnect
- ✅ Completion notification

#### User Experience
- 👤 User profile with name storage
- 🎨 Color-coded connection status
- 📊 Large, readable timer display
- 🔔 Toast notifications for feedback
- 💾 Persistent user data

---

## 📱 Screenshots

### Teacher View
```
┌─────────────────────────────────┐
│  Attendance  │  Timetable       │
├─────────────────────────────────┤
│ Student    │ Class │ Room │ ... │
├─────────────────────────────────┤
│ John Doe   │ CSE   │ 101  │ ... │
│ Jane Smith │ CSE   │ 101  │ ... │
└─────────────────────────────────┘
```

### Student View
```
┌─────────────────────────────────┐
│        User: John Doe           │
│                                 │
│   BSSID: 78:90:a2:ea:ea:3c     │
│                                 │
│  ✓ Connected to authorized      │
│     network                     │
│                                 │
│      ┌──────────────┐          │
│      │    START     │          │
│      └──────────────┘          │
│                                 │
│         10:00                   │
└─────────────────────────────────┘
```

---

## 🚀 Installation

### Prerequisites
- Android device with Android 5.0 (API 21) or higher
- USB debugging enabled (for ADB installation)
- Location permissions granted

### Quick Install

#### Method 1: Using ADB (Recommended)
```bash
# Connect device via USB
adb devices

# Install APK
adb install -r "app\build\outputs\apk\debug\app-debug.apk"

# Launch app
adb shell am start -n com.example.letsbunk/.MainActivity
```

#### Method 2: Using Helper Script
```bash
# Run the installation script
install-apk.bat

# Select option 1 to install
```

#### Method 3: Manual Installation
1. Copy APK to device
2. Open APK file
3. Allow installation from unknown sources
4. Install

---

## 📖 Usage

### First Time Setup

#### As Teacher
1. Launch app
2. Select "Teacher" role
3. Grant location permissions
4. Access teacher dashboard

#### As Student
1. Launch app
2. Select "Student" role
3. Enter your name
4. Grant location permissions
5. Connect to authorized Wi-Fi

### Quick Actions

#### Teacher: Add Timetable Entry
```
1. Tap "Timetable" tab
2. Select branch and semester
3. Tap "Add Slot"
4. Fill details:
   - Day: Monday
   - Time: 09:00 - 10:00
   - Subject: Data Structures
   - Room: 101
5. Tap "Save"
```

#### Student: Mark Attendance
```
1. Connect to authorized Wi-Fi
2. Verify green status indicator
3. Tap "Start" button
4. Wait for 10 minutes
5. Attendance marked automatically
```

---

## 📚 Documentation

### Available Guides
- **[FEATURES.md](FEATURES.md)** - Comprehensive feature documentation
- **[QUICK_START.md](QUICK_START.md)** - Quick start guide with examples
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes

### Key Concepts

#### Wi-Fi Verification
The app uses Wi-Fi BSSID (MAC address) to verify that students are physically present in the classroom.

```kotlin
private val TARGET_BSSID = "78:90:a2:ea:ea:3c"
```

To use your own Wi-Fi:
1. Find your BSSID: `adb shell dumpsys wifi | findstr "BSSID"`
2. Update `TARGET_BSSID` in `MainActivity.kt`
3. Rebuild and install

#### Data Persistence
All data is stored using SharedPreferences with Gson serialization:
- Timetable slots
- Attendance records
- User preferences
- Timer state

#### Timer Mechanism
- 10-minute countdown (600 seconds)
- Updates every second using Handler
- Pauses on Wi-Fi disconnect
- Resumes on reconnect
- Saves state automatically

---

## 🛠️ Building from Source

### Prerequisites
- Android Studio Arctic Fox or later
- JDK 11 or higher
- Android SDK 33
- Gradle 8.x

### Build Steps

```bash
# Clone the repository
cd "d:\finally its time to create lets bunk in a night"

# Set Android SDK path
$env:ANDROID_HOME = "C:\Users\Victus\AppData\Local\Android\Sdk"

# Clean build
.\gradlew.bat clean

# Build debug APK
.\gradlew.bat assembleDebug

# Build release APK
.\gradlew.bat assembleRelease

# Install on device
.\gradlew.bat installDebug
```

### Output Locations
- **Debug APK**: `app\build\outputs\apk\debug\app-debug.apk`
- **Release APK**: `app\build\outputs\apk\release\app-release-unsigned.apk`

---

## 🏗️ Architecture

### Tech Stack
- **Language**: Kotlin
- **UI**: XML Layouts with Material Design
- **Architecture**: MVVM Pattern
- **Data**: SharedPreferences + Gson
- **Async**: Handler/Runnable
- **Lists**: RecyclerView with Adapters

### Project Structure
```
app/
├── src/main/
│   ├── java/com/example/letsbunk/
│   │   ├── MainActivity.kt           # Main activity
│   │   ├── TimetableAdapter.kt       # Timetable RecyclerView
│   │   ├── AttendanceAdapter.kt      # Attendance RecyclerView
│   │   ├── TimeSlot.kt              # Timetable data model
│   │   └── StudentAttendance.kt     # Attendance data model
│   ├── res/
│   │   ├── layout/
│   │   │   ├── activity_main.xml    # Main layout
│   │   │   ├── item_attendance.xml  # Attendance item
│   │   │   └── dialog_*.xml         # Dialog layouts
│   │   ├── values/
│   │   │   ├── strings.xml          # String resources
│   │   │   └── themes.xml           # App themes
│   │   └── xml/
│   │       ├── backup_rules.xml
│   │       └── data_extraction_rules.xml
│   └── AndroidManifest.xml          # App manifest
├── build.gradle                      # App build config
└── proguard-rules.pro               # ProGuard rules
```

### Key Components

#### MainActivity.kt
- Central activity managing both modes
- Handles role selection and UI switching
- Manages data persistence
- Coordinates timer and attendance

#### Adapters
- `TimetableAdapter`: Displays timetable entries
- `AttendanceAdapter`: Shows student attendance

#### Data Models
- `TimeSlot`: Timetable entry structure
- `StudentAttendance`: Attendance record
- `StudentData`: Student information
- `TimeTableEntry`: Legacy structure

---

## 🔧 Configuration

### Customization Options

#### Change Timer Duration
```kotlin
// In MainActivity.kt
private var seconds = 600 // Change to desired seconds
```

#### Add More Branches
```kotlin
// In setupSpinners()
val branches = arrayOf("CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "NEW_BRANCH")
```

#### Modify Wi-Fi BSSID
```kotlin
// In MainActivity.kt
private val TARGET_BSSID = "YOUR:WIFI:BSSID:HERE"
```

---

## 🧪 Testing

### Test Scenarios

#### Teacher Mode
- ✅ Add timetable entry
- ✅ Edit timetable entry
- ✅ Delete timetable entry
- ✅ Filter by branch/semester
- ✅ View attendance list
- ✅ Monitor real-time updates

#### Student Mode
- ✅ Mark attendance with Wi-Fi
- ✅ Timer countdown
- ✅ Auto-pause on disconnect
- ✅ Auto-resume on reconnect
- ✅ Completion notification

### Testing Commands
```bash
# View logs
adb logcat | findstr "letsbunk"

# Grant permissions
adb shell pm grant com.example.letsbunk android.permission.ACCESS_FINE_LOCATION

# Clear app data
adb shell pm clear com.example.letsbunk

# Force stop
adb shell am force-stop com.example.letsbunk
```

---

## 🐛 Troubleshooting

### Common Issues

**Q: Location permission denied**
```bash
# Solution: Grant manually
adb shell pm grant com.example.letsbunk android.permission.ACCESS_FINE_LOCATION
```

**Q: Can't mark attendance**
- Ensure connected to authorized Wi-Fi
- Check BSSID matches TARGET_BSSID
- Verify location permissions granted

**Q: Timer not counting**
- Keep app in foreground
- Check Wi-Fi connection
- Verify timer is started

**Q: Data not saving**
- Check storage permissions
- Verify SharedPreferences access
- Review logcat for errors

---

## 📊 Performance

### Metrics
- **APK Size**: ~5.8 MB (debug)
- **Min RAM**: 512 MB
- **Battery Impact**: Low (uses Handler, not Service)
- **Storage**: <10 MB for data
- **Network**: None (offline-first)

### Optimization
- Efficient RecyclerView usage
- Minimal background processing
- Proper lifecycle management
- Memory leak prevention

---

## 🔐 Security & Privacy

### Data Security
- All data stored locally
- No cloud synchronization
- No user tracking
- No analytics

### Permissions
- `ACCESS_WIFI_STATE`: Read Wi-Fi info
- `ACCESS_FINE_LOCATION`: Required for BSSID
- `ACCESS_COARSE_LOCATION`: Location services
- `CHANGE_WIFI_STATE`: Wi-Fi management

---

## 🚧 Known Limitations

- Single authorized Wi-Fi network
- No cloud backup
- No multi-device sync
- No attendance reports
- No export functionality
- No teacher authentication

---

## 🗺️ Roadmap

### Version 1.1 (Planned)
- [ ] Multiple Wi-Fi networks
- [ ] QR code attendance
- [ ] Attendance reports
- [ ] Export to CSV

### Version 2.0 (Future)
- [ ] Firebase integration
- [ ] Cloud synchronization
- [ ] Push notifications
- [ ] Analytics dashboard
- [ ] Dark mode
- [ ] Multi-language

---

## 🤝 Contributing

This is an educational project. Contributions, issues, and feature requests are welcome!

### Development Setup
1. Clone the repository
2. Open in Android Studio
3. Sync Gradle
4. Run on device/emulator

---

## 📄 License

This project is for educational purposes only.

---

## 👥 Authors

- **Development Team** - Initial work and enhancements

---

## 🙏 Acknowledgments

- Material Design Components
- AndroidX Libraries
- Gson by Google
- Android Developer Community
- Stack Overflow Community

---

## 📞 Support

### Resources
- [FEATURES.md](FEATURES.md) - Feature documentation
- [QUICK_START.md](QUICK_START.md) - Getting started guide
- [CHANGELOG.md](CHANGELOG.md) - Version history

### Contact
For issues or questions, please review the documentation or check logcat for error messages.

---

<div align="center">

**Made with ❤️ for Education**

⭐ Star this project if you find it useful!

[Back to Top](#-lets-bunk---smart-attendance--timetable-management-system)

</div>
