import { useState, useEffect, useRef } from 'react';
import countries from '../data/countries.json';
import { useUserDataStore } from '../store/useUserDataStore';

const SearchBar = ({ selectedList, onDatePickerOpen, onCountryAdded }) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const addHighlightedCountry = useUserDataStore((state) => state.addHighlightedCountry);
  const addCountryWithDates = useUserDataStore((state) => state.addCountryWithDates);
  const countryVisitDates = useUserDataStore((state) => state.countryVisitDates);
  const setSelectedList = useUserDataStore((state) => state.setSelectedList);

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  // Sync the store's selectedList with the prop
  useEffect(() => {
    setSelectedList(selectedList);
  }, [selectedList, setSelectedList]);

  // Clear search when a country is added
  useEffect(() => {
    if (onCountryAdded) {
      setQuery('');
      setShowDropdown(false);
    }
  }, [onCountryAdded]);

  const handleSelect = (alpha3) => {
    const country = countries.find(c => c.alpha3 === alpha3);
    
    // Show date picker for all lists
    onDatePickerOpen({ alpha3, name: country.name });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filtered.length > 0) {
      handleSelect(filtered[0].alpha3);
    } else if (e.key === 'Escape') {
      setQuery('');
      setShowDropdown(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setQuery('');
        setShowDropdown(false);
      }
    };

    // Add event listener when dropdown is open
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);


  return (
    <>
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <div className="search-dropdown">
          {showDropdown ? (
            <div className="search-dropdown-input-container">
              <input
                type="text"
                placeholder="Search countries..."
                className="search-dropdown-main-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <button 
                className="search-dropdown-close"
                onClick={() => {
                  setShowDropdown(false);
                  setQuery('');
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <button 
              className="search-dropdown-button"
              onClick={() => setShowDropdown(true)}
            >
              <span className="search-dropdown-text">Add a country</span>
              <span className="search-dropdown-plus">+</span>
            </button>
          )}
          {showDropdown && filtered.length > 0 && (
            <div className="search-dropdown-content">
              <ul className="search-dropdown-list">
                {filtered.slice(0, 10).map((c) => (
                  <li key={c.alpha3} onClick={() => handleSelect(c.alpha3)}>
                    {c.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchBar;