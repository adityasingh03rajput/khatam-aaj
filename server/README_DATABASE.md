# Database Setup and Management Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure MongoDB Connection
Edit `server/config/database.js` and set your MongoDB connection string:
```javascript
const MONGODB_URI = 'mongodb://localhost:27017/letsbunk';
```

### 3. Initialize Database
```bash
npm run db:init
```
This will:
- Create all necessary indexes
- Seed initial sample data (BSSID config, classrooms, teachers, students, timetable)

### 4. Start Server
```bash
npm start
```

---

## Database Management Commands

### Initialize Database
Creates indexes and seeds sample data:
```bash
npm run db:init
```

### Clear Database
**⚠️ WARNING: Deletes all data!**
```bash
npm run db:clear
```

### Backup Database
Creates timestamped JSON backup:
```bash
npm run db:backup
```
Backups are stored in `server/backups/backup_YYYY-MM-DDTHH-MM-SS/`

---

## Database Structure

### Collections Overview

1. **Student** - Active attendance sessions (real-time)
2. **StudentRecord** - Permanent student profiles
3. **TeacherRecord** - Teacher information and subjects
4. **Timetable** - Individual lecture slots
5. **TimetableTable** - Tabular timetable format
6. **AttendanceRecord** - Historical attendance records
7. **BSSIDConfig** - Authorized WiFi networks
8. **Classroom** - Room information and WiFi mapping

See `DATABASE_SCHEMA.md` for detailed schema documentation.

---

## Sample Data Included

After running `npm run db:init`, you'll have:

### BSSID Configuration
- Main Campus WiFi (ee:ee:6d:9d:6f:ba)

### Classrooms
- Room A101 (Lecture Hall, 60 capacity)
- Lab L201 (Laboratory, 40 capacity)

### Teachers
- Dr. Rajesh Kumar (CSE, Data Structures & Algorithms)
- Prof. Priya Sharma (CSE, Database & Web Technologies)

### Students
- 3 sample students in CSE 5th Semester

### Timetable
- 20 lecture slots across Monday-Friday
- 4 subjects with different teachers

---

## Database Indexes

All collections have optimized indexes for:
- Fast queries by department, branch, semester
- Efficient date-based searches
- Quick lookups by ID and status
- Compound indexes for multi-field queries

---

## Validation Rules

### Email Validation
- Must be valid email format
- Automatically converted to lowercase

### Phone Validation
- Must be exactly 10 digits
- No special characters

### BSSID Validation
- Must match MAC address format: XX:XX:XX:XX:XX:XX
- Accepts both colon (:) and hyphen (-) separators

### Time Validation
- Must be in HH:MM format (24-hour)
- Hours: 00-23, Minutes: 00-59

---

## Connection Status

Check MongoDB connection in server logs:
```
✓ MongoDB Connected: letsbunk
```

If connection fails:
1. Ensure MongoDB is running
2. Check connection string in `config/database.js`
3. Verify network connectivity
4. Check MongoDB credentials

---

## Backup and Restore

### Manual Backup
```bash
npm run db:backup
```

### Restore from Backup
```bash
# 1. Clear current database
npm run db:clear

# 2. Import backup (use mongoimport or custom script)
mongoimport --db letsbunk --collection students --file backups/backup_TIMESTAMP/students.json --jsonArray
```

### Automated Backups
Set up cron job for daily backups:
```bash
# Add to crontab
0 2 * * * cd /path/to/server && npm run db:backup
```

---

## Performance Tips

1. **Use Indexes**: All queries use indexed fields
2. **Limit Results**: Use `.limit()` for large datasets
3. **Lean Queries**: Use `.lean()` for read-only operations
4. **Projection**: Select only needed fields
5. **Aggregation**: Use aggregation pipeline for complex queries

---

## Troubleshooting

### "MongoDB not connected" errors
- Start MongoDB service: `sudo systemctl start mongod`
- Check if MongoDB is running: `sudo systemctl status mongod`

### Slow queries
- Check indexes: `db.collection.getIndexes()`
- Use explain: `db.collection.find().explain()`

### Duplicate key errors
- Clear database and reinitialize: `npm run db:clear && npm run db:init`

### Connection timeout
- Increase timeout in `config/database.js`
- Check network/firewall settings

---

## Production Deployment

### MongoDB Atlas (Cloud)
1. Create cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get connection string
3. Update `config/database.js`:
```javascript
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://user:pass@cluster.mongodb.net/letsbunk';
```
4. Set environment variable:
```bash
export MONGODB_URI="your_atlas_connection_string"
```

### Security Best Practices
1. Use environment variables for credentials
2. Enable authentication on MongoDB
3. Use SSL/TLS for connections
4. Restrict network access with firewall
5. Regular backups
6. Monitor database performance

---

## API Endpoints Using Database

### Timetable
- `GET /api/timetable` - Get all timetable slots
- `POST /api/timetable` - Create new slot
- `PUT /api/timetable/:id` - Update slot
- `DELETE /api/timetable/:id` - Delete slot

### Tabular Timetable
- `GET /api/timetable-table/:branch/:semester` - Get tabular timetable
- `POST /api/timetable-table` - Save tabular timetable
- `DELETE /api/timetable-table/:branch/:semester` - Delete timetable

### Attendance
- `POST /api/attendance/start` - Start attendance session
- `GET /api/attendance/list` - Get active students
- `GET /api/attendance/history` - Get historical records
- `GET /api/attendance/statistics` - Get statistics

### Students & Teachers
- `GET /api/students` - Get student records
- `GET /api/students/:id` - Get specific student

---

## Monitoring

### Check Database Size
```javascript
db.stats()
```

### Check Collection Counts
```javascript
db.students.countDocuments()
db.attendanceRecords.countDocuments()
```

### Monitor Active Connections
```javascript
db.serverStatus().connections
```

---

## Support

For issues or questions:
1. Check `DATABASE_SCHEMA.md` for schema details
2. Review server logs for error messages
3. Verify MongoDB is running and accessible
4. Check network connectivity

---

## Version History

- **v1.0** - Initial database schema
  - 8 collections with full indexing
  - Sample data seeding
  - Backup/restore scripts
