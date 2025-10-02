import { useState, useEffect } from 'react';
import { useWorkflow } from '../AnalysisWorkflow';

// Handling codes
const handlingCodes = [
  { value: 'PBO', label: 'Packed by Owner (Owner\'s Risk)' },
  { value: 'PBR', label: 'Packed by Removalist' },
  { value: 'DBO', label: 'Dismantled by Owner' },
  { value: 'LP', label: 'Left Packed' },
  { value: 'B&W', label: 'Black & White TV' },
  { value: 'UR', label: 'Unpacked by Removalist' },
  { value: 'C', label: 'Colour' },
];

// Damage codes
const damageCodes = [
  { value: 'BE', label: 'Bent' },
  { value: 'BW', label: 'Badly Worn' },
  { value: 'BR', label: 'Broken' },
  { value: 'BU', label: 'Burned' },
  { value: 'CH', label: 'Chipped' },
  { value: 'CR', label: 'Cracked' },
  { value: 'CU', label: 'Condition Unknown' },
  { value: 'D', label: 'Dented' },
  { value: 'F', label: 'Faded' },
  { value: 'G', label: 'Gouged Deeply Dented' },
  { value: 'L', label: 'Loose' },
  { value: 'ME', label: 'Moth Eaten' },
  { value: 'MG', label: 'Missing' },
  { value: 'ML', label: 'Mildew' },
  { value: 'NS', label: 'Not Signed' },
  { value: 'RI', label: 'Ripped' },
  { value: 'R', label: 'Rubbed' },
  { value: 'RU', label: 'Rusted' },
  { value: 'ST', label: 'Stained' },
  { value: 'SC', label: 'Scratched' },
  { value: 'SS', label: 'Surface Scratched' },
  { value: 'SO', label: 'Soiled/Dirty' },
  { value: 'T', label: 'Torn' },
  { value: 'WE', label: 'Worm Eaten' },
  { value: 'WD', label: 'Water Damaged' },
  { value: '√', label: 'Same (as Previous)' },
];

// Damage locations
const damageLocations = [
  { value: '1', label: 'Bottom' },
  { value: '2', label: 'Corner' },
  { value: '3', label: 'Front' },
  { value: '4', label: 'Left' },
  { value: '5', label: 'Rear' },
  { value: '6', label: 'Right' },
  { value: '7', label: 'Side' },
  { value: '8', label: 'Top' },
  { value: '9', label: 'Leg' },
  { value: '10', label: 'From' },
  { value: '11', label: 'Arm' },
  { value: '12', label: 'Edge' },
  { value: '13', label: 'Veneer' },
  { value: '14', label: 'Inside' },
];

