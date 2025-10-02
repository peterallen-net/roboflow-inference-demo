import { useState, useRef } from 'react';
import { useWorkflow } from '../AnalysisWorkflow';

const FinaliseStage = () => {
  const { workflowData, updateWorkflowData, nextStage, prevStage } = useWorkflow();
  const [signatureMode, setSignatureMode] = useState('digital'); // 'digital' or 'text'
  const [textSignature, setTextSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const [signatureData, setSignatureData] = useState(null);

  const handleMouseDown = (e) => {
    if (signatureMode !== 'digital') return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || signatureMode !== 'digital') return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (signatureMode !== 'digital') return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL();
    setSignatureData(dataURL);
    updateWorkflowData({ 
      signature: {
        type: 'digital',
        data: dataURL,
        timestamp: new Date().toISOString()
      }
    });
  };

  const clearSignature = () => {
    if (signatureMode === 'digital') {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData(null);
    } else {
      setTextSignature('');
    }
    updateWorkflowData({ signature: null });
  };

  const handleTextSignature = (value) => {
    setTextSignature(value);
    if (value.trim()) {
      updateWorkflowData({
        signature: {
          type: 'text',
          data: value.trim(),
          timestamp: new Date().toISOString()
        }
      });
    } else {
      updateWorkflowData({ signature: null });
    }
  };

  const generateFinalReport = () => {
    const includedObjects = workflowData.reviewedObjects?.filter(obj => !obj.exclude) || [];
    const predictions = workflowData.analysisResult?.predictions || workflowData.analysisResult?.detections || [];
    
    const report = {
      id: `REPORT_${Date.now()}`,
      timestamp: new Date().toISOString(),
      analysis: {
        originalImage: workflowData.selectedFile?.name || 'Unknown',
        annotatedImage: workflowData.annotatedImageUrl ? 'Available' : 'Not Available',
        totalObjectsDetected: predictions.length,
        objectsIncluded: includedObjects.length,
        processingTime: workflowData.analysisResult?.processing_time_ms || workflowData.analysisResult?.processing_time || 0,
        modelVersion: workflowData.analysisResult?.model_version || 'Unknown',
        demoMode: workflowData.analysisResult?.demo_mode || workflowData.analysisResult?.metadata?.demo_mode || false
      },
      objects: includedObjects.map(obj => ({
        id: obj.id,
        class: obj.class,
        confidence: Math.round(obj.confidence * 100),
        condition: obj.condition,
        comments: obj.comments || 'None',
        verified: obj.verified,
        handlingCode: obj.handlingCode || '',
        damageType: obj.damageType || '',
        damageLocation: obj.damageLocation || '',
        position: obj.bbox ? `(${obj.bbox.x}, ${obj.bbox.y})` : 'N/A',
        size: obj.bbox ? `${obj.bbox.width} × ${obj.bbox.height}px` : 'N/A'
      })),
      signature: workflowData.signature,
      summary: {
        totalVerified: includedObjects.filter(obj => obj.verified).length,
        conditionBreakdown: {
          excellent: includedObjects.filter(obj => obj.condition === 'Excellent').length,
          good: includedObjects.filter(obj => obj.condition === 'Good').length,
          fair: includedObjects.filter(obj => obj.condition === 'Fair').length,
          poor: includedObjects.filter(obj => obj.condition === 'Poor').length,
          damaged: includedObjects.filter(obj => obj.condition === 'Damaged').length,
        }
      }
    };

    updateWorkflowData({ finalReport: report });
    nextStage(); // Navigate to the next stage after generating the report
  };

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
    summaryCard: {
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem',
      textAlign: 'left',
    },
    summaryTitle: {
      fontSize: '1.2rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#374151',
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '1rem',
    },
    summaryItem: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.5rem',
      backgroundColor: '#ffffff',
      borderRadius: '6px',
      fontSize: '0.9rem',
    },
    signatureSection: {
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem',
    },
    signatureTitle: {
      fontSize: '1.2rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#374151',
    },
    modeSelector: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
      justifyContent: 'center',
    },
    modeButton: {
      padding: '0.75rem 1.5rem',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      backgroundColor: '#ffffff',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontWeight: '600',
    },
    activeModeButton: {
      borderColor: '#667eea',
      backgroundColor: '#f0f4ff',
      color: '#667eea',
    },
    signatureCanvas: {
      border: '2px dashed #d1d5db',
      borderRadius: '8px',
      cursor: 'crosshair',
      backgroundColor: '#ffffff',
      display: 'block',
      margin: '0 auto',
    },
    textSignatureInput: {
      width: '100%',
      maxWidth: '400px',
      padding: '1rem',
      fontSize: '1.1rem',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      textAlign: 'center',
      fontFamily: 'cursive',
      backgroundColor: '#ffffff',
    },
    signatureActions: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      marginTop: '1rem',
    },
    actionButton: {
      padding: '0.75rem 1.5rem',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    clearButton: {
      backgroundColor: '#6b7280',
      color: 'white',
    },
    generateButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontSize: '1.1rem',
      padding: '1rem 2rem',
      marginTop: '2rem',
      boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.3)',
    },
    disabledButton: {
      backgroundColor: '#d1d5db',
      color: '#9ca3af',
      cursor: 'not-allowed',
      boxShadow: 'none',
    },
    signaturePreview: {
      marginTop: '1rem',
      padding: '1rem',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      marginTop: '2rem',
      flexWrap: 'wrap',
    },
    backButton: {
      backgroundColor: '#6b7280',
      color: 'white',
      fontSize: '1rem',
      padding: '0.75rem 1.5rem',
      boxShadow: '0 4px 15px 0 rgba(107, 114, 128, 0.3)',
      borderRadius: '8px',
    },
    objectsTableContainer: {
      marginTop: '1.5rem',
    },
    tableTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#374151',
    },
    tableWrapper: {
      overflowX: 'auto',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
    objectsTable: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '600px',
    },
    tableHeader: {
      backgroundColor: '#f8fafc',
      borderBottom: '2px solid #e2e8f0',
    },
    tableHeaderCell: {
      padding: '0.75rem',
      textAlign: 'left',
      fontWeight: '600',
      color: '#374151',
      fontSize: '0.875rem',
      textTransform: 'uppercase',
      letterSpacing: '0.025em',
      whiteSpace: 'nowrap',
    },
    tableRow: {
      borderBottom: '1px solid #f1f5f9',
      transition: 'all 0.2s ease',
    },
    tableCell: {
      padding: '0.75rem',
      fontSize: '0.875rem',
      color: '#374151',
      verticalAlign: 'top',
    },
  };

  const getSummaryData = () => {
    const includedObjects = workflowData.reviewedObjects?.filter(obj => !obj.exclude) || [];
    const predictions = workflowData.analysisResult?.predictions || workflowData.analysisResult?.detections || [];
    
    return {
      'Total Objects Detected': predictions.length,
      'Objects Included': includedObjects.length,
      'Objects Verified': includedObjects.filter(obj => obj.verified).length,
      'Analysis Date': new Date().toLocaleDateString(),
    };
  };

  const summaryData = getSummaryData();
  const hasSignature = workflowData.signature?.data;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Finalise Report</h2>
      <p style={styles.description}>
        Review the analysis summary below and provide your signature to finalise the report.
      </p>

      {/* Summary Card */}
      <div style={styles.summaryCard}>
        <h3 style={styles.summaryTitle}>Summary</h3>
        <div style={styles.summaryGrid}>
          {Object.entries(summaryData).map(([key, value]) => (
            <div key={key} style={styles.summaryItem}>
              <span style={{ fontWeight: '600' }}>{key}:</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
        
        {/* Objects Table */}
        {workflowData.reviewedObjects && workflowData.reviewedObjects.filter(obj => !obj.exclude).length > 0 && (
          <div style={styles.objectsTableContainer}>
            <h4 style={styles.tableTitle}>Objects Summary</h4>
            <div style={styles.tableWrapper}>
              <table style={styles.objectsTable}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th style={styles.tableHeaderCell}>Module No.</th>
                    <th style={styles.tableHeaderCell}>Item No.</th>
                    <th style={styles.tableHeaderCell}>Item Name</th>
                    <th style={styles.tableHeaderCell}>Condition</th>
                    <th style={styles.tableHeaderCell}>Comments</th>
                    <th style={styles.tableHeaderCell}>Unstow</th>
                    <th style={styles.tableHeaderCell}>Restow</th>
                    <th style={styles.tableHeaderCell}>Cond. at Dest.</th>
                  </tr>
                </thead>
                <tbody>
                  {workflowData.reviewedObjects
                    .filter(obj => !obj.exclude)
                    .map((obj, index) => {
                      // Format condition combining handling code and damage codes
                      const conditionParts = [];
                      if (obj.handlingCode) conditionParts.push(obj.handlingCode);
                      if (obj.damageType) {
                        conditionParts.push(obj.damageType);
                        if (obj.damageLocation) conditionParts.push(`(${obj.damageLocation})`);
                      }
                      const condition = conditionParts.length > 0 ? conditionParts.join(' ') : 'Good';
                      
                      return (
                        <tr key={obj.id} style={styles.tableRow}>
                          <td style={styles.tableCell}>M{String(index + 1).padStart(3, '0')}</td>
                          <td style={styles.tableCell}>{index + 1}</td>
                          <td style={styles.tableCell}>{obj.class}</td>
                          <td style={styles.tableCell}>{condition}</td>
                          <td style={styles.tableCell}>{obj.comments || 'None'}</td>
                          <td style={styles.tableCell}>-</td>
                          <td style={styles.tableCell}>-</td>
                          <td style={styles.tableCell}>-</td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {(workflowData.analysisResult?.demo_mode || workflowData.analysisResult?.metadata?.demo_mode) && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            borderRadius: '6px',
            fontSize: '0.9rem',
            fontWeight: '600',
            textAlign: 'center',
          }}>
            ⚠️ Report generated in demo mode
          </div>
        )}
      </div>

      {/* Signature Section */}
      <div style={styles.signatureSection}>
        <h3 style={styles.signatureTitle}>Signature Required</h3>
        
        {/* Mode Selector */}
        <div style={styles.modeSelector}>
          <button
            onClick={() => setSignatureMode('digital')}
            style={{
              ...styles.modeButton,
              ...(signatureMode === 'digital' ? styles.activeModeButton : {})
            }}
          >
            ✏️ Digital Signature
          </button>
          <button
            onClick={() => setSignatureMode('text')}
            style={{
              ...styles.modeButton,
              ...(signatureMode === 'text' ? styles.activeModeButton : {})
            }}
          >
            📝 Text Signature
          </button>
        </div>

        {/* Signature Input */}
        {signatureMode === 'digital' ? (
          <div>
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              style={styles.signatureCanvas}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Click and drag to draw your signature above
            </p>
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={textSignature}
              onChange={(e) => handleTextSignature(e.target.value)}
              placeholder="Enter your full name"
              style={styles.textSignatureInput}
            />
          </div>
        )}

        {/* Signature Actions */}
        <div style={styles.signatureActions}>
          <button
            onClick={clearSignature}
            style={{ ...styles.actionButton, ...styles.clearButton }}
          >
            Clear
          </button>
        </div>

        {/* Signature Preview */}
        {hasSignature && (
          <>
            <div style={styles.signaturePreview}>
              <strong>Signature Preview:</strong><br/>
              {workflowData.signature.type === 'digital' ? (
                <img src={workflowData.signature.data} alt="Digital signature" style={{ maxWidth: '200px', height: 'auto' }} />
              ) : (
                <span style={{ fontFamily: 'cursive', fontSize: '1.2rem' }}>
                  {workflowData.signature.data}
                </span>
              )}
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Signed on: {new Date(workflowData.signature.timestamp).toLocaleString()}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={styles.buttonContainer}>
        <button
          onClick={prevStage}
          style={{
            ...styles.actionButton,
            ...styles.backButton
          }}
        >
          ← Back
        </button>
        
        <button
          onClick={generateFinalReport}
          disabled={!hasSignature}
          style={{
            ...styles.actionButton,
            ...styles.generateButton,
            ...((!hasSignature) ? styles.disabledButton : {})
          }}
        >
          {hasSignature ? 'Generate Report' : 'Signature Required'}
        </button>
      </div>
    </div>
  );
};

export default FinaliseStage;
