import { useState, useEffect } from 'react';
import { useWorkflow } from '../AnalysisWorkflow';

const ReviewObjectsStage = () => {
  const { workflowData, updateWorkflowData } = useWorkflow();
  const [reviewedObjects, setReviewedObjects] = useState([]);

  useEffect(() => {
    // Initialize reviewed objects from analysis results
    if (workflowData.analysisResult?.detections && reviewedObjects.length === 0) {
      const initialObjects = workflowData.analysisResult.detections.map((detection, index) => ({
        id: detection.id || index + 1,
        class: detection.class,
        confidence: detection.confidence,
        bbox: detection.bbox,
        condition: 'Good', // Default condition
        comments: '',
        verified: false,
        exclude: false,
      }));
      setReviewedObjects(initialObjects);
      updateWorkflowData({ reviewedObjects: initialObjects });
    }
  }, [workflowData.analysisResult, reviewedObjects.length, updateWorkflowData]);

  const updateObject = (id, updates) => {
    const updated = reviewedObjects.map(obj =>
      obj.id === id ? { ...obj, ...updates } : obj
    );
    setReviewedObjects(updated);
    updateWorkflowData({ reviewedObjects: updated });
  };

  const toggleVerified = (id) => {
    updateObject(id, { verified: !reviewedObjects.find(obj => obj.id === id)?.verified });
  };

  const toggleExclude = (id) => {
    updateObject(id, { exclude: !reviewedObjects.find(obj => obj.id === id)?.exclude });
  };

  const styles = {
    container: {
      textAlign: 'left',
    },
    title: {
      fontSize: '1.8rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#374151',
      textAlign: 'center',
    },
    description: {
      fontSize: '1rem',
      color: '#6b7280',
      marginBottom: '2rem',
      lineHeight: '1.5',
      textAlign: 'center',
    },
    summaryBar: {
      display: 'flex',
      justifyContent: 'center',
      gap: '2rem',
      marginBottom: '2rem',
      padding: '1rem',
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      flexWrap: 'wrap',
    },
    summaryItem: {
      textAlign: 'center',
    },
    summaryNumber: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#0369a1',
    },
    summaryLabel: {
      fontSize: '0.8rem',
      color: '#6b7280',
      textTransform: 'uppercase',
      fontWeight: '600',
    },
    objectGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem',
    },
    objectCard: {
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      padding: '1.5rem',
      backgroundColor: '#ffffff',
      transition: 'all 0.3s ease',
    },
    verifiedCard: {
      borderColor: '#22c55e',
      backgroundColor: '#f0fdf4',
    },
    excludedCard: {
      borderColor: '#ef4444',
      backgroundColor: '#fef2f2',
      opacity: 0.7,
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
    },
    objectClass: {
      fontSize: '1.2rem',
      fontWeight: '600',
      color: '#374151',
      textTransform: 'capitalize',
    },
    confidenceScore: {
      fontSize: '0.9rem',
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
      padding: '0.25rem 0.5rem',
      borderRadius: '6px',
    },
    highConfidence: {
      backgroundColor: '#dcfce7',
      color: '#166534',
    },
    mediumConfidence: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
    },
    lowConfidence: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
    },
    cardContent: {
      display: 'grid',
      gap: '1rem',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    },
    label: {
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#374151',
    },
    select: {
      padding: '0.5rem',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '0.9rem',
      backgroundColor: '#ffffff',
    },
    textarea: {
      padding: '0.5rem',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '0.9rem',
      backgroundColor: '#ffffff',
      resize: 'vertical',
      minHeight: '60px',
    },
    cardActions: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '1rem',
    },
    actionButton: {
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '6px',
      fontSize: '0.8rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      flex: 1,
    },
    verifyButton: {
      backgroundColor: '#22c55e',
      color: 'white',
    },
    verifiedButton: {
      backgroundColor: '#16a34a',
      color: 'white',
    },
    excludeButton: {
      backgroundColor: '#ef4444',
      color: 'white',
    },
    excludedButton: {
      backgroundColor: '#dc2626',
      color: 'white',
    },
    includeButton: {
      backgroundColor: '#6b7280',
      color: 'white',
    },
    bboxInfo: {
      fontSize: '0.8rem',
      color: '#6b7280',
      backgroundColor: '#f9fafb',
      padding: '0.5rem',
      borderRadius: '6px',
      fontFamily: 'monospace',
    },
  };

  const getConfidenceStyle = (confidence) => {
    if (confidence >= 0.8) return { ...styles.confidenceScore, ...styles.highConfidence };
    if (confidence >= 0.6) return { ...styles.confidenceScore, ...styles.mediumConfidence };
    return { ...styles.confidenceScore, ...styles.lowConfidence };
  };

  const getCardStyle = (obj) => {
    if (obj.exclude) return { ...styles.objectCard, ...styles.excludedCard };
    if (obj.verified) return { ...styles.objectCard, ...styles.verifiedCard };
    return styles.objectCard;
  };

  const getSummaryStats = () => {
    const total = reviewedObjects.length;
    const verified = reviewedObjects.filter(obj => obj.verified).length;
    const excluded = reviewedObjects.filter(obj => obj.exclude).length;
    const pending = total - verified - excluded;
    
    return { total, verified, excluded, pending };
  };

  const stats = getSummaryStats();

  if (reviewedObjects.length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Review Objects</h2>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <p>No objects detected in the analysis to review.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Review Detected Objects</h2>
      <p style={styles.description}>
        Review each detected object below. Add conditions, comments, and verify or exclude objects as needed.
      </p>

      {/* Summary Bar */}
      <div style={styles.summaryBar}>
        <div style={styles.summaryItem}>
          <div style={styles.summaryNumber}>{stats.total}</div>
          <div style={styles.summaryLabel}>Total Objects</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryNumber}>{stats.verified}</div>
          <div style={styles.summaryLabel}>Verified</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryNumber}>{stats.excluded}</div>
          <div style={styles.summaryLabel}>Excluded</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryNumber}>{stats.pending}</div>
          <div style={styles.summaryLabel}>Pending Review</div>
        </div>
      </div>

      {/* Object Cards */}
      <div style={styles.objectGrid}>
        {reviewedObjects.map((obj) => (
          <div key={obj.id} style={getCardStyle(obj)}>
            {/* Card Header */}
            <div style={styles.cardHeader}>
              <div style={styles.objectClass}>
                {obj.class}
              </div>
              <div style={getConfidenceStyle(obj.confidence)}>
                {Math.round(obj.confidence * 100)}%
              </div>
            </div>

            {/* Card Content */}
            <div style={styles.cardContent}>
              {/* Condition */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Condition:</label>
                <select
                  value={obj.condition}
                  onChange={(e) => updateObject(obj.id, { condition: e.target.value })}
                  style={styles.select}
                  disabled={obj.exclude}
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>

              {/* Comments */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Comments:</label>
                <textarea
                  value={obj.comments}
                  onChange={(e) => updateObject(obj.id, { comments: e.target.value })}
                  placeholder="Add any additional notes or observations..."
                  style={styles.textarea}
                  disabled={obj.exclude}
                />
              </div>

              {/* Bounding Box Info */}
              <div style={styles.bboxInfo}>
                Position: ({obj.bbox.x}, {obj.bbox.y}) • 
                Size: {obj.bbox.width} × {obj.bbox.height}px
              </div>
            </div>

            {/* Card Actions */}
            <div style={styles.cardActions}>
              <button
                onClick={() => toggleVerified(obj.id)}
                style={{
                  ...styles.actionButton,
                  ...(obj.verified ? styles.verifiedButton : styles.verifyButton)
                }}
                disabled={obj.exclude}
              >
                {obj.verified ? '✓ Verified' : 'Verify'}
              </button>
              
              <button
                onClick={() => toggleExclude(obj.id)}
                style={{
                  ...styles.actionButton,
                  ...(obj.exclude ? styles.includeButton : styles.excludeButton)
                }}
              >
                {obj.exclude ? 'Include' : 'Exclude'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewObjectsStage;
