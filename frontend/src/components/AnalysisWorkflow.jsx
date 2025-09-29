import { useState, createContext, useContext } from 'react';
import UploadStage from './stages/UploadStage';
import AnalysisOutputStage from './stages/AnalysisOutputStage';
import ReviewObjectsStage from './stages/ReviewObjectsStage';
import FinaliseStage from './stages/FinaliseStage';
import CompleteStage from './stages/CompleteStage';

// Create context for sharing workflow data between stages
const WorkflowContext = createContext();

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within WorkflowProvider');
  }
  return context;
};

const AnalysisWorkflow = () => {
  const [currentStage, setCurrentStage] = useState(0);
  const [workflowData, setWorkflowData] = useState({
    selectedFile: null,
    previewUrl: null,
    analysisResult: null,
    annotatedImageUrl: null,
    reviewedObjects: [],
    signature: null,
    finalReport: null,
  });

  const stages = [
    { 
      id: 'upload', 
      name: 'Upload File', 
      component: UploadStage,
      icon: '📤'
    },
    { 
      id: 'analysis', 
      name: 'Analysis Output', 
      component: AnalysisOutputStage,
      icon: '🔍'
    },
    { 
      id: 'review', 
      name: 'Review Objects', 
      component: ReviewObjectsStage,
      icon: '📝'
    },
    { 
      id: 'finalise', 
      name: 'Finalise', 
      component: FinaliseStage,
      icon: '✍️'
    },
    { 
      id: 'complete', 
      name: 'Complete', 
      component: CompleteStage,
      icon: '✅'
    },
  ];

  const updateWorkflowData = (updates) => {
    setWorkflowData(prev => ({ ...prev, ...updates }));
  };

  const nextStage = () => {
    if (currentStage < stages.length - 1) {
      setCurrentStage(currentStage + 1);
    }
  };

  const prevStage = () => {
    if (currentStage > 0) {
      setCurrentStage(currentStage - 1);
    }
  };

  const goToStage = (stageIndex) => {
    if (stageIndex >= 0 && stageIndex < stages.length) {
      setCurrentStage(stageIndex);
    }
  };

  const resetWorkflow = () => {
    setCurrentStage(0);
    setWorkflowData({
      selectedFile: null,
      previewUrl: null,
      analysisResult: null,
      annotatedImageUrl: null,
      reviewedObjects: [],
      signature: null,
      finalReport: null,
    });
  };

  const contextValue = {
    workflowData,
    updateWorkflowData,
    nextStage,
    prevStage,
    goToStage,
    resetWorkflow,
    currentStage,
    stages,
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    header: {
      textAlign: 'center',
      marginBottom: '3rem',
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    subtitle: {
      fontSize: '1.1rem',
      color: '#6b7280',
      marginBottom: '2rem',
    },
    stageContainer: {
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      padding: '2rem',
      marginBottom: '2rem',
      minHeight: '500px',
    },
    navigationContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '2rem',
      padding: '1.5rem',
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
    },
    navButton: {
      padding: '1rem 2rem',
      borderRadius: '12px',
      border: 'none',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      minWidth: '120px',
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.3)',
    },
    secondaryButton: {
      backgroundColor: '#6b7280',
      color: 'white',
    },
    disabledButton: {
      backgroundColor: '#d1d5db',
      color: '#9ca3af',
      cursor: 'not-allowed',
    },
  };

  const CurrentStageComponent = stages[currentStage].component;

  return (
    <WorkflowContext.Provider value={contextValue}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>AI Image Analysis</h1>
          <p style={styles.subtitle}>
            Complete analysis workflow from upload to final report
          </p>
        </div>

        {/* Current Stage Content */}
        <div style={styles.stageContainer}>
          <CurrentStageComponent />
        </div>

        {/* Navigation */}
        <div style={styles.navigationContainer}>
          <button
            onClick={prevStage}
            disabled={currentStage === 0}
            style={{
              ...styles.navButton,
              ...(currentStage === 0 ? styles.disabledButton : styles.secondaryButton)
            }}
          >
            ← Back
          </button>

          <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
            Step {currentStage + 1} of {stages.length}
          </div>

          <button
            onClick={nextStage}
            disabled={currentStage === stages.length - 1}
            style={{
              ...styles.navButton,
              ...(currentStage === stages.length - 1 ? styles.disabledButton : styles.primaryButton)
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </WorkflowContext.Provider>
  );
};

export default AnalysisWorkflow;
