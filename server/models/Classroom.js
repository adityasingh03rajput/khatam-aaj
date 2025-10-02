const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    roomNumber: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    bssid: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(v);
            },
            message: props => `${props.value} is not a valid BSSID/MAC address!`
        }
    },
    building: {
        type: String,
        trim: true,
        index: true
    },
    floor: {
        type: String,
        trim: true
    },
    capacity: {
        type: Number,
        min: 1,
        max: 500
    },
    type: {
        type: String,
        enum: ['Lecture Hall', 'Laboratory', 'Tutorial Room', 'Seminar Hall', 'Conference Room', 'Other'],
        default: 'Lecture Hall'
    },
    facilities: [{
        type: String,
        trim: true
    }],
    department: {
        type: String,
        trim: true,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Compound indexes
classroomSchema.index({ building: 1, floor: 1 });
classroomSchema.index({ department: 1, isActive: 1 });

module.exports = mongoose.model('Classroom', classroomSchema);
