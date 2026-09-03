import React, { useState, useEffect } from 'react';

const STATUS_OPTIONS = [
  'Applied',
  'Resume Shortlisted',
  'OA Done',
  'Interview',
  'Waiting for Result',
  'Selected',
  'Rejected'
];

export default function ApplicationForm({ initialData, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    company: '',
    jobRole: '',
    status: 'Applied',
    appliedDate: new Date().toISOString().split('T')[0],
    jobUrl: '',
    notes: ''
  });

  const [formError, setFormError] = useState('');

  // Populate data when editing an existing application
  useEffect(() => {
    if (initialData) {
      setFormData({
        company: initialData.company || '',
        jobRole: initialData.jobRole || '',
        status: initialData.status || 'Applied',
        appliedDate: initialData.appliedDate
          ? new Date(initialData.appliedDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        jobUrl: initialData.jobUrl || '',
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company.trim()) {
      setFormError('Company name is required');
      return;
    }
    if (!formData.jobRole.trim()) {
      setFormError('Job role is required');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setFormError(err.message || 'Failed to save application');
    }
  };

  const isEditing = Boolean(initialData && initialData._id);

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? 'Edit Application' : 'Add New Application'}
          </h2>
          <button
            type="button"
            className="btn-close"
            onClick={onCancel}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {formError && <div className="alert alert-error">{formError}</div>}

        <form onSubmit={handleSubmit} className="app-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="company">Company Name <span className="req">*</span></label>
              <input
                id="company"
                name="company"
                type="text"
                className="input"
                placeholder="e.g. Google, Infosys, Amazon"
                value={formData.company}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="jobRole">Job Role <span className="req">*</span></label>
              <input
                id="jobRole"
                name="jobRole"
                type="text"
                className="input"
                placeholder="e.g. Frontend Developer, SDE-1"
                value={formData.jobRole}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Application Status</label>
              <select
                id="status"
                name="status"
                className="select"
                value={formData.status}
                onChange={handleChange}
                disabled={isLoading}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="appliedDate">Applied Date</label>
              <input
                id="appliedDate"
                name="appliedDate"
                type="date"
                className="input"
                value={formData.appliedDate}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="jobUrl">Job Posting URL (Optional)</label>
            <input
              id="jobUrl"
              name="jobUrl"
              type="url"
              className="input"
              placeholder="https://careers.company.com/job-id"
              value={formData.jobUrl}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes & Follow-up Details (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              className="textarea"
              rows="3"
              placeholder="e.g. Referral from John, OA completed on Aug 28, technical interview scheduled"
              value={formData.notes}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading
                ? 'Saving...'
                : isEditing
                ? 'Update Application'
                : 'Save Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
