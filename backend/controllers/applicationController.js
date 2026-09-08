const mongoose = require('mongoose');
const JobApplication = require('../models/JobApplication');
const { validStatuses } = require('../models/JobApplication');

// @desc    Create a new job application
// @route   POST /api/applications
// @access  Private (JWT Protected)
const createApplication = async (req, res, next) => {
  try {
    const { company, jobRole, status, appliedDate, jobUrl, notes } = req.body;

    if (typeof company !== 'string' || !company.trim() ||
        typeof jobRole !== 'string' || !jobRole.trim()) {
      return res.status(400).json({
        message: 'Company name and job role are required'
      });
    }

    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed values are: ${validStatuses.join(', ')}`
      });
    }

    if (appliedDate !== undefined && Number.isNaN(new Date(appliedDate).getTime())) {
      return res.status(400).json({ message: 'Invalid application date' });
    }

    if (jobUrl !== undefined && typeof jobUrl !== 'string') {
      return res.status(400).json({ message: 'Job URL must be a string' });
    }

    if (notes !== undefined && typeof notes !== 'string') {
      return res.status(400).json({ message: 'Notes must be a string' });
    }

    const application = await JobApplication.create({
      userId: req.user.userId,
      company: company.trim(),
      jobRole: jobRole.trim(),
      status: status || 'Applied',
      appliedDate: appliedDate ? new Date(appliedDate) : new Date(),
      jobUrl: jobUrl ? jobUrl.trim() : '',
      notes: notes ? notes.trim() : ''
    });

    return res.status(201).json(application);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all job applications for authenticated user with search and filtering
// @route   GET /api/applications
// @access  Private (JWT Protected)
const getApplications = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const query = { userId: req.user.userId };

    if (search && search.trim() !== '') {
      // Escape regex characters before using user input in a MongoDB regex query.
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.company = { $regex: escapedSearch, $options: 'i' };
    }

    if (status && status.trim() !== '' && status !== 'All') {
      const normalizedStatus = status.trim();
      if (!validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({
          message: `Invalid status. Allowed values are: ${validStatuses.join(', ')}`
        });
      }
      query.status = normalizedStatus;
    }

    const applications = await JobApplication.find(query).sort({
      appliedDate: -1,
      createdAt: -1
    });

    return res.status(200).json(applications);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single job application by ID
// @route   GET /api/applications/:id
// @access  Private (JWT Protected)
const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const application = await JobApplication.findOne({
      _id: id,
      userId: req.user.userId
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    return res.status(200).json(application);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a job application
// @route   PUT /api/applications/:id
// @access  Private (JWT Protected)
const updateApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const { company, jobRole, status, appliedDate, jobUrl, notes } = req.body;
    const updateFields = {};

    if (company !== undefined) {
      if (typeof company !== 'string' || !company.trim()) {
        return res.status(400).json({ message: 'Company name cannot be empty' });
      }
      updateFields.company = company.trim();
    }

    if (jobRole !== undefined) {
      if (typeof jobRole !== 'string' || !jobRole.trim()) {
        return res.status(400).json({ message: 'Job role cannot be empty' });
      }
      updateFields.jobRole = jobRole.trim();
    }

    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Allowed values are: ${validStatuses.join(', ')}`
        });
      }
      updateFields.status = status;
    }

    if (appliedDate !== undefined) {
      if (Number.isNaN(new Date(appliedDate).getTime())) {
        return res.status(400).json({ message: 'Invalid application date' });
      }
      updateFields.appliedDate = new Date(appliedDate);
    }

    if (jobUrl !== undefined) {
      if (typeof jobUrl !== 'string') {
        return res.status(400).json({ message: 'Job URL must be a string' });
      }
      updateFields.jobUrl = jobUrl.trim();
    }

    if (notes !== undefined) {
      if (typeof notes !== 'string') {
        return res.status(400).json({ message: 'Notes must be a string' });
      }
      updateFields.notes = notes.trim();
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No fields provided for update' });
    }

    const updatedApplication = await JobApplication.findOneAndUpdate(
      { _id: id, userId: req.user.userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedApplication) {
      return res.status(404).json({ message: 'Application not found' });
    }

    return res.status(200).json(updatedApplication);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a job application
// @route   DELETE /api/applications/:id
// @access  Private (JWT Protected)
const deleteApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const deletedApplication = await JobApplication.findOneAndDelete({
      _id: id,
      userId: req.user.userId
    });

    if (!deletedApplication) {
      return res.status(404).json({ message: 'Application not found' });
    }

    return res.status(200).json({ message: 'Application deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication
};
