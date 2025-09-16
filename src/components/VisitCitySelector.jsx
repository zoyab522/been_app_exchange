import { useState, useEffect, useMemo } from 'react';
import { useUserDataStore } from '../store/useUserDataStore';
import citiesData from '../data/cities.json';

const VisitCitySelector = ({ countryAlpha3, countryName, visitIndex, visitDates, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50);
  const { addCityToVisit, removeCityFromVisit, getCitiesForVisit, selectedList } = useUserDataStore();
  
  const availableCities = citiesData[countryAlpha3] || [];
  const selectedCities = getCitiesForVisit(countryAlpha3, visitIndex, selectedList);
  
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
    if (selectedCities.includes(cityName)) {
      removeCityFromVisit(countryAlpha3, visitIndex, cityName);
    } else {
      addCityToVisit(countryAlpha3, visitIndex, cityName);
    }
  };

  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 50);
  };

  const formatDateRange = () => {
    if (!visitDates.from || !visitDates.to) return 'Visit';
    const fromDate = new Date(visitDates.from).toLocaleDateString();
    const toDate = new Date(visitDates.to).toLocaleDateString();
    return `${fromDate} - ${toDate}`;
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

  return (
    <div className="city-selector">
      <div className="city-selector-header">
        <h4>Select Cities for {countryName}</h4>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="city-selector-content">
        <div className="visit-date-info">
          <p><strong>Visit:</strong> {formatDateRange()}</p>
        </div>
        
        <div className="city-search">
          <input
            type="text"
            placeholder="Search cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="city-search-input"
          />
        </div>
        
        {selectedCities.length > 0 && (
          <div className="selected-cities-section">
            <h5>Selected Cities ({selectedCities.length})</h5>
            <div className="selected-cities-list">
              {selectedCities.map((city, index) => (
                <div key={index} className="selected-city-item">
                  <span className="city-name">{city}</span>
                  <button 
                    className="deselect-city-btn"
                    onClick={() => handleCityToggle(city)}
                    title="Remove this city"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
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
            onClick={onClose}
          >
            Save Cities
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitCitySelector;