const ReviewObjectsStage = () => {
  const { workflowData, updateWorkflowData, prevStage, nextStage } = useWorkflow();
  const [reviewedObjects, setReviewedObjects] = useState([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    class: '',
    quantity: 1,
    handlingCode: '',
    comments: '',
  });

  useEffect(() => {
    // Initialize reviewed objects from modified list (Step 2) if available, otherwise from raw predictions
    if (reviewedObjects.length === 0) {
      // Check if we have a modified object list from Step 2
      if (workflowData.modifiedObjectList && workflowData.modifiedObjectList.length > 0) {
        // Use the modified list from Step 2 (includes quantity changes and manual additions)
        const initialObjects = workflowData.modifiedObjectList.map((item, index) => ({
          id: index + 1,
          class: item.name,
          confidence: item.confidence / 100, // Convert from percentage back to decimal
          bbox: null, // Bounding box info not needed in Step 3
          condition: 'Good',
          comments: '',
          verified: false,
          exclude: false,
          handlingCode: '',
          damageType: '',
          damageLocation: '',
          manualEntry: item.isManual || false,
        }));
        setReviewedObjects(initialObjects);
        updateWorkflowData({ reviewedObjects: initialObjects });
      } else {
        // Fallback: Use raw predictions from analysis result
        const predictions = workflowData.analysisResult?.predictions || workflowData.analysisResult?.detections;
        
        if (predictions) {
          const initialObjects = predictions.map((item, index) => ({
            id: item.id || index + 1,
            class: item.class_name || item.class,
            confidence: item.confidence,
            bbox: item.bounding_box || item.bbox,
            condition: 'Good',
            comments: '',
            verified: false,
            exclude: false,
            handlingCode: '',
            damageType: '',
            damageLocation: '',
          }));
          setReviewedObjects(initialObjects);
          updateWorkflowData({ reviewedObjects: initialObjects });
        }
      }
    }
  }, [workflowData.modifiedObjectList, workflowData.analysisResult, reviewedObjects.length, updateWorkflowData]);

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

  const addNewItem = () => {
    if (!newItem.class.trim()) return;

    // Generate new ID based on existing objects
    const maxId = reviewedObjects.length > 0 
      ? Math.max(...reviewedObjects.map(obj => obj.id))
      : 0;

    const itemsToAdd = [];
    for (let i = 0; i < newItem.quantity; i++) {
      const newObj = {
        id: maxId + i + 1,
        class: newItem.class.trim(),
        confidence: 1.0, // Manual entry = 100% confidence
        bbox: null, // No bounding box for manual entries
        condition: 'Good',
        comments: newItem.comments,
        verified: true, // Manually added items are pre-verified
        exclude: false,
        handlingCode: newItem.handlingCode,
        damageType: '',
        damageLocation: '',
        manualEntry: true, // Flag to indicate manual entry
      };
      itemsToAdd.push(newObj);
    }

    const updated = [...reviewedObjects, ...itemsToAdd];
    setReviewedObjects(updated);
    updateWorkflowData({ reviewedObjects: updated });

    // Reset form and close modal
    setNewItem({ class: '', quantity: 1, handlingCode: '', comments: '' });
    setShowAddItemModal(false);
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
    cardHeaderLeft: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
    },
    cardHeaderRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
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
    iconButton: {
      padding: '0.25rem',
      border: 'none',
      borderRadius: '50%',
      cursor: 'pointer',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '2rem',
      height: '2rem',
      transition: 'all 0.2s ease',
    },
    verifyIconButton: {
      backgroundColor: '#22c55e',
      color: 'white',
    },
    unverifyIconButton: {
      backgroundColor: '#6b7280',
      color: 'white',
    },
    excludeIconButton: {
      backgroundColor: '#ef4444',
      color: 'white',
    },
    includeIconButton: {
      backgroundColor: '#6b7280',
      color: 'white',
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
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      marginTop: '2rem',
      flexWrap: 'wrap',
    },
    navButton: {
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
    backButton: {
      backgroundColor: '#6b7280',
      color: 'white',
      boxShadow: '0 4px 15px 0 rgba(107, 114, 128, 0.3)',
    },
    continueButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      boxShadow: '0 4px 15px 0 rgba(102, 126, 234, 0.3)',
    },
    addItemButton: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      boxShadow: '0 4px 15px 0 rgba(16, 185, 129, 0.3)',
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
      maxHeight: '80vh',
      overflow: 'auto',
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
      marginTop: '2rem',
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
    submitButton: {
      padding: '0.75rem 1.5rem',
      border: 'none',
      borderRadius: '8px',
      backgroundColor: '#10b981',
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    manualEntryBadge: {
      fontSize: '0.7rem',
      backgroundColor: '#10b981',
      color: 'white',
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      fontWeight: '600',
      textTransform: 'uppercase',
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
        Add conditions, comments, and verify or exclude objects as needed.
      </p>

      {/* Add Item Button */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setShowAddItemModal(true)}
          style={{
            ...styles.navButton,
            ...styles.addItemButton
          }}
        >
          ➕ Add Item Manually
        </button>
      </div>

      {/* Summary Bar */}
      <div style={styles.summaryBar}>
        <div style={styles.summaryItem}>
          <div style={styles.summaryNumber}>{stats.pending}</div>
          <div style={styles.summaryLabel}>Pending Review</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryNumber}>{stats.verified}</div>
          <div style={styles.summaryLabel}>Verified</div>
        </div>
        <div style={styles.summaryItem}>
          <div style={styles.summaryNumber}>{stats.excluded}</div>
          <div style={styles.summaryLabel}>Excluded</div>
        </div>
      </div>

      {/* Object Cards */}
      <div style={styles.objectGrid}>
        {reviewedObjects.map((obj) => (
          <div key={obj.id} style={getCardStyle(obj)}>
            {/* Card Header */}
            <div style={styles.cardHeader}>
              <div style={styles.cardHeaderLeft}>
                <div style={styles.objectClass}>
                  {obj.class}
                </div>
                {obj.manualEntry && (
                  <div style={styles.manualEntryBadge}>
                    Manual Entry
                  </div>
                )}
              </div>
              <div style={styles.cardHeaderRight}>
                <div style={getConfidenceStyle(obj.confidence)}>
                  {Math.round(obj.confidence * 100)}%
                </div>
                
                <button
                  onClick={() => toggleVerified(obj.id)}
                  style={{
                    ...styles.iconButton,
                    ...(obj.verified ? styles.verifyIconButton : styles.unverifyIconButton)
                  }}
                  disabled={obj.exclude}
                  title={obj.verified ? 'Unverify' : 'Verify'}
                >
                  {obj.verified ? '✓' : '?'}
                </button>
                
                <button
                  onClick={() => toggleExclude(obj.id)}
                  style={{
                    ...styles.iconButton,
                    ...(obj.exclude ? styles.includeIconButton : styles.excludeIconButton)
                  }}
                  title={obj.exclude ? 'Include' : 'Exclude'}
                >
                  {obj.exclude ? '↻' : '×'}
                </button>
              </div>
            </div>

            {/* Card Content - Hidden when excluded for collapsed view */}
            {!obj.exclude && (
              <div style={styles.cardContent}>
                {/* Handling Code */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Handling Code:</label>
                  <select
                    value={obj.handlingCode}
                    onChange={(e) => updateObject(obj.id, { handlingCode: e.target.value })}
                    style={styles.select}
                    disabled={obj.exclude}
                  >
                    <option value="">Select Handling Code</option>
                    {handlingCodes.map((code) => (
                      <option key={code.value} value={code.value}>
                        {code.value} - {code.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Comments */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Comments:</label>
                  <textarea
                    value={obj.comments}
                    onChange={(e) => updateObject(obj.id, { comments: e.target.value })}
                    placeholder="Add additional notes"
                    style={styles.textarea}
                    disabled={obj.exclude}
                  />
                </div>

                {/* Report Damage Button - Only shown when no damage is reported */}
                {!obj.damageType && (
                  <div style={styles.formGroup}>
                    <button
                      onClick={() => {
                        // Set a default damage type to show dropdown
                        updateObject(obj.id, { damageType: 'BE' });
                      }}
                      style={{
                        ...styles.actionButton,
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        width: '100%'
                      }}
                      disabled={obj.exclude}
                    >
                      Report Damage
                    </button>
                  </div>
                )}

                {/* Damage Type Dropdown - Only shown if damage reporting is active */}
                {obj.damageType && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Damage Type:</label>
                    <select
                      value={obj.damageType}
                      onChange={(e) => updateObject(obj.id, { damageType: e.target.value, damageLocation: '' })}
                      style={styles.select}
                      disabled={obj.exclude}
                    >
                      {damageCodes.map((code) => (
                        <option key={code.value} value={code.value}>
                          {code.value} - {code.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Damage Location Dropdown - Only shown if damage type is selected */}
                {obj.damageType && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Damage Location:</label>
                    <select
                      value={obj.damageLocation}
                      onChange={(e) => updateObject(obj.id, { damageLocation: e.target.value })}
                      style={styles.select}
                      disabled={obj.exclude}
                    >
                      <option value="">Select Location</option>
                      {damageLocations.map((location) => (
                        <option key={location.value} value={location.value}>
                          {location.value} - {location.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Remove Damage Report Button - Only shown when damage is reported */}
                {obj.damageType && (
                  <div style={styles.formGroup}>
                    <button
                      onClick={() => {
                        // Clear damage reporting
                        updateObject(obj.id, { damageType: '', damageLocation: '' });
                      }}
                      style={{
                        ...styles.actionButton,
                        backgroundColor: '#ef4444',
                        color: 'white',
                        width: '100%'
                      }}
                      disabled={obj.exclude}
                    >
                      Remove Damage Report
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Excluded Message - Only shown when excluded */}
            {obj.exclude && (
              <div style={{
                textAlign: 'center',
                padding: '1rem',
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                Item has been excluded from the report
              </div>
            )}

            {/* Card Actions - Hidden for now but preserved */}
            <div style={{...styles.cardActions, display: 'none'}}>
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

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddItemModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>➕ Add New Item</h3>
            <p style={styles.modalDescription}>
              Manually add an item to your inventory. Enter the item details below.
            </p>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Item Name *</label>
              <input
                type="text"
                value={newItem.class}
                onChange={(e) => setNewItem({ ...newItem, class: e.target.value })}
                placeholder="e.g., Dining Chair, Bookshelf, etc."
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Quantity</label>
              <input
                type="number"
                min="1"
                max="100"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Handling Code</label>
              <select
                value={newItem.handlingCode}
                onChange={(e) => setNewItem({ ...newItem, handlingCode: e.target.value })}
                style={styles.select}
              >
                <option value="">Select Handling Code (Optional)</option>
                {handlingCodes.map((code) => (
                  <option key={code.value} value={code.value}>
                    {code.value} - {code.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Comments</label>
              <textarea
                value={newItem.comments}
                onChange={(e) => setNewItem({ ...newItem, comments: e.target.value })}
                placeholder="Add any additional notes about this item"
                style={styles.textarea}
              />
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={() => {
                  setShowAddItemModal(false);
                  setNewItem({ class: '', quantity: 1, handlingCode: '', comments: '' });
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={addNewItem}
                disabled={!newItem.class.trim()}
                style={{
                  ...styles.submitButton,
                  opacity: !newItem.class.trim() ? 0.5 : 1,
                  cursor: !newItem.class.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                Add Item{newItem.quantity > 1 ? `s (${newItem.quantity})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={styles.buttonContainer}>
        <button
          onClick={prevStage}
          style={{
            ...styles.navButton,
            ...styles.backButton
          }}
        >
          ← Back
        </button>
        
        <button
          onClick={nextStage}
          style={{
            ...styles.navButton,
            ...styles.continueButton
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
};

export default ReviewObjectsStage;
