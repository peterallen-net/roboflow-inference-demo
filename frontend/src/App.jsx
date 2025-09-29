import { useState } from 'react'
import ImageUpload from './components/ImageUpload.jsx'

function App() {
  const [showDemo, setShowDemo] = useState(false)

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
    },
    header: {
      backgroundColor: 'white',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      marginBottom: '2rem',
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1.5rem 1rem',
      textAlign: 'center',
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      background: 'linear-gradient(to right, #2563eb, #9333ea)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '0.5rem',
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '1.1rem',
    },
    nav: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      marginTop: '1.5rem',
    },
    navButton: {
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.2s',
    },
    activeButton: {
      backgroundColor: '#2563eb',
      color: 'white',
    },
    inactiveButton: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
    },
    demoContainer: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem 1rem',
    },
    demoCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      textAlign: 'center',
    },
    demoTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#374151',
    },
    demoDescription: {
      color: '#6b7280',
      marginBottom: '2rem',
      lineHeight: '1.6',
    },
    counter: {
      fontSize: '3rem',
      fontWeight: 'bold',
      color: '#2563eb',
      marginBottom: '1rem',
    },
    button: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
  }

  const [count, setCount] = useState(0)

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Roboflow AI Analysis</h1>
          <p style={styles.subtitle}>
            Upload images for AI-powered object detection and analysis
          </p>
          
          <nav style={styles.nav}>
            <button
              onClick={() => setShowDemo(false)}
              style={{
                ...styles.navButton,
                ...(showDemo ? styles.inactiveButton : styles.activeButton)
              }}
            >
              Image Analysis
            </button>
            <button
              onClick={() => setShowDemo(true)}
              style={{
                ...styles.navButton,
                ...(showDemo ? styles.activeButton : styles.inactiveButton)
              }}
            >
              Demo Counter
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      {!showDemo ? (
        <ImageUpload />
      ) : (
        <div style={styles.demoContainer}>
          <div style={styles.demoCard}>
            <h2 style={styles.demoTitle}>Interactive Demo</h2>
            <p style={styles.demoDescription}>
              This is a simple counter to test React functionality while the AI analysis features are being developed.
            </p>
            
            <div style={styles.counter}>{count}</div>
            
            <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
              <button
                onClick={() => setCount(count + 1)}
                style={styles.button}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                Increment
              </button>
              <button
                onClick={() => setCount(0)}
                style={{
                  ...styles.button,
                  background: '#6b7280'
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
