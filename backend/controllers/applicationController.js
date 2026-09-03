const mongoose = require('mongoose');
const JobApplication = require('../models/JobApplication');
const { validStatuses } = require('../models/JobApplication');

// @desc    Create a new job application
// @route   POST /api/applications
// @access  Private (JWT Protected)
const createApplication = async (req, res, next) => {
  try {
    const { company, jobRole, status, appliedDate, jobUrl, notes } = req.body;

    // Validate required fields
    if (!company || !jobRole) {
      return res.status(400).json({
        message: 'Company name and job role are required'
      });
    }

    // Validate status enum if supplied
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed values are: ${validStatuses.join(', ')}`
      });
    }

    // Always assign the authenticated user's ID from req.user.userId
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

    // Enforce ownership filter: only retrieve applications of the authenticated user
    const query = {
      userId: req.user.userId
    };

    // Filter by company name (search) using case-insensitive regex
    if (search && search.trim() !== '') {
      // Escape special regex characters to prevent regex injection
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.company = { $regex: escapedSearch, $options: 'i' };
    }

    // Filter by status if provided and not 'All'
    if (status && status.trim() !== '' && status !== 'All') {
      if (validStatuses.includes(status.trim())) {
        query.status = status.trim();
      }
    }

    // Fetch applications sorted by appliedDate descending, then createdAt descending
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

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        message: 'Application not found'
      });
    }

    // Enforce dual check: _id AND userId (ownership boundary)
    const application = await JobApplication.findOne({
      _id: id,
      userId: req.user.userId
    });

    if (!application) {
      return res.status(404).json({
        message: 'Application not found'
      });
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

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        message: 'Application not found'
      });
    }

    const { company, jobRole, status, appliedDate, jobUrl, notes } = req.body;

    // Build update object with only allowed fields (ignore any client-provided userId)
    const updateFields = {};

    if (company !== undefined) {
      if (!company.trim()) {
        return res.status(400).json({ message: 'Company name cannot be empty' });
      }
      updateFields.company = company.trim();
    }

    if (jobRole !== undefined) {
      if (!jobRole.trim()) {
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
      updateFields.appliedDate = appliedDate ? new Date(appliedDate) : new Date();
    }

    if (jobUrl !== undefined) {
      updateFields.jobUrl = jobUrl.trim();
    }

    if (notes !== undefined) {
      updateFields.notes = notes.trim();
    }

    // Update only if both _id matches AND userId matches authenticated user
    const updatedApplication = await JobApplication.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.userId
      },
      { $set: updateFields },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedApplication) {
      return res.status(404).json({
        message: 'Application not found'
      });
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

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        message: 'Application not found'
      });
    }

    // Delete only if both _id and userId match
    const deletedApplication = await JobApplication.findOneAndDelete({
      _id: id,
      userId: req.user.userId
    });

    if (!deletedApplication) {
      return res.status(404).json({
        message: 'Application not found'
      });
    }

    return res.status(200).json({
      message: 'Application deleted successfully'
    });
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
