import { useState, useEffect } from 'react';
import { useUserDataStore } from '../store/useUserDataStore';

const DatePickerPopup = ({ isOpen, onClose, onSave, countryName, existingDates = [] }) => {
  const [visitDates, setVisitDates] = useState(existingDates.length > 0 ? existingDates : [{ from: '', to: '', transport: ['plane'] }]);
  const [showOverlapWarning, setShowOverlapWarning] = useState(false);
  const [overlappingDates, setOverlappingDates] = useState([]);
  
  // Get all existing visit dates from the store
  const countryVisitDates = useUserDataStore((state) => state.countryVisitDates || {});

  // Transportation mode options
  const transportModes = [
    { id: 'plane', icon: '✈️', label: 'Plane' },
    { id: 'train', icon: '🚂', label: 'Train' },
    { id: 'bus', icon: '🚌', label: 'Bus' },
    { id: 'car', icon: '🚗', label: 'Car' },
    { id: 'ferry', icon: '⛴️', label: 'Ferry' },
    { id: 'sailboat', icon: '⛵', label: 'Sailboat' }
  ];

  useEffect(() => {
    if (isOpen) {
      setVisitDates(existingDates.length > 0 ? existingDates : [{ from: '', to: '', transport: ['plane'] }]);
    }
  }, [isOpen, existingDates]);

  const handleDateChange = (index, field, value) => {
    const newDates = [...visitDates];
    newDates[index][field] = value;
    setVisitDates(newDates);
  };

  const handleTransportToggle = (index, transportId) => {
    const newDates = [...visitDates];
    const currentTransport = newDates[index].transport || [];
    
    if (currentTransport.includes(transportId)) {
      // Remove transport mode
      newDates[index].transport = currentTransport.filter(t => t !== transportId);
    } else {
      // Add transport mode
      newDates[index].transport = [...currentTransport, transportId];
    }
    
    setVisitDates(newDates);
  };

  const addDateRange = () => {
    setVisitDates([...visitDates, { from: '', to: '', transport: ['plane'] }]);
  };

  const removeDateRange = (index) => {
    if (visitDates.length > 1) {
      const newDates = visitDates.filter((_, i) => i !== index);
      setVisitDates(newDates);
    }
  };

  // Function to check for overlapping dates
  const checkForOverlaps = (newDates) => {
    const overlaps = [];
    
    // Get all existing dates from other countries
    const allExistingDates = Object.entries(countryVisitDates)
      .filter(([alpha3]) => alpha3 !== countryName) // Exclude current country
      .flatMap(([alpha3, dates]) => 
        dates.map(date => ({ ...date, country: alpha3 }))
      );
    
    newDates.forEach(newDate => {
      if (!newDate.from || !newDate.to) return;
      
      const newFrom = new Date(newDate.from);
      const newTo = new Date(newDate.to);
      
      allExistingDates.forEach(existingDate => {
        if (!existingDate.from || !existingDate.to) return;
        
        const existingFrom = new Date(existingDate.from);
        const existingTo = new Date(existingDate.to);
        
        // Check for overlap
        if (newFrom <= existingTo && newTo >= existingFrom) {
          overlaps.push({
            newDate,
            existingDate,
            overlapType: newFrom <= existingFrom && newTo >= existingTo ? 'contains' :
                        newFrom >= existingFrom && newTo <= existingTo ? 'contained' : 'overlaps'
          });
        }
      });
    });
    
    return overlaps;
  };

  const handleSave = () => {
    // Filter out empty date ranges
    const validDates = visitDates.filter(date => date.from && date.to);
    
    // Check for overlaps
    const overlaps = checkForOverlaps(validDates);
    
    if (overlaps.length > 0) {
      setOverlappingDates(overlaps);
      setShowOverlapWarning(true);
    } else {
      onSave(validDates);
      onClose();
    }
  };

  const handleProceedWithOverlaps = () => {
    const validDates = visitDates.filter(date => date.from && date.to);
    onSave(validDates);
    setShowOverlapWarning(false);
    onClose();
  };

  const handleCancelOverlaps = () => {
    setShowOverlapWarning(false);
    setOverlappingDates([]);
  };

  const handleSkip = () => {
    onSave([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="date-picker-overlay">
        <div className="date-picker-popup">
          <div className="popup-header">
            <h3>Visit Dates for {countryName}</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          
          <div className="popup-body">
            <p className="optional-note">
              <strong>Optional:</strong> Add your visit dates to help build a chronological timeline of your travels.
            </p>
            
            {visitDates.map((date, index) => (
              <div key={index} className="date-range">
                <div className="date-inputs">
                  <div className="date-input-group">
                    <label>From:</label>
                    <input
                      type="date"
                      value={date.from}
                      onChange={(e) => handleDateChange(index, 'from', e.target.value)}
                      className="date-input"
                    />
                  </div>
                  <div className="date-input-group">
                    <label>To:</label>
                    <input
                      type="date"
                      value={date.to}
                      onChange={(e) => handleDateChange(index, 'to', e.target.value)}
                      className="date-input"
                      min={date.from}
                    />
                  </div>
                  {visitDates.length > 1 && (
                    <button 
                      className="remove-date-btn"
                      onClick={() => removeDateRange(index)}
                      type="button"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                {/* Transportation Mode Selection */}
                <div className="transport-selection">
                  <label>Transportation (select multiple):</label>
                  <div className="transport-options">
                    {transportModes.map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        className={`transport-btn ${(date.transport || []).includes(mode.id) ? 'selected' : ''}`}
                        onClick={() => handleTransportToggle(index, mode.id)}
                        title={mode.label}
                      >
                        <span className="transport-icon">{mode.icon}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              className="add-date-btn"
              onClick={addDateRange}
              type="button"
            >
              + Add Another Visit
            </button>
          </div>
          
          <div className="popup-footer">
            <button className="skip-btn" onClick={handleSkip}>
              Skip
            </button>
            <button className="save-btn" onClick={handleSave}>
              Save Dates
            </button>
          </div>
        </div>
      </div>

      {/* Overlap Warning Modal */}
      {showOverlapWarning && (
        <div className="date-picker-overlay">
          <div className="overlap-warning-popup">
            <div className="popup-header">
              <h3>⚠️ Date Overlap Warning</h3>
            </div>
            
            <div className="popup-body">
              <p className="warning-text">
                The dates you're adding overlap with existing visits in your timeline:
              </p>
              
              <div className="overlap-list">
                {overlappingDates.map((overlap, index) => (
                  <div key={index} className="overlap-item">
                    <div className="overlap-dates">
                      <strong>New dates:</strong> {new Date(overlap.newDate.from).toLocaleDateString()} - {new Date(overlap.newDate.to).toLocaleDateString()}
                    </div>
                    <div className="overlap-dates">
                      <strong>Existing dates:</strong> {new Date(overlap.existingDate.from).toLocaleDateString()} - {new Date(overlap.existingDate.to).toLocaleDateString()}
                    </div>
                    <div className="overlap-type">
                      <em>Type: {overlap.overlapType}</em>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="warning-note">
                If you proceed, these dates will be nested in your timeline. This is useful for multi-country trips or overlapping visits.
              </p>
            </div>
            
            <div className="popup-footer">
              <button className="cancel-btn" onClick={handleCancelOverlaps}>
                Cancel
              </button>
              <button className="proceed-btn" onClick={handleProceedWithOverlaps}>
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DatePickerPopup;
