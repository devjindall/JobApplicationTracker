import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../components/Navbar';
import ApplicationList from '../components/ApplicationList';
import ApplicationForm from '../components/ApplicationForm';
import { applicationApi } from '../services/api';

const STATUS_FILTERS = [
  'All',
  'Applied',
  'Resume Shortlisted',
  'OA Done',
  'Interview',
  'Waiting for Result',
  'Selected',
  'Rejected'
];

export default function Dashboard({ user, onLogout }) {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  // Fetch applications from backend
  const fetchApplications = useCallback(async (search = '', status = 'All') => {
    setIsLoading(true);
    setError('');
    try {
      const data = await applicationApi.getAll({
        search,
        status
      });
      setApplications(data);
    } catch (err) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and filter/search change
  useEffect(() => {
    // Debounce search input slightly for smooth typing experience
    const timer = setTimeout(() => {
      fetchApplications(searchQuery, selectedStatus);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedStatus, fetchApplications]);

  // Compute Dashboard Metrics directly from the state (Client-side computation)
  const metrics = useMemo(() => {
    const total = applications.length;
    const inProgress = applications.filter((app) =>
      ['Applied', 'Resume Shortlisted', 'OA Done', 'Waiting for Result'].includes(app.status)
    ).length;
    const interviews = applications.filter((app) => app.status === 'Interview').length;
    const selected = applications.filter((app) => app.status === 'Selected').length;
    const rejected = applications.filter((app) => app.status === 'Rejected').length;

    return { total, inProgress, interviews, selected, rejected };
  }, [applications]);

  // Open modal for Adding New Application
  const handleOpenAddModal = () => {
    setEditingApplication(null);
    setIsFormOpen(true);
  };

  // Open modal for Editing an Application
  const handleOpenEditModal = (app) => {
    setEditingApplication(app);
    setIsFormOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsFormOpen(false);
    setEditingApplication(null);
  };

  // Handle Form Submission (Create or Update)
  const handleFormSubmit = async (formData) => {
    setIsFormSubmitting(true);
    try {
      if (editingApplication && editingApplication._id) {
        // Update existing application
        await applicationApi.update(editingApplication._id, formData);
      } else {
        // Create new application
        await applicationApi.create(formData);
      }
      handleCloseModal();
      // Immediately refresh application list
      await fetchApplications(searchQuery, selectedStatus);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  // Handle Application Deletion
  const handleDeleteApplication = async (id) => {
    try {
      await applicationApi.delete(id);
      // Immediately refresh application list
      await fetchApplications(searchQuery, selectedStatus);
    } catch (err) {
      alert(err.message || 'Failed to delete application');
    }
  };

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedStatus !== 'All');

  return (
    <div className="dashboard-container">
      <Navbar user={user} onLogout={onLogout} />

      <main className="dashboard-content">
        {/* Metric Overview Cards */}
        <section className="metrics-grid">
          <div className="metric-card metric-total">
            <span className="metric-label">Total Applied</span>
            <span className="metric-value">{metrics.total}</span>
          </div>
          <div className="metric-card metric-progress">
            <span className="metric-label">In Progress</span>
            <span className="metric-value">{metrics.inProgress}</span>
          </div>
          <div className="metric-card metric-interview">
            <span className="metric-label">Interviews</span>
            <span className="metric-value">{metrics.interviews}</span>
          </div>
          <div className="metric-card metric-selected">
            <span className="metric-label">Offers / Selected</span>
            <span className="metric-value">{metrics.selected}</span>
          </div>
          <div className="metric-card metric-rejected">
            <span className="metric-label">Rejected</span>
            <span className="metric-value">{metrics.rejected}</span>
          </div>
        </section>

        {/* Controls: Search, Filter, Add Application */}
        <section className="dashboard-controls">
          <div className="search-filter-group">
            {/* Search Input */}
            <div className="search-input-wrapper">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search applications by company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <div className="filter-wrapper">
              <label htmlFor="status-filter" className="filter-label">Status:</label>
              <select
                id="status-filter"
                className="filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {STATUS_FILTERS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Application Button */}
          <button
            type="button"
            className="btn btn-primary add-app-btn"
            onClick={handleOpenAddModal}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Application
          </button>
        </section>

        {/* Global Error Banner */}
        {error && (
          <div className="alert alert-error mb-4">
            {error}
            <button
              type="button"
              className="btn-retry"
              onClick={() => fetchApplications(searchQuery, selectedStatus)}
            >
              Retry
            </button>
          </div>
        )}

        {/* Application Cards List */}
        <ApplicationList
          applications={applications}
          isLoading={isLoading}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteApplication}
          onAddNew={handleOpenAddModal}
          hasFilters={hasActiveFilters}
        />
      </main>

      {/* Modal Form for Add/Edit */}
      {isFormOpen && (
        <ApplicationForm
          initialData={editingApplication}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModal}
          isLoading={isFormSubmitting}
        />
      )}
    </div>
  );
}
