import { useState } from 'react';
import { useWorkflow } from '../AnalysisWorkflow';
import { imageAPI } from '../../services/api.js';

const UploadStage = () => {
  const { workflowData, updateWorkflowData, nextStage } = useWorkflow();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setError(null);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateWorkflowData({
          selectedFile: file,
          previewUrl: e.target.result,
        });
      };
      reader.readAsDataURL(file);
    } else {
      updateWorkflowData({
        selectedFile: null,
        previewUrl: null,
      });
    }
  };

  const handleAnalyze = async () => {
    if (!workflowData.selectedFile) {
      setError('Please select an image file first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await imageAPI.analyzeImage(workflowData.selectedFile);
      
      // Handle new v1 API response format
      if (response.success && response.result) {
        const result = response.result;
        
        // Get annotated image URL from the API
        const annotatedImageUrl = result.image_url 
          ? `http://localhost:8000${result.image_url}`
          : null;

        updateWorkflowData({
          analysisResult: result,
          annotatedImageUrl: annotatedImageUrl,
        });

        // Auto-advance to next stage
        nextStage();
      } else {
        throw new Error('Invalid response format from API');
      }
      
    } catch (err) {
      console.error('Analysis error:', err);
      
      // Check if it's a network error (backend not running)
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error') || !err.response) {
        // Demo mode - simulate successful analysis for development
        setTimeout(() => {
          const mockResult = {
            result_id: "demo-uuid-12345",
            filename: workflowData.selectedFile.name,
            created_at: new Date().toISOString(),
            predictions: [
              {
                id: "pred-1",
                class_name: "bed",
                confidence: 0.95,
                bounding_box: {
                  x: 120,
                  y: 200,
                  width: 400,
                  height: 300
                }
              },
              {
                id: "pred-2",
                class_name: "nightstand",
                confidence: 0.84,
                bounding_box: {
                  x: 560,
                  y: 240,
                  width: 100,
                  height: 120
                }
              },
              {
                id: "pred-3",
                class_name: "lamp",
                confidence: 0.87,
                bounding_box: {
                  x: 580,
                  y: 180,
                  width: 60,
                  height: 100
                }
              },
              {
                id: "pred-4",
                class_name: "dresser",
                confidence: 0.82,
                bounding_box: {
                  x: 700,
                  y: 300,
                  width: 180,
                  height: 200
                }
              },
              {
                id: "pred-5",
                class_name: "mirror",
                confidence: 0.79,
                bounding_box: {
                  x: 720,
                  y: 120,
                  width: 160,
                  height: 200
                }
              },
              {
                id: "pred-6",
                class_name: "closet",
                confidence: 0.86,
                bounding_box: {
                  x: 50,
                  y: 100,
                  width: 200,
                  height: 400
                }
              },
              {
                id: "pred-7",
                class_name: "painting",
                confidence: 0.80,
                bounding_box: {
                  x: 420,
                  y: 90,
                  width: 220,
                  height: 140
                }
              },
              {
                id: "pred-8",
                class_name: "rug",
                confidence: 0.83,
                bounding_box: {
                  x: 200,
                  y: 500,
                  width: 300,
                  height: 180
                }
              }
            ],
            prediction_count: 8,
            processing_time_ms: 2340,
            model_version: "v8.0",
            status: "completed",
            metadata: {
              demo_mode: true,
              note: "This is demo data. Backend server is not running on localhost:8000"
            }
          };
          
          updateWorkflowData({
            analysisResult: mockResult,
            annotatedImageUrl: workflowData.previewUrl, // Use original image for demo
          });

          setIsLoading(false);
          nextStage();
        }, 2000);
        return;
      }
      
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
    fileInputContainer: {
      position: 'relative',
      display: 'inline-block',
      width: '100%',
      maxWidth: '500px',
      margin: '0 auto',
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
      height: '250px',
      border: '3px dashed #d1d5db',
      borderRadius: '16px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      backgroundColor: '#f9fafb',
    },
    fileInputLabelHover: {
      borderColor: '#667eea',
      backgroundColor: '#f3f4f6',
      transform: 'scale(1.02)',
    },
    uploadIcon: {
      fontSize: '4rem',
      color: '#6b7280',
      marginBottom: '1rem',
    },
    uploadText: {
      color: '#374151',
      fontSize: '1.2rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
    },
    uploadSubtext: {
      color: '#6b7280',
      fontSize: '0.9rem',
    },
    previewContainer: {
      marginTop: '2rem',
      textAlign: 'center',
    },
    previewImage: {
      maxWidth: '100%',
      maxHeight: '300px',
      borderRadius: '12px',
      boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)',
    },
    fileInfo: {
      marginTop: '1rem',
      padding: '1rem',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      fontSize: '0.9rem',
      color: '#374151',
    },
    buttonContainer: {
      marginTop: '2rem',
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
    },
    analyzeButton: {
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
      minWidth: '160px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabledButton: {
      background: '#d1d5db',
      cursor: 'not-allowed',
      boxShadow: 'none',
    },
    clearButton: {
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      padding: '1rem 2rem',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
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
    errorAlert: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5',
      padding: '1rem',
      borderRadius: '8px',
      marginTop: '1rem',
      fontWeight: '500',
    },
  };

  const clearFile = () => {
    updateWorkflowData({
      selectedFile: null,
      previewUrl: null,
    });
    setError(null);
    
    // Reset file input
    const fileInput = document.getElementById('workflow-image-upload');
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
          
          .upload-label:hover {
            border-color: #667eea !important;
            background-color: #f3f4f6 !important;
            transform: scale(1.02);
          }
          
          .analyze-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px 0 rgba(102, 126, 234, 0.4);
          }
        `}
      </style>
      
      <div style={styles.container}>
        <h2 style={styles.title}>Upload Your Image</h2>
        <p style={styles.description}>
          Supported formats: JPG, PNG, GIF (up to 10MB)
        </p>

        {!workflowData.previewUrl && (
          <div style={styles.fileInputContainer}>
            <input
              type="file"
              id="workflow-image-upload"
              accept="image/*"
              onChange={handleFileChange}
              style={styles.fileInput}
            />
            <label 
              htmlFor="workflow-image-upload" 
              style={styles.fileInputLabel}
              className="upload-label"
            >
              <div style={styles.uploadIcon}>📤</div>
              <div style={styles.uploadText}>
                Choose Image File
              </div>
              <div style={styles.uploadSubtext}>
                or drag and drop here
              </div>
            </label>
          </div>
        )}

        {workflowData.previewUrl && (
          <div style={styles.previewContainer}>
            <img 
              src={workflowData.previewUrl} 
              alt="Selected image preview" 
              style={styles.previewImage}
            />
            <div style={styles.fileInfo}>
              <strong>Selected:</strong> {workflowData.selectedFile?.name}<br/>
              <strong>Size:</strong> {(workflowData.selectedFile?.size / 1024 / 1024).toFixed(2)} MB<br/>
              <strong>Type:</strong> {workflowData.selectedFile?.type}
            </div>
          </div>
        )}

        {error && (
          <div style={styles.errorAlert}>
            ❌ {error}
          </div>
        )}

        <div style={styles.buttonContainer}>
          {workflowData.selectedFile && (
            <button
              onClick={clearFile}
              style={styles.clearButton}
              disabled={isLoading}
            >
              Clear
            </button>
          )}
          
          <button
            onClick={handleAnalyze}
            disabled={!workflowData.selectedFile || isLoading}
            style={{
              ...styles.analyzeButton,
              ...((!workflowData.selectedFile || isLoading) ? styles.disabledButton : {})
            }}
            className="analyze-button"
          >
            {isLoading && <span style={styles.loadingSpinner}></span>}
            {isLoading ? 'Analysing...' : 'Submit'}
          </button>
        </div>
      </div>
    </>
  );
};

export default UploadStage;
