import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
    },
    header: {
      backgroundColor: 'white',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
    },
    logo: {
      height: '4rem',
      width: '4rem',
      transition: 'all 0.2s',
      cursor: 'pointer',
    },
    logoHover: {
      transform: 'scale(1.1)',
      opacity: '0.8',
    },
    title: {
      fontSize: '3rem',
      fontWeight: 'bold',
      background: 'linear-gradient(to right, #2563eb, #9333ea)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textAlign: 'center',
    },
    main: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem',
    },
    content: {
      maxWidth: '42rem',
      margin: '0 auto',
    },
    alert: {
      marginBottom: '2rem',
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0',
      color: '#166534',
      padding: '1rem',
      borderRadius: '0.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    },
    card: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '1rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      textAlign: 'center',
    },
    cardContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
    },
    cardHeader: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    cardTitle: {
      fontSize: '1.875rem',
      fontWeight: 'bold',
      color: '#1f2937',
    },
    cardDescription: {
      color: '#6b7280',
      fontSize: '1rem',
      lineHeight: '1.6',
    },
    counterDisplay: {
      background: 'linear-gradient(to right, #3b82f6, #9333ea)',
      color: 'white',
      padding: '1.5rem',
      borderRadius: '0.75rem',
    },
    counterNumber: {
      fontSize: '3rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
    },
    counterLabel: {
      fontSize: '1rem',
      opacity: '0.9',
    },
    buttonContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    primaryButton: {
      width: '100%',
      padding: '0.75rem 1.5rem',
      fontSize: '1.125rem',
      fontWeight: '600',
      color: 'white',
      background: 'linear-gradient(to right, #06b6d4, #2563eb)',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 4px 14px 0 rgba(0, 118, 255, 0.39)',
    },
    secondaryButtons: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    },
    resetButton: {
      width: '100%',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#374151',
      backgroundColor: '#e5e7eb',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    doubleButton: {
      width: '100%',
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'white',
      backgroundColor: '#9333ea',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    devInfo: {
      backgroundColor: '#f9fafb',
      padding: '1rem',
      borderRadius: '0.5rem',
      border: '1px solid #e5e7eb',
    },
    devText: {
      fontSize: '0.875rem',
      color: '#6b7280',
      lineHeight: '1.6',
    },
    code: {
      backgroundColor: '#e5e7eb',
      color: '#1f2937',
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontFamily: 'monospace',
      fontSize: '0.75rem',
    },
    footer: {
      marginTop: '2rem',
      textAlign: 'center',
    },
    footerText: {
      color: '#6b7280',
      fontSize: '1rem',
      marginBottom: '1rem',
    },
    tags: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '0.5rem',
    },
    tag: {
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
    },
    tagBlue: {
      backgroundColor: '#dbeafe',
      color: '#1d4ed8',
    },
    tagCyan: {
      backgroundColor: '#cffafe',
      color: '#0891b2',
    },
    tagIndigo: {
      backgroundColor: '#e0e7ff',
      color: '#4338ca',
    },
    tagPurple: {
      backgroundColor: '#f3e8ff',
      color: '#7c3aed',
    },
  }

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <a 
            href="https://vite.dev" 
            target="_blank"
            style={styles.logo}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.1)'
              e.target.style.opacity = '0.8'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)'
              e.target.style.opacity = '1'
            }}
          >
            <img src={viteLogo} style={styles.logo} alt="Vite logo" />
          </a>
          <h1 style={styles.title}>Vite + React</h1>
          <a 
            href="https://react.dev" 
            target="_blank"
            style={styles.logo}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.1)'
              e.target.style.opacity = '0.8'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)'
              e.target.style.opacity = '1'
            }}
          >
            <img 
              src={reactLogo} 
              style={{...styles.logo, animation: 'spin 20s linear infinite'}} 
              alt="React logo" 
            />
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={styles.main}>
        <div style={styles.content}>
          {/* Success Alert */}
          <div style={styles.alert}>
            <div>
              <span style={{fontWeight: '500'}}>🎉 Configuration Complete!</span>
              <span style={{fontSize: '0.875rem', marginLeft: '0.5rem'}}>Modern React UI is working perfectly.</span>
            </div>
          </div>

          {/* Main Card Component */}
          <div style={styles.card}>
            <div style={styles.cardContent}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>Interactive Counter</h2>
                <p style={styles.cardDescription}>
                  Click the button below to test the interactive functionality. 
                  The counter state is managed by React hooks.
                </p>
              </div>

              {/* Counter Display */}
              <div style={styles.counterDisplay}>
                <div style={styles.counterNumber}>{count}</div>
                <div style={styles.counterLabel}>Current Count</div>
              </div>

              {/* Styled Buttons */}
              <div style={styles.buttonContainer}>
                <button 
                  onClick={() => setCount((count) => count + 1)}
                  style={styles.primaryButton}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(to right, #0891b2, #1d4ed8)'
                    e.target.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(to right, #06b6d4, #2563eb)'
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  Increment Count
                </button>

                <div style={styles.secondaryButtons}>
                  <button 
                    onClick={() => setCount(0)}
                    style={styles.resetButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#d1d5db'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                  >
                    Reset Counter
                  </button>
                  <button 
                    onClick={() => setCount(count => count * 2)}
                    style={styles.doubleButton}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#9333ea'}
                  >
                    Double Count
                  </button>
                </div>
              </div>

              {/* Development Info */}
              <div style={styles.devInfo}>
                <p style={styles.devText}>
                  Edit{' '}
                  <code style={styles.code}>src/App.jsx</code>{' '}
                  and save to test Hot Module Replacement (HMR)
                </p>
              </div>
            </div>
          </div>

          {/* Footer Information */}
          <div style={styles.footer}>
            <p style={styles.footerText}>
              Click on the Vite and React logos to learn more
            </p>
            
            <div style={styles.tags}>
              <span style={{...styles.tag, ...styles.tagBlue}}>⚡ Vite</span>
              <span style={{...styles.tag, ...styles.tagCyan}}>⚛️ React</span>
              <span style={{...styles.tag, ...styles.tagIndigo}}>🎨 Modern CSS</span>
              <span style={{...styles.tag, ...styles.tagPurple}}>🌊 Responsive</span>
            </div>
          </div>
        </div>
      </main>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @media (min-width: 640px) {
            .header-content {
              flex-direction: row !important;
              gap: 2rem !important;
            }
            .secondary-buttons {
              flex-direction: row !important;
            }
            .primary-button {
              width: auto !important;
            }
            .reset-button, .double-button {
              width: auto !important;
            }
          }
        `}
      </style>
    </div>
  )
}

export default App
