import AnalysisWorkflow from './components/AnalysisWorkflow.jsx'

function App() {
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
    },
  }

  return (
    <div style={styles.container}>
      <AnalysisWorkflow />
    </div>
  )
}

export default App
