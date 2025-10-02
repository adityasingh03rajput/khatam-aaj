const mongoose = require('mongoose');

const bssidConfigSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    bssid: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: function(v) {
                // Validate MAC address format (xx:xx:xx:xx:xx:xx)
                return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(v);
            },
            message: props => `${props.value} is not a valid BSSID/MAC address!`
        }
    },
    location: {
        type: String,
        trim: true
    },
    building: {
        type: String,
        trim: true
    },
    floor: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: false,
        index: true
    },
    description: {
        type: String,
        trim: true
    },
    lastUsed: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for active BSSIDs
bssidConfigSchema.index({ isActive: 1 });

module.exports = mongoose.model('BSSIDConfig', bssidConfigSchema);
