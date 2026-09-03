import React from 'react';
import ApplicationCard from './ApplicationCard';

export default function ApplicationList({
  applications,
  isLoading,
  onEdit,
  onDelete,
  onAddNew,
  hasFilters
}) {
  if (isLoading) {
    return (
      <div className="state-container">
        <div className="spinner"></div>
        <p className="state-text">Loading your job applications...</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="state-container empty-state">
        <div className="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <h3 className="empty-title">
          {hasFilters ? 'No matching applications found' : 'No job applications yet'}
        </h3>
        <p className="empty-description">
          {hasFilters
            ? 'Try changing your search term or status filter to see more results.'
            : 'Track your career journey by adding your first job application.'}
        </p>
        {!hasFilters && (
          <button type="button" className="btn btn-primary" onClick={onAddNew}>
            Add First Application
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="applications-grid">
      {applications.map((application) => (
        <ApplicationCard
          key={application._id}
          application={application}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
