import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { supabase } from '../services/supabase';
import type { StudyWithPdf, ConsentRecord } from '../types';

export function StudyDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [study, setStudy] = useState<StudyWithPdf | null>(null);
  const [consentRecord, setConsentRecord] = useState<ConsentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && user) {
      fetchStudyAndConsent();
    }
  }, [id, user]);

  const fetchStudyAndConsent = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      
      // Fetch study with PDF
      const { data: studyData, error: studyError } = await supabase
        .from('studies')
        .select(`
          *,
          pdf_document:pdf_documents(*)
        `)
        .eq('id', id)
        .single();

      if (studyError) {
        throw studyError;
      }

      setStudy(studyData);

      // Fetch existing consent record
      const { data: consentData } = await supabase
        .from('consent_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('study_id', id)
        .single();

      setConsentRecord(consentData);
    } catch (err) {
      console.error('Error fetching study:', err);
      setError('Failed to load study details');
    } finally {
      setLoading(false);
    }
  };

  const handleConsentSubmission = async (consentGiven: boolean) => {
    if (!study || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('consent_records')
        .insert({
          user_id: user.id,
          study_id: study.id,
          consent_given: consentGiven,
          bank_id_transaction_id: user.last_bank_id_auth || 'test-transaction',
          ip_address: '127.0.0.1', // This would be captured server-side
          user_agent: navigator.userAgent,
        });

      if (error) {
        throw error;
      }

      // Refresh consent record
      await fetchStudyAndConsent();
    } catch (err) {
      console.error('Error submitting consent:', err);
      setError('Failed to submit consent');
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="study-details">
        <div className="loading">Loading study details...</div>
      </div>
    );
  }

  if (error || !study) {
    return (
      <div className="study-details">
        <div className="error">
          <p>{error || 'Study not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="study-details">
      <div className="study-header">
        <h2>{study.title}</h2>
        <span className={`status-badge status-${study.status}`}>
          {study.status}
        </span>
      </div>

      {study.description && (
        <div className="study-description">
          <p>{study.description}</p>
        </div>
      )}

      <div className="study-meta">
        <div className="study-dates">
          {study.start_date && (
            <div>Start Date: {new Date(study.start_date).toLocaleDateString()}</div>
          )}
          {study.end_date && (
            <div>End Date: {new Date(study.end_date).toLocaleDateString()}</div>
          )}
        </div>
        <div className="participant-info">
          Maximum Participants: {study.max_participants}
        </div>
      </div>

      {/* PDF Consent Document */}
      {study.pdf_document && (
        <div className="consent-document">
          <h3>Consent Document</h3>
          <div className="pdf-viewer-placeholder">
            <p>PDF Viewer: {study.pdf_document.original_filename}</p>
            <p>File size: {(study.pdf_document.file_size / 1024 / 1024).toFixed(2)} MB</p>
            {/* PDF viewer component would go here */}
          </div>
        </div>
      )}

      {/* Consent Actions */}
      <div className="consent-actions">
        {consentRecord ? (
          <div className="consent-status">
            <h3>Your Consent Status</h3>
            <div className={`consent-badge ${consentRecord.consent_given ? 'consented' : 'declined'}`}>
              {consentRecord.consent_given ? 'Consented' : 'Declined'}
            </div>
            <p>
              Submitted on: {new Date(consentRecord.timestamp).toLocaleString()}
            </p>
            {consentRecord.withdrawn_at ? (
              <p className="withdrawn">
                Withdrawn on: {new Date(consentRecord.withdrawn_at).toLocaleString()}
                {consentRecord.withdrawal_reason && (
                  <span> - {consentRecord.withdrawal_reason}</span>
                )}
              </p>
            ) : consentRecord.consent_given ? (
              <button 
                onClick={() => handleWithdrawal()} 
                className="withdraw-button"
                disabled={submitting}
              >
                Withdraw Consent
              </button>
            ) : null}
          </div>
        ) : (
          <div className="consent-form">
            <h3>Provide Your Consent</h3>
            <p>
              Please read the consent document above carefully before making your decision.
            </p>
            <div className="consent-buttons">
              <button
                onClick={() => handleConsentSubmission(true)}
                disabled={submitting}
                className="consent-button consent-yes"
              >
                {submitting ? 'Submitting...' : 'I Consent'}
              </button>
              <button
                onClick={() => handleConsentSubmission(false)}
                disabled={submitting}
                className="consent-button consent-no"
              >
                {submitting ? 'Submitting...' : 'I Decline'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  async function handleWithdrawal() {
    if (!study || !user || !consentRecord) return;

    const reason = prompt('Please provide a reason for withdrawal (optional):');
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('consent_records')
        .update({
          withdrawn_at: new Date().toISOString(),
          withdrawal_reason: reason || null,
        })
        .eq('id', consentRecord.id);

      if (error) {
        throw error;
      }

      await fetchStudyAndConsent();
    } catch (err) {
      console.error('Error withdrawing consent:', err);
      setError('Failed to withdraw consent');
    } finally {
      setSubmitting(false);
    }
  }
}