const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
    {
        credentialId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        studentName: {
            type: String,
            required: true,
            trim: true
        },

        registerNumber: {
            type: String,
            required: true,
            trim: true
        },

        programme: {
            type: String,
            required: true,
            trim: true
        },

        institution: {
            type: String,
            required: true,
            trim: true
        },

        issueDate: {
            type: String,
            required: true
        },

        certificateHash: {
            type: String,
            default: ""
        },

        blockchainTxHash: {
            type: String,
            default: ""
        },

        verified: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Certificate", certificateSchema);