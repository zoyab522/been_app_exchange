import { useState, useEffect, useMemo } from 'react';
import { useUserDataStore } from '../store/useUserDataStore';
import citiesData from '../data/cities.json';
import CustomDropdown from './CustomDropdown';

const EnhancedCitySelector = ({ countryAlpha3, countryName, onClose, onCreateNewVisit }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50);
  const [selectedCities, setSelectedCities] = useState([]);
  const [showVisitOptions, setShowVisitOptions] = useState(false);
  const [selectedVisitIndex, setSelectedVisitIndex] = useState(null);
  const [createNewVisit, setCreateNewVisit] = useState(false);
  const [addDirectly, setAddDirectly] = useState(false);
  
  const { 
    addCityToVisit, 
    addCityToCountry, 
    getCitiesForVisit, 
    getAllCitiesForCountry,
    countryVisitDates,
    addCountryWithDates,
    selectedList
  } = useUserDataStore();
  
  const availableCities = citiesData[countryAlpha3] || [];
  const listDatesKey = `${countryAlpha3}_${selectedList}`;
  const visits = countryVisitDates[listDatesKey] || [];
  const allCities = getAllCitiesForCountry(countryAlpha3);
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Memoized filtered cities with performance optimizations
  const filteredCities = useMemo(() => {
    if (!debouncedQuery) {
      // Show major cities first (prioritize cities with admin1 codes - usually major cities)
      return availableCities
        .filter(city => city.admin1 && city.admin1 !== '')
        .slice(0, displayLimit);
    }
    
    const query = debouncedQuery.toLowerCase();
    return availableCities
      .filter(city => city.name.toLowerCase().includes(query))
      .slice(0, displayLimit);
  }, [availableCities, debouncedQuery, displayLimit]);
  
  const hasMoreCities = availableCities.length > displayLimit;

  const handleCityToggle = (cityName) => {
    setSelectedCities(prev => {
      if (prev.includes(cityName)) {
        return prev.filter(city => city !== cityName);
      } else {
        return [...prev, cityName];
      }
    });
  };

  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 50);
  };

  const handleSave = () => {
    if (selectedCities.length === 0) {
      onClose();
      return;
    }

    if (visits.length === 0) {
      // No visits exist, show options to create visit or add directly
      setShowVisitOptions(true);
    } else {
      // Visits exist, show options
      setShowVisitOptions(true);
    }
  };

  const handleAddToVisit = () => {
    if (createNewVisit) {
      // Open date picker to create new visit with selected cities
      onCreateNewVisit(selectedCities);
    } else if (addDirectly) {
      // Add cities directly to country (legacy behavior)
      selectedCities.forEach(city => {
        addCityToCountry(countryAlpha3, city);
      });
      onClose();
    } else if (selectedVisitIndex !== null) {
      // Add to existing visit
      selectedCities.forEach(city => {
        addCityToVisit(countryAlpha3, selectedVisitIndex, city);
      });
      onClose();
    }
  };

  const formatDateRange = (visit, index) => {
    if (!visit.from || !visit.to) return `Visit ${index + 1}`;
    const fromDate = new Date(visit.from).toLocaleDateString();
    const toDate = new Date(visit.to).toLocaleDateString();
    return `Visit ${index + 1}: ${fromDate} - ${toDate}`;
  };

  if (availableCities.length === 0) {
    return (
      <div className="city-selector">
        <div className="city-selector-header">
          <h4>No cities available for {countryName}</h4>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="city-selector-content">
          <p>No major cities data available for this country.</p>
        </div>
      </div>
    );
  }

  if (showVisitOptions) {
    return (
      <div className="city-selector">
        <div className="city-selector-header">
          <h4>Add Cities to Visit</h4>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="city-selector-content">
          <div className="selected-cities-summary">
            <strong>{selectedCities.length} cities selected:</strong>
            <div className="selected-cities-preview">
              {selectedCities.map((city, index) => (
                <span key={index} className="city-tag-small">
                  {city}
                </span>
              ))}
            </div>
          </div>
          
          <div className="visit-options">
            <h5>Choose how to add these cities:</h5>
            
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
                        label: `${formatDateRange(visit, index)} (${getCitiesForVisit(countryAlpha3, index, selectedList).length} cities)`
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
                Create new visit with these cities
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
                Add cities directly (without visit dates)
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
              Add Cities
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="city-selector">
      <div className="city-selector-header">
        <h4>Select Cities in {countryName}</h4>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="city-selector-content">
        <div className="city-search">
          <input
            type="text"
            placeholder="Search cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="city-search-input"
          />
        </div>
        
        <div className="cities-list">
          {filteredCities.map((city) => {
            const isSelected = selectedCities.includes(city.name);
            return (
              <div
                key={city.name}
                className={`city-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleCityToggle(city.name)}
              >
                <div className="city-info">
                  <span className="city-name">{city.name}</span>
                  <span className="city-coords">
                    {city.lat.toFixed(2)}, {city.lng.toFixed(2)}
                  </span>
                </div>
                <div className="city-checkbox">
                  {isSelected ? '✓' : '○'}
                </div>
              </div>
            );
          })}
          
          {hasMoreCities && (
            <div className="load-more-container">
              <button 
                className="load-more-btn"
                onClick={handleLoadMore}
              >
                Load More Cities ({availableCities.length - displayLimit} remaining)
              </button>
            </div>
          )}
          
          {searchQuery !== debouncedQuery && (
            <div className="loading-indicator">
              Searching...
            </div>
          )}
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
            onClick={handleSave}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCitySelector;
