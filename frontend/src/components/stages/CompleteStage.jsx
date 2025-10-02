import { useState } from 'react';
import { useWorkflow } from '../AnalysisWorkflow';

const CompleteStage = () => {
  const { workflowData, resetWorkflow } = useWorkflow();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  const shareViaEmail = () => {
    if (!workflowData.finalReport || !emailAddress) return;

    const report = workflowData.finalReport;
    const subject = `AI Analysis Report - ${report.id}`;
    const body = `
Hi,

Please find the AI Image Analysis Report summary below:

Report ID: ${report.id}
Generated: ${new Date(report.timestamp).toLocaleString()}

Analysis Overview:
- Original Image: ${report.analysis.originalImage}
- Total Objects Detected: ${report.analysis.totalObjectsDetected}
- Objects Included: ${report.analysis.objectsIncluded}
- Objects Verified: ${report.summary.totalVerified}

Condition Breakdown:
- Excellent: ${report.summary.conditionBreakdown.excellent}
- Good: ${report.summary.conditionBreakdown.good}
- Fair: ${report.summary.conditionBreakdown.fair}
- Poor: ${report.summary.conditionBreakdown.poor}
- Damaged: ${report.summary.conditionBreakdown.damaged}

Signed by: ${report.signature.data}
Signature Date: ${new Date(report.signature.timestamp).toLocaleString()}

Please download the full report for complete details.

Best regards,
AI Image Analysis System
    `.trim();

    // Create mailto link
    const mailtoLink = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    // Show success message
    setShareMessage('Email client opened! Please send the email.');
    setTimeout(() => {
      setShareMessage('');
      setShowEmailModal(false);
      setEmailAddress('');
    }, 3000);
  };

  const shareViaSMS = () => {
    if (!workflowData.finalReport || !phoneNumber) return;

    const report = workflowData.finalReport;
    const message = `AI Analysis Report ${report.id}: ${report.summary.totalVerified} objects verified. Report generated on ${new Date(report.timestamp).toLocaleDateString()}. View full details in the downloaded report.`;

    // Create SMS link (works on mobile devices)
    const smsLink = `sms:${phoneNumber}${/iPhone|iPad|iPod/.test(navigator.userAgent) ? '&' : '?'}body=${encodeURIComponent(message)}`;
    window.location.href = smsLink;

    // Show success message
    setShareMessage('SMS app opened! Please send the message.');
    setTimeout(() => {
      setShareMessage('');
      setShowSMSModal(false);
      setPhoneNumber('');
    }, 3000);
  };

  const downloadPDF = () => {
    if (!workflowData.finalReport) return;

    // Generate PDF-style content as HTML (in a real app, you'd use jsPDF or similar)
    const reportContent = generateReportHTML(workflowData.finalReport);
    
    // Create and download file
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Analysis_Report_${workflowData.finalReport.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (!workflowData.finalReport) return;

    const report = workflowData.finalReport;
    
    // Create CSV headers
    const headers = [
      'ID',
      'Class',
      'Confidence (%)',
      'Comments',
      'Verified',
      'Position',
      'Size'
    ];
    
    // Create CSV rows
    const rows = report.objects.map(obj => [
      obj.id,
      obj.class,
      obj.confidence,
      `"${obj.comments || 'None'}"`, // Wrap in quotes to handle commas
      obj.verified ? 'Yes' : 'No',
      obj.position,
      obj.size
    ]);
    
    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Analysis_Report_${report.id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateReportHTML = (report) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Analysis Report - ${report.id}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 20px;
        }
        .title {
            color: #667eea;
            margin-bottom: 10px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            background-color: #f8fafc;
            padding: 10px;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
            font-weight: bold;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px;
            background-color: #f9fafb;
            border-radius: 4px;
        }
        .objects-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .objects-table th,
        .objects-table td {
            border: 1px solid #e2e8f0;
            padding: 8px;
            text-align: left;
        }
        .objects-table th {
            background-color: #f8fafc;
            font-weight: bold;
        }
        .signature-section {
            margin-top: 30px;
            padding: 20px;
            background-color: #f8fafc;
            border-radius: 6px;
            text-align: center;
        }
        .condition-excellent { background-color: #dcfce7; color: #166534; }
        .condition-good { background-color: #dbeafe; color: #1e40af; }
        .condition-fair { background-color: #fef3c7; color: #92400e; }
        .condition-poor { background-color: #fed7d7; color: #c53030; }
        .condition-damaged { background-color: #fee2e2; color: #991b1b; }
        .verified { font-weight: bold; color: #059669; }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 0.9em;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🔍 AI Image Analysis Report</h1>
            <p><strong>Report ID:</strong> ${report.id}</p>
            <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
        </div>

        <div class="section">
            <div class="section-title">📊 Analysis Overview</div>
            <div class="info-grid">
                <div class="info-item">
                    <span><strong>Original Image:</strong></span>
                    <span>${report.analysis.originalImage}</span>
                </div>
                <div class="info-item">
                    <span><strong>Total Objects Detected:</strong></span>
                    <span>${report.analysis.totalObjectsDetected}</span>
                </div>
                <div class="info-item">
                    <span><strong>Objects Included:</strong></span>
                    <span>${report.analysis.objectsIncluded}</span>
                </div>
                <div class="info-item">
                    <span><strong>Processing Time:</strong></span>
                    <span>${report.analysis.processingTime}s</span>
                </div>
                <div class="info-item">
                    <span><strong>Model Version:</strong></span>
                    <span>${report.analysis.modelVersion}</span>
                </div>
                <div class="info-item">
                    <span><strong>Annotated Image:</strong></span>
                    <span>${report.analysis.annotatedImage}</span>
                </div>
            </div>
            ${report.analysis.demoMode ? '<div style="padding: 10px; background-color: #fef3c7; border-radius: 4px; color: #92400e; text-align: center;"><strong>⚠️ Generated in Demo Mode</strong></div>' : ''}
        </div>

        <div class="section">
            <div class="section-title">📋 Detected Objects</div>
            <table class="objects-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Class</th>
                        <th>Confidence</th>
                        <th>Condition</th>
                        <th>Position</th>
                        <th>Size</th>
                        <th>Status</th>
                        <th>Comments</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.objects.map(obj => `
                        <tr>
                            <td>${obj.id}</td>
                            <td style="text-transform: capitalize;">${obj.class}</td>
                            <td>${obj.confidence}%</td>
                            <td class="condition-${obj.condition.toLowerCase()}">${obj.condition}</td>
                            <td style="font-family: monospace;">${obj.position}</td>
                            <td style="font-family: monospace;">${obj.size}</td>
                            <td class="${obj.verified ? 'verified' : ''}">${obj.verified ? '✓ Verified' : 'Pending'}</td>
                            <td>${obj.comments}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <div class="section-title">📈 Summary Statistics</div>
            <div class="info-grid">
                <div class="info-item">
                    <span><strong>Total Verified:</strong></span>
                    <span>${report.summary.totalVerified}</span>
                </div>
                <div class="info-item">
                    <span><strong>Excellent Condition:</strong></span>
                    <span>${report.summary.conditionBreakdown.excellent}</span>
                </div>
                <div class="info-item">
                    <span><strong>Good Condition:</strong></span>
                    <span>${report.summary.conditionBreakdown.good}</span>
                </div>
                <div class="info-item">
                    <span><strong>Fair Condition:</strong></span>
                    <span>${report.summary.conditionBreakdown.fair}</span>
                </div>
                <div class="info-item">
                    <span><strong>Poor Condition:</strong></span>
                    <span>${report.summary.conditionBreakdown.poor}</span>
                </div>
                <div class="info-item">
                    <span><strong>Damaged:</strong></span>
                    <span>${report.summary.conditionBreakdown.damaged}</span>
                </div>
            </div>
        </div>

        <div class="signature-section">
            <div class="section-title">✍️ Authorization</div>
            <p><strong>Report signed by:</strong></p>
            ${report.signature.type === 'digital' 
                ? `<img src="${report.signature.data}" alt="Digital signature" style="max-height: 80px; margin: 10px 0;"/>`
                : `<div style="font-family: cursive; font-size: 1.5em; margin: 10px 0;">${report.signature.data}</div>`
            }
            <p><strong>Signed on:</strong> ${new Date(report.signature.timestamp).toLocaleString()}</p>
        </div>

        <div class="footer">
            <p>This report was generated automatically by the AI Image Analysis System</p>
            <p>Report ID: ${report.id} | Generated: ${new Date(report.timestamp).toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;
  };

  const styles = {
    container: {
      textAlign: 'center',
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      marginBottom: '1rem',
      color: '#059669',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
    },
    description: {
      fontSize: '1.1rem',
      color: '#6b7280',
      marginBottom: '2rem',
      lineHeight: '1.5',
    },
    successIcon: {
      fontSize: '4rem',
      marginBottom: '1rem',
      animation: 'bounce 1s ease-in-out',
    },
    reportSummary: {
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: '12px',
      padding: '2rem',
      marginBottom: '2rem',
      textAlign: 'left',
    },
    summaryTitle: {
      fontSize: '1.3rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#059669',
      textAlign: 'center',
    },
    summaryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem',
    },
    summaryItem: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.75rem',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #d1fae5',
    },
    actionsContainer: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      marginBottom: '2rem',
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
    downloadButton: {
      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      color: 'white',
      boxShadow: '0 4px 15px 0 rgba(5, 150, 105, 0.3)',
    },
    downloadCSVButton: {
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: 'white',
      boxShadow: '0 4px 15px 0 rgba(245, 158, 11, 0.3)',
    },
    restartButton: {
      backgroundColor: '#6b7280',
      color: 'white',
    },
    shareEmailButton: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: 'white',
      boxShadow: '0 4px 15px 0 rgba(59, 130, 246, 0.3)',
    },
    shareSMSButton: {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      color: 'white',
      boxShadow: '0 4px 15px 0 rgba(139, 92, 246, 0.3)',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '2rem',
      maxWidth: '500px',
      width: '90%',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    },
    modalTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#374151',
    },
    modalDescription: {
      fontSize: '0.95rem',
      color: '#6b7280',
      marginBottom: '1.5rem',
      lineHeight: '1.5',
    },
    inputGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      fontSize: '0.9rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
      color: '#374151',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '1rem',
      boxSizing: 'border-box',
      transition: 'border-color 0.3s ease',
    },
    modalActions: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'flex-end',
    },
    cancelButton: {
      padding: '0.75rem 1.5rem',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: 'white',
      color: '#6b7280',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    sendButton: {
      padding: '0.75rem 1.5rem',
      border: 'none',
      borderRadius: '8px',
      backgroundColor: '#059669',
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    successMessage: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      marginTop: '1rem',
      textAlign: 'center',
      fontWeight: '600',
    },
    reportPreview: {
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem',
      textAlign: 'left',
      maxHeight: '400px',
      overflow: 'auto',
      display: 'none', // Hidden for now
    },
    previewTitle: {
      fontSize: '1.2rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#374151',
      textAlign: 'center',
    },
    reportContent: {
      fontSize: '0.9rem',
      lineHeight: '1.6',
      color: '#374151',
    },
    completionBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      backgroundColor: '#059669',
      color: 'white',
      padding: '0.75rem 1.5rem',
      borderRadius: '25px',
      fontSize: '1rem',
      fontWeight: '600',
      marginBottom: '1rem',
    },
  };

  if (!workflowData.finalReport) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>⚠️ Report Not Generated</h2>
        <p style={styles.description}>
          Please complete the previous steps to generate your final report.
        </p>
      </div>
    );
  }

  const report = workflowData.finalReport;

  return (
    <>
      <style>
        {`
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
              transform: translate3d(0, 0, 0);
            }
            40%, 43% {
              transform: translate3d(0, -20px, 0);
            }
            70% {
              transform: translate3d(0, -10px, 0);
            }
            90% {
              transform: translate3d(0, -4px, 0);
            }
          }
          
          .download-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px 0 rgba(5, 150, 105, 0.4);
          }
          
          .download-csv-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px 0 rgba(245, 158, 11, 0.4);
          }
          
          .share-email-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px 0 rgba(59, 130, 246, 0.4);
          }
          
          .share-sms-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px 0 rgba(139, 92, 246, 0.4);
          }
          
          .modal-input:focus {
            outline: none;
            border-color: #059669;
          }
          
          .cancel-button:hover {
            background-color: #f9fafb;
            border-color: #d1d5db;
          }
          
          .send-button:hover {
            background-color: #047857;
          }
        `}
      </style>
      
      <div style={styles.container}>
        <h2 style={styles.title}>
          Inventory Complete!
        </h2>
        
        <p style={styles.description}>
          Your inventory has been completed. Review the summary and download your final report.
        </p>

        {/* Report Summary */}
        <div style={styles.reportSummary}>
          <h3 style={styles.summaryTitle}>Report Summary</h3>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <span><strong>Report ID:</strong></span>
              <span>{report.id}</span>
            </div>
            <div style={styles.summaryItem}>
              <span><strong>Created Date:</strong></span>
              <span>{new Date(report.timestamp).toLocaleDateString()}</span>
            </div>
            <div style={styles.summaryItem}>
              <span><strong>Objects Verified:</strong></span>
              <span>{report.summary.totalVerified}</span>
            </div>
            <div style={styles.summaryItem}>
              <span><strong>Signature Type:</strong></span>
              <span style={{ textTransform: 'capitalize' }}>{report.signature.type}</span>
            </div>
          </div>
        </div>

        {/* Download and Share Actions */}
        <div style={styles.actionsContainer}>
          <button
            onClick={downloadPDF}
            style={{ ...styles.actionButton, ...styles.downloadButton }}
            className="download-button"
          >
            📄 Download Report
          </button>
          
          <button
            onClick={downloadCSV}
            style={{ ...styles.actionButton, ...styles.downloadCSVButton }}
            className="download-csv-button"
          >
            📊 Export CSV
          </button>
          
          <button
            onClick={() => setShowEmailModal(true)}
            style={{ ...styles.actionButton, ...styles.shareEmailButton }}
            className="share-email-button"
          >
            📧 Share via Email
          </button>
          
          <button
            onClick={() => setShowSMSModal(true)}
            style={{ ...styles.actionButton, ...styles.shareSMSButton }}
            className="share-sms-button"
          >
            💬 Share via SMS
          </button>
          
          <button
            onClick={resetWorkflow}
            style={{ ...styles.actionButton, ...styles.restartButton }}
          >
            🔄 Start New Analysis
          </button>
        </div>

        {/* Email Modal */}
        {showEmailModal && (
          <div style={styles.modalOverlay} onClick={() => setShowEmailModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.modalTitle}>📧 Share Report via Email</h3>
              <p style={styles.modalDescription}>
                Enter the recipient's email address. Your default email client will open with a pre-filled message containing the report summary.
              </p>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="recipient@example.com"
                  style={styles.input}
                  className="modal-input"
                />
              </div>
              
              {shareMessage && (
                <div style={styles.successMessage}>
                  {shareMessage}
                </div>
              )}
              
              <div style={styles.modalActions}>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailAddress('');
                    setShareMessage('');
                  }}
                  style={styles.cancelButton}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={shareViaEmail}
                  disabled={!emailAddress}
                  style={{
                    ...styles.sendButton,
                    opacity: !emailAddress ? 0.5 : 1,
                    cursor: !emailAddress ? 'not-allowed' : 'pointer'
                  }}
                  className="send-button"
                >
                  Send Email
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SMS Modal */}
        {showSMSModal && (
          <div style={styles.modalOverlay} onClick={() => setShowSMSModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.modalTitle}>💬 Share Report via SMS</h3>
              <p style={styles.modalDescription}>
                Enter the recipient's phone number. Your SMS app will open with a pre-filled message containing a brief report summary.
              </p>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 234 567 8900"
                  style={styles.input}
                  className="modal-input"
                />
              </div>
              
              {shareMessage && (
                <div style={styles.successMessage}>
                  {shareMessage}
                </div>
              )}
              
              <div style={styles.modalActions}>
                <button
                  onClick={() => {
                    setShowSMSModal(false);
                    setPhoneNumber('');
                    setShareMessage('');
                  }}
                  style={styles.cancelButton}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={shareViaSMS}
                  disabled={!phoneNumber}
                  style={{
                    ...styles.sendButton,
                    opacity: !phoneNumber ? 0.5 : 1,
                    cursor: !phoneNumber ? 'not-allowed' : 'pointer'
                  }}
                  className="send-button"
                >
                  Send SMS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Preview */}
        <div style={styles.reportPreview}>
          <h4 style={styles.previewTitle}>📋 Report Preview</h4>
          <div style={styles.reportContent}>
            <p><strong>Report ID:</strong> {report.id}</p>
            <p><strong>Analysis Date:</strong> {new Date(report.timestamp).toLocaleString()}</p>
            <p><strong>Original Image:</strong> {report.analysis.originalImage}</p>
            <p><strong>Objects Detected:</strong> {report.analysis.totalObjectsDetected}</p>
            <p><strong>Objects Included in Report:</strong> {report.analysis.objectsIncluded}</p>
            <p><strong>Objects Verified:</strong> {report.summary.totalVerified}</p>
            
            <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
            
            <p><strong>Condition Breakdown:</strong></p>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
              <li>Excellent: {report.summary.conditionBreakdown.excellent}</li>
              <li>Good: {report.summary.conditionBreakdown.good}</li>
              <li>Fair: {report.summary.conditionBreakdown.fair}</li>
              <li>Poor: {report.summary.conditionBreakdown.poor}</li>
              <li>Damaged: {report.summary.conditionBreakdown.damaged}</li>
            </ul>
            
            <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
            
            <p><strong>Signed by:</strong> {report.signature.data}</p>
            <p><strong>Signature Date:</strong> {new Date(report.signature.timestamp).toLocaleString()}</p>
            
            {report.analysis.demoMode && (
              <div style={{
                backgroundColor: '#fef3c7',
                color: '#92400e',
                padding: '0.75rem',
                borderRadius: '6px',
                marginTop: '1rem',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                ⚠️ This report was generated in demo mode
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CompleteStage;
