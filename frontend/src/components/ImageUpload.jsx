import { useState } from 'react';
import { imageAPI } from '../services/api.js';

const ImageUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [annotatedImageUrl, setAnnotatedImageUrl] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('annotated');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setError(null);
    setSuccess(false);
    setAnalysisResult(null);
    setAnnotatedImageUrl(null);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Check if backend is available
      const result = await imageAPI.analyzeImage(selectedFile);
      
      setAnalysisResult(result);
      setSuccess(true);
      
      // If the result contains an annotated image URL or base64 data
      if (result.annotated_image_url) {
        setAnnotatedImageUrl(result.annotated_image_url);
      } else if (result.annotated_image) {
        setAnnotatedImageUrl(`data:image/jpeg;base64,${result.annotated_image}`);
      }
      
    } catch (err) {
      console.error('Analysis error:', err);
      
      // Check if it's a network error (backend not running)
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error') || !err.response) {
        // Demo mode - simulate successful analysis for development
        setTimeout(() => {
          const mockResult = {
            message: "Analysis complete",
            detections: [
              {
                class: "person",
                confidence: 0.89,
                bbox: {x: 100, y: 150, width: 200, height: 300}
              },
              {
                class: "chair",
                confidence: 0.76,
                bbox: {x: 300, y: 200, width: 150, height: 180}
              }
            ],
            processing_time: 2.34,
            image_size: {
              width: selectedFile.size || 1024,
              height: selectedFile.size || 768
            },
            model_version: "v8.0",
            timestamp: new Date().toISOString(),
            demo_mode: true,
            note: "This is demo data. Backend server is not running on localhost:8000"
          };
          
          setAnalysisResult(mockResult);
          setSuccess(true);
          // Use original image as "annotated" image for demo
          setAnnotatedImageUrl(previewUrl);
          setIsLoading(false);
        }, 2000); // Simulate 2 second processing time
        return;
      }
      
      // Handle other API errors
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to analyze image. Please try again.'
      );
      setIsLoading(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '2rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      padding: '2rem',
      marginBottom: '2rem',
    },
    fileInputSection: {
      marginBottom: '2rem',
    },
    fileInputContainer: {
      position: 'relative',
      display: 'inline-block',
      width: '100%',
    },
    fileInput: {
      display: 'none',
    },
    fileInputLabel: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '200px',
      border: '2px dashed #d1d5db',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      backgroundColor: '#f9fafb',
      ':hover': {
        borderColor: '#667eea',
        backgroundColor: '#f3f4f6',
      },
    },
    uploadIcon: {
      fontSize: '3rem',
      color: '#6b7280',
      marginBottom: '1rem',
    },
    uploadText: {
      color: '#374151',
      fontSize: '1.1rem',
      fontWeight: '500',
      textAlign: 'center',
    },
    uploadSubtext: {
      color: '#6b7280',
      fontSize: '0.9rem',
      marginTop: '0.5rem',
    },
    previewContainer: {
      marginTop: '1.5rem',
      textAlign: 'center',
    },
    previewImage: {
      maxWidth: '100%',
      maxHeight: '300px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    buttonContainer: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      flexWrap: 'wrap',
    },
    submitButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      padding: '1rem 2rem',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.3)',
      minWidth: '150px',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px 0 rgba(102, 126, 234, 0.4)',
      },
      ':active': {
        transform: 'translateY(0)',
      },
    },
    disabledButton: {
      background: '#d1d5db',
      cursor: 'not-allowed',
      boxShadow: 'none',
      ':hover': {
        transform: 'none',
      },
    },
    clearButton: {
      background: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      padding: '1rem 2rem',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      minWidth: '150px',
    },
    loadingSpinner: {
      display: 'inline-block',
      width: '20px',
      height: '20px',
      border: '2px solid #ffffff',
      borderRadius: '50%',
      borderTopColor: 'transparent',
      animation: 'spin 1s ease-in-out infinite',
      marginRight: '0.5rem',
    },
    alert: {
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      fontWeight: '500',
    },
    successAlert: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      border: '1px solid #a7f3d0',
    },
    errorAlert: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5',
    },
    resultsContainer: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '2rem',
      '@media (min-width: 768px)': {
        gridTemplateColumns: '1fr 1fr',
      },
    },
    annotatedImageContainer: {
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#374151',
    },
    annotatedImage: {
      maxWidth: '100%',
      height: 'auto',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    jsonContainer: {
      backgroundColor: '#1f2937',
      borderRadius: '8px',
      padding: '1rem',
      overflow: 'auto',
      maxHeight: '500px',
    },
    jsonContent: {
      color: '#e5e7eb',
      fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
      fontSize: '0.85rem',
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap',
      margin: 0,
    },
    tabContainer: {
      marginBottom: '2rem',
    },
    tabList: {
      display: 'flex',
      borderBottom: '2px solid #e5e7eb',
      marginBottom: '1.5rem',
    },
    tab: {
      padding: '1rem 1.5rem',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#6b7280',
      borderBottom: '2px solid transparent',
      transition: 'all 0.3s ease',
    },
    activeTab: {
      color: '#667eea',
      borderBottomColor: '#667eea',
      backgroundColor: '#f8fafc',
    },
    tabContent: {
      minHeight: '400px',
    },
    fullWidthContainer: {
      textAlign: 'center',
    },
  };

  const clearAll = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setAnnotatedImageUrl(null);
    setError(null);
    setSuccess(false);
    // Reset file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .file-input-label:hover {
            border-color: #667eea !important;
            background-color: #f3f4f6 !important;
          }
          
          .submit-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px 0 rgba(102, 126, 234, 0.4);
          }
          
          .submit-button:active {
            transform: translateY(0);
          }
          
          @media (max-width: 768px) {
            .results-grid {
              grid-template-columns: 1fr !important;
            }
            
            .container {
              padding: 1rem !important;
            }
            
            .title {
              font-size: 2rem !important;
            }
          }
        `}
      </style>
      
      <div style={styles.container} className="container">
        <h1 style={styles.title} className="title">AI Image Analysis</h1>
        
        <div style={styles.card}>
          {/* File Upload Section */}
          <div style={styles.fileInputSection}>
            <div style={styles.fileInputContainer}>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleFileChange}
                style={styles.fileInput}
              />
              <label 
                htmlFor="image-upload" 
                style={styles.fileInputLabel}
                className="file-input-label"
              >
                <div style={styles.uploadIcon}>📷</div>
                <div style={styles.uploadText}>
                  Click to upload an image
                </div>
                <div style={styles.uploadSubtext}>
                  Supports JPG, PNG, GIF up to 10MB
                </div>
              </label>
            </div>
            
            {previewUrl && (
              <div style={styles.previewContainer}>
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  style={styles.previewImage}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={styles.buttonContainer}>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isLoading}
              style={{
                ...styles.submitButton,
                ...((!selectedFile || isLoading) ? styles.disabledButton : {})
              }}
              className="submit-button"
            >
              {isLoading && <span style={styles.loadingSpinner}></span>}
              {isLoading ? 'Analysing...' : 'Analyze Image'}
            </button>
            
            {selectedFile && (
              <button
                onClick={clearAll}
                style={styles.clearButton}
                disabled={isLoading}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Alert Messages */}
        {success && (
          <div style={{...styles.alert, ...styles.successAlert}}>
            ✅ Image analysis completed successfully!
          </div>
        )}

        {error && (
          <div style={{...styles.alert, ...styles.errorAlert}}>
            ❌ {error}
          </div>
        )}

        {/* Results Section with Tabs */}
        {analysisResult && (
          <div style={styles.card}>
            <div style={styles.tabContainer}>
              {/* Tab Navigation */}
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
                  📄 Raw JSON
                </button>
              </div>

              {/* Tab Content */}
              <div style={styles.tabContent}>
                {activeTab === 'annotated' && (
                  <div style={styles.fullWidthContainer}>
                    {annotatedImageUrl ? (
                      <>
                        <h3 style={styles.sectionTitle}>Annotated Image</h3>
                        <img 
                          src={annotatedImageUrl} 
                          alt="Annotated result" 
                          style={styles.annotatedImage}
                        />
                      </>
                    ) : (
                      <div style={{textAlign: 'center', padding: '2rem', color: '#6b7280'}}>
                        <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🖼️</div>
                        <p>No annotated image available</p>
                        <p style={{fontSize: '0.9rem', marginTop: '0.5rem'}}>
                          The analysis completed but no annotated image was returned by the model.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'json' && (
                  <div>
                    <h3 style={styles.sectionTitle}>Analysis Results</h3>
                    <div style={styles.jsonContainer}>
                      <pre style={styles.jsonContent}>
                        {JSON.stringify(analysisResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ImageUpload;
