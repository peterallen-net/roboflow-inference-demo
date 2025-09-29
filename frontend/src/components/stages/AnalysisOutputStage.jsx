import { useState } from 'react';
import { useWorkflow } from '../AnalysisWorkflow';

const AnalysisOutputStage = () => {
  const { workflowData, goToStage } = useWorkflow();
  const [activeTab, setActiveTab] = useState('annotated');

  const styles = {
    container: {
      textAlign: 'center',
    },
    title: {
      fontSize: '1.8rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#374151',
    },
    description: {
      fontSize: '1rem',
      color: '#6b7280',
      marginBottom: '2rem',
      lineHeight: '1.5',
    },
    tabContainer: {
      marginBottom: '2rem',
    },
    tabList: {
      display: 'flex',
      justifyContent: 'center',
      borderBottom: '2px solid #e5e7eb',
      marginBottom: '2rem',
      gap: '2rem',
    },
    tab: {
      padding: '1rem 2rem',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#6b7280',
      borderBottom: '3px solid transparent',
      transition: 'all 0.3s ease',
      borderRadius: '8px 8px 0 0',
    },
    activeTab: {
      color: '#667eea',
      borderBottomColor: '#667eea',
      backgroundColor: '#f8fafc',
      boxShadow: '0 -2px 8px rgba(102, 126, 234, 0.1)',
    },
    tabContent: {
      minHeight: '400px',
      textAlign: 'left',
    },
    imageContainer: {
      textAlign: 'center',
      padding: '2rem',
    },
    annotatedImage: {
      maxWidth: '100%',
      maxHeight: '500px',
      borderRadius: '12px',
      boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)',
      margin: '0 auto',
    },
    imageInfo: {
      marginTop: '1.5rem',
      padding: '1rem',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      fontSize: '0.9rem',
      color: '#374151',
      textAlign: 'left',
      maxWidth: '500px',
      margin: '1.5rem auto 0',
    },
    noImageContainer: {
      textAlign: 'center',
      padding: '3rem',
      color: '#6b7280',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      border: '2px dashed #d1d5db',
    },
    noImageIcon: {
      fontSize: '4rem',
      marginBottom: '1rem',
    },
    jsonContainer: {
      backgroundColor: '#1f2937',
      borderRadius: '12px',
      padding: '1.5rem',
      overflow: 'auto',
      maxHeight: '500px',
      position: 'relative',
    },
    jsonHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
      paddingBottom: '0.5rem',
      borderBottom: '1px solid #374151',
    },
    jsonTitle: {
      color: '#f9fafb',
      fontSize: '1.1rem',
      fontWeight: '600',
    },
    copyButton: {
      backgroundColor: '#374151',
      color: '#e5e7eb',
      border: 'none',
      borderRadius: '6px',
      padding: '0.5rem 1rem',
      fontSize: '0.8rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    jsonContent: {
      color: '#e5e7eb',
      fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
      fontSize: '0.85rem',
      lineHeight: '1.6',
      whiteSpace: 'pre-wrap',
      margin: 0,
      wordBreak: 'break-word',
    },
    detectionSummary: {
      display: 'flex',
      justifyContent: 'center',
      gap: '2rem',
      marginTop: '1.5rem',
      flexWrap: 'wrap',
    },
    summaryCard: {
      backgroundColor: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: '8px',
      padding: '1rem',
      textAlign: 'center',
      minWidth: '120px',
    },
    summaryNumber: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#0369a1',
      marginBottom: '0.25rem',
    },
    summaryLabel: {
      fontSize: '0.8rem',
      color: '#075985',
      textTransform: 'uppercase',
      fontWeight: '600',
      letterSpacing: '0.5px',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      marginTop: '2rem',
      flexWrap: 'wrap',
    },
    actionButton: {
      padding: '1rem 2rem',
      border: 'none',
      borderRadius: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    uploadNewButton: {
      backgroundColor: '#6b7280',
      color: 'white',
      boxShadow: '0 4px 15px 0 rgba(107, 114, 128, 0.3)',
    },
    reviewItemsButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.3)',
    },
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(workflowData.analysisResult, null, 2));
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getSummaryStats = () => {
    if (!workflowData.analysisResult?.detections) {
      return {
        totalObjects: 0,
        avgConfidence: 0
      };
    }

    const detections = workflowData.analysisResult.detections;
    const totalObjects = detections.length;
    const avgConfidence = detections.reduce((sum, det) => sum + det.confidence, 0) / totalObjects;

    return {
      totalObjects,
      avgConfidence: Math.round(avgConfidence * 100)
    };
  };

  const stats = getSummaryStats();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Analysis Results</h2>
      <p style={styles.description}>
        You can switch between the annotated image and raw JSON output.
      </p>

      {/* Detection Summary Cards */}
      <div style={styles.detectionSummary}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryNumber}>{stats.totalObjects}</div>
          <div style={styles.summaryLabel}>Objects Found</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryNumber}>{stats.avgConfidence}%</div>
          <div style={styles.summaryLabel}>Avg Confidence</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        <div style={styles.tabList}>
          <button
            onClick={() => setActiveTab('annotated')}
            style={{
              ...styles.tab,
              ...(activeTab === 'annotated' ? styles.activeTab : {})
            }}
          >
            📸 Annotated Image
          </button>
          <button
            onClick={() => setActiveTab('json')}
            style={{
              ...styles.tab,
              ...(activeTab === 'json' ? styles.activeTab : {})
            }}
          >
            📄 JSON Output
          </button>
        </div>

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {activeTab === 'annotated' && (
            <div style={styles.imageContainer}>
              {workflowData.annotatedImageUrl ? (
                <>
                  <img 
                    src={workflowData.annotatedImageUrl} 
                    alt="Annotated analysis result" 
                    style={styles.annotatedImage}
                  />
                  <div style={styles.imageInfo}>
                    <strong>Analysis Complete:</strong> {workflowData.analysisResult?.detections?.length || 0} objects detected<br/>
                    <strong>Model:</strong> {workflowData.analysisResult?.model_version || 'Unknown'}<br/>
                    <strong>Timestamp:</strong> {workflowData.analysisResult?.timestamp ? new Date(workflowData.analysisResult.timestamp).toLocaleString() : 'Unknown'}<br/>
                    {workflowData.analysisResult?.demo_mode && <strong style={{color: '#f59e0b'}}>⚠️ Demo Mode Active</strong>}
                  </div>
                </>
              ) : (
                <div style={styles.noImageContainer}>
                  <div style={styles.noImageIcon}>🖼️</div>
                  <p><strong>No Annotated Image Available</strong></p>
                  <p style={{fontSize: '0.9rem', marginTop: '0.5rem'}}>
                    The analysis completed but no annotated image was returned by the model.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'json' && (
            <div>
              <div style={styles.jsonContainer}>
                <div style={styles.jsonHeader}>
                  <div style={styles.jsonTitle}>Raw Analysis Data</div>
                  <button 
                    onClick={copyToClipboard}
                    style={styles.copyButton}
                    title="Copy JSON to clipboard"
                  >
                    📋 Copy
                  </button>
                </div>
                <pre style={styles.jsonContent}>
                  {JSON.stringify(workflowData.analysisResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={styles.buttonContainer}>
        <button
          onClick={() => goToStage(0)}
          style={{
            ...styles.actionButton,
            ...styles.uploadNewButton
          }}
        >
          Upload New Image
        </button>
        
        <button
          onClick={() => goToStage(2)}
          style={{
            ...styles.actionButton,
            ...styles.reviewItemsButton
          }}
        >
          Review Items
        </button>
      </div>
    </div>
  );
};

export default AnalysisOutputStage;
