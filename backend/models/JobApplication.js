const mongoose = require('mongoose');

const validStatuses = [
  'Applied',
  'Resume Shortlisted',
  'OA Done',
  'Interview',
  'Waiting for Result',
  'Selected',
  'Rejected'
];

const jobApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    jobRole: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: validStatuses,
        message: '{VALUE} is not a valid status'
      },
      default: 'Applied'
    },
    appliedDate: {
      type: Date,
      default: Date.now
    },
    jobUrl: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Index on userId for fast queries and ownership isolation
jobApplicationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
module.exports.validStatuses = validStatuses;
