import { useState, useEffect, useMemo } from 'react';
import { useUserDataStore } from '../store/useUserDataStore';
import regionsData from '../data/regions.json';
import countries from '../data/countries.json';
import CustomDropdown from './CustomDropdown';

const EnhancedRegionSelector = ({ countryAlpha3, countryName, onClose, onCreateNewVisit }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(20);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [showVisitOptions, setShowVisitOptions] = useState(false);
  const [selectedVisitIndex, setSelectedVisitIndex] = useState(null);
  const [createNewVisit, setCreateNewVisit] = useState(false);
  const [addDirectly, setAddDirectly] = useState(false);
  
  const { 
    addRegionToVisit, 
    addRegionToCountry, 
    getRegionsForVisit, 
    getAllRegionsForCountry,
    countryVisitDates,
    addCountryWithDates,
    selectedList
  } = useUserDataStore();
  
  // Find the country's alpha2 code to match with regions data
  const country = countries.find(c => c.alpha3 === countryAlpha3);
  const countryAlpha2 = country?.alpha2;
  const availableRegions = regionsData.find(regionCountry => regionCountry.countryShortCode === countryAlpha2)?.regions || [];
  const listDatesKey = `${countryAlpha3}_${selectedList}`;
  const visits = countryVisitDates[listDatesKey] || [];
  const allRegions = getAllRegionsForCountry(countryAlpha3);
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Memoized filtered regions with performance optimizations
  const filteredRegions = useMemo(() => {
    if (!debouncedQuery) {
      return availableRegions.slice(0, displayLimit);
    }
    
    const query = debouncedQuery.toLowerCase();
    return availableRegions
      .filter(region => region.name.toLowerCase().includes(query))
      .slice(0, displayLimit);
  }, [availableRegions, debouncedQuery, displayLimit]);
  
  const hasMoreRegions = availableRegions.length > displayLimit;

  const handleRegionToggle = (regionName) => {
    if (selectedRegions.includes(regionName)) {
      setSelectedRegions(prev => prev.filter(region => region !== regionName));
    } else {
      setSelectedRegions(prev => [...prev, regionName]);
    }
  };

  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 20);
  };

  const handleRegionSelection = () => {
    if (selectedRegions.length === 0) return;
    setShowVisitOptions(true);
  };

  const handleAddToVisit = () => {
    if (createNewVisit) {
      // Open date picker to create new visit with selected regions
      onCreateNewVisit(selectedRegions);
    } else if (addDirectly) {
      // Add regions directly to country (legacy behavior)
      selectedRegions.forEach(region => {
        addRegionToCountry(countryAlpha3, region);
      });
      onClose();
    } else if (selectedVisitIndex !== null) {
      // Add to existing visit
      selectedRegions.forEach(region => {
        addRegionToVisit(countryAlpha3, selectedVisitIndex, region);
      });
      onClose();
    }
  };

  const formatDateRange = (visit, index) => {
    if (!visit.from || !visit.to) return `Visit ${index + 1}`;
    const fromDate = new Date(visit.from).toLocaleDateString();
    const toDate = new Date(visit.to).toLocaleDateString();
    return `${fromDate} - ${toDate}`;
  };

  if (showVisitOptions) {
    return (
      <div className="city-selector">
        <div className="city-selector-header">
          <h4>Add Regions to {countryName}</h4>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="city-selector-content">
          <div className="selected-cities-section">
            <h5>Selected Regions ({selectedRegions.length})</h5>
            <div className="selected-cities-list">
              {selectedRegions.map((region, index) => (
                <div key={index} className="selected-city-item">
                  <span className="city-name">{region}</span>
                  <button 
                    className="deselect-city-btn"
                    onClick={() => setSelectedRegions(prev => prev.filter(r => r !== region))}
                    title="Remove this region"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="visit-options">
            <h5>Choose how to add these regions:</h5>
            
            {visits.length > 0 && (
              <div className="visit-option">
                <label>
                  <input
                    type="radio"
                    name="visitOption"
                    checked={!createNewVisit && !addDirectly}
                    onChange={() => {
                      setCreateNewVisit(false);
                      setAddDirectly(false);
                    }}
                  />
                  Add to existing visit
                </label>
                {!createNewVisit && !addDirectly && (
                  <CustomDropdown
                    options={[
                      { value: '', label: 'Select a visit...' },
                      ...visits.map((visit, index) => ({
                        value: index,
                        label: `${formatDateRange(visit, index)} (${getRegionsForVisit(countryAlpha3, index, selectedList).length} regions)`
                      }))
                    ]}
                    value={selectedVisitIndex !== null ? selectedVisitIndex : ''}
                    onChange={(value) => {
                      const parsedValue = value === '' ? null : parseInt(value);
                      setSelectedVisitIndex(parsedValue);
                    }}
                    placeholder="Select a visit..."
                  />
                )}
              </div>
            )}
            
            <div className="visit-option">
              <label>
                <input
                  type="radio"
                  name="visitOption"
                  checked={createNewVisit}
                  onChange={() => {
                    setCreateNewVisit(true);
                    setAddDirectly(false);
                  }}
                />
                Create new visit with these regions
              </label>
            </div>
            
            <div className="visit-option">
              <label>
                <input
                  type="radio"
                  name="visitOption"
                  checked={addDirectly}
                  onChange={() => {
                    setAddDirectly(true);
                    setCreateNewVisit(false);
                  }}
                />
                Add regions directly (without visit dates)
              </label>
            </div>
          </div>
          
          <div className="city-selector-actions">
            <button 
              className="city-selector-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="city-selector-save-btn"
              onClick={handleAddToVisit}
              disabled={!createNewVisit && !addDirectly && selectedVisitIndex === null}
            >
              Add Regions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="city-selector">
      <div className="city-selector-header">
        <h4>Select Regions in {countryName}</h4>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="city-selector-content">
        <div className="city-search">
          <input
            type="text"
            placeholder="Search regions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="city-search-input"
          />
        </div>
        
        <div className="regions-list-container">
          <div className="city-list">
            {filteredRegions.length === 0 ? (
              <div className="no-cities">
                <p>No regions found for {countryName}</p>
              </div>
            ) : (
              <>
                {filteredRegions.map((region, index) => {
                  const isSelected = selectedRegions.includes(region.name);
                  return (
                    <div
                      key={index}
                      className={`city-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleRegionToggle(region.name)}
                    >
                      <div className="city-info">
                        <span className="city-name">{region.name}</span>
                        {region.shortCode && (
                          <span className="city-coords">{region.shortCode}</span>
                        )}
                      </div>
                      <div className="city-checkbox">
                        {isSelected ? '✓' : '○'}
                      </div>
                    </div>
                  );
                })}
                
                {hasMoreRegions && (
                  <div className="load-more-container">
                    <button 
                      className="load-more-btn"
                      onClick={handleLoadMore}
                    >
                      Load More Regions ({availableRegions.length - displayLimit} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="city-selector-actions">
          <button 
            className="city-selector-cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="city-selector-save-btn"
            onClick={handleRegionSelection}
            disabled={selectedRegions.length === 0}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedRegionSelector;

