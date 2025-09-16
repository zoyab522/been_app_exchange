import { useState, useEffect, useMemo } from 'react';
import { useUserDataStore } from '../store/useUserDataStore';
import regionsData from '../data/regions.json';
import countries from '../data/countries.json';

const RegionSelector = ({ countryAlpha3, countryName, visitIndex, visitDates, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(20);
  const { addRegionToVisit, removeRegionFromVisit, getRegionsForVisit, selectedList } = useUserDataStore();
  
  // Find the country's alpha2 code to match with regions data
  const country = countries.find(c => c.alpha3 === countryAlpha3);
  const countryAlpha2 = country?.alpha2;
  const availableRegions = regionsData.find(regionCountry => regionCountry.countryShortCode === countryAlpha2)?.regions || [];
  
  const selectedRegions = getRegionsForVisit(countryAlpha3, visitIndex, selectedList);
  
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
      removeRegionFromVisit(countryAlpha3, visitIndex, regionName);
    } else {
      addRegionToVisit(countryAlpha3, visitIndex, regionName);
    }
  };

  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 20);
  };

  const formatDateRange = (visit) => {
    if (!visit.from || !visit.to) return 'Visit';
    const fromDate = new Date(visit.from).toLocaleDateString();
    const toDate = new Date(visit.to).toLocaleDateString();
    return `${fromDate} - ${toDate}`;
  };

  return (
    <div className="city-selector">
      <div className="city-selector-header">
        <h4>Select Regions in {countryName}</h4>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="city-selector-content">
        <div className="visit-info">
          <p><strong>Visit:</strong> {formatDateRange(visitDates)}</p>
        </div>
        
        {selectedRegions.length > 0 && (
          <div className="selected-cities-section">
            <h5>Selected Regions ({selectedRegions.length})</h5>
            <div className="selected-cities-list">
              {selectedRegions.map((region, index) => (
                <div key={index} className="selected-city-item">
                  <span className="city-name">{region}</span>
                  <button 
                    className="deselect-city-btn"
                    onClick={() => handleRegionToggle(region)}
                    title="Remove this region"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
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
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegionSelector;
