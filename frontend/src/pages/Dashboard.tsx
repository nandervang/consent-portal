import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { supabase } from '../services/supabase';
import type { StudyWithPdf } from '../types';

export function Dashboard() {
  const { user } = useAuth();
  const [studies, setStudies] = useState<StudyWithPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('studies')
        .select(`
          *,
          pdf_document:pdf_documents(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setStudies(data || []);
    } catch (err) {
      console.error('Error fetching studies:', err);
      setError('Failed to load studies');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading studies...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">
          <p>{error}</p>
          <button onClick={fetchStudies}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Available Studies</h2>
        {user?.role === 'researcher' && (
          <Link to="/create-study" className="create-study-button">
            Create New Study
          </Link>
        )}
      </div>

      {studies.length === 0 ? (
        <div className="no-studies">
          <p>No active studies available at the moment.</p>
        </div>
      ) : (
        <div className="studies-grid">
          {studies.map((study) => (
            <StudyCard key={study.id} study={study} />
          ))}
        </div>
      )}
    </div>
  );
}

function StudyCard({ study }: { study: StudyWithPdf }) {
  return (
    <div className="study-card">
      <div className="study-card-header">
        <h3>{study.title}</h3>
        <span className={`status-badge status-${study.status}`}>
          {study.status}
        </span>
      </div>
      
      {study.description && (
        <p className="study-description">{study.description}</p>
      )}
      
      <div className="study-meta">
        <div className="study-dates">
          {study.start_date && (
            <span>Start: {new Date(study.start_date).toLocaleDateString()}</span>
          )}
          {study.end_date && (
            <span>End: {new Date(study.end_date).toLocaleDateString()}</span>
          )}
        </div>
        <div className="participant-limit">
          Max participants: {study.max_participants}
        </div>
      </div>
      
      <div className="study-actions">
        <Link to={`/study/${study.id}`} className="view-study-button">
          View Details & Consent
        </Link>
      </div>
    </div>
  );
}