import React from 'react';

// Status badge CSS helper
const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Applied':
      return 'badge-applied';
    case 'Resume Shortlisted':
      return 'badge-shortlisted';
    case 'OA Done':
      return 'badge-oa';
    case 'Interview':
      return 'badge-interview';
    case 'Waiting for Result':
      return 'badge-waiting';
    case 'Selected':
      return 'badge-selected';
    case 'Rejected':
      return 'badge-rejected';
    default:
      return 'badge-default';
  }
};

export default function ApplicationCard({ application, onEdit, onDelete }) {
  const { _id, company, jobRole, status, appliedDate, jobUrl, notes } = application;

  const formattedDate = appliedDate
    ? new Date(appliedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Not specified';

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete your application for "${company} - ${jobRole}"?`)) {
      onDelete(_id);
    }
  };

  return (
    <div className="app-card">
      <div className="card-header">
        <div className="card-title-group">
          <h3 className="card-company">{company}</h3>
          <p className="card-role">{jobRole}</p>
        </div>
        <span className={`badge ${getStatusBadgeClass(status)}`}>
          {status}
        </span>
      </div>

      <div className="card-body">
        <div className="card-meta">
          <div className="meta-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
              <line x1="16" x2="16" y1="2" y2="6"/>
              <line x1="8" x2="8" y1="2" y2="6"/>
              <line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
            <span>Applied: <strong>{formattedDate}</strong></span>
          </div>

          {jobUrl && (
            <div className="meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <a
                href={jobUrl.startsWith('http') ? jobUrl : `https://${jobUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="job-link"
              >
                View Job Post
              </a>
            </div>
          )}
        </div>

        {notes && (
          <div className="card-notes">
            <p className="notes-text">{notes}</p>
          </div>
        )}
      </div>

      <div className="card-footer">
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => onEdit(application)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          Edit
        </button>
        <button
          type="button"
          className="btn btn-outline-danger btn-sm"
          onClick={handleDelete}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
