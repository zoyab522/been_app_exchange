import { useState, forwardRef } from 'react';
import countries from '../data/countries.json';
import citiesData from '../data/cities.json';
import regionsData from '../data/regions.json';
import { useUserDataStore } from '../store/useUserDataStore';
import DatePickerPopup from './DatePickerPopup';
import CitySelector from './CitySelector';
import VisitCitySelector from './VisitCitySelector';
import EnhancedCitySelector from './EnhancedCitySelector';
import RegionSelector from './RegionSelector';
import EnhancedRegionSelector from './EnhancedRegionSelector';

const Sidebar = forwardRef(({ selectedList, onListChange, isOpen, onToggle, isMobile = false }, ref) => {
  const [activeTab, setActiveTab] = useState('countries');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [pendingCities, setPendingCities] = useState([]);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [citySelectorCountry, setCitySelectorCountry] = useState(null);
  const [showVisitCitySelector, setShowVisitCitySelector] = useState(false);
  const [visitCitySelectorData, setVisitCitySelectorData] = useState(null);
  const [showVisitRegionSelector, setShowVisitRegionSelector] = useState(false);
  const [visitRegionSelectorData, setVisitRegionSelectorData] = useState(null);
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [regionSelectorData, setRegionSelectorData] = useState(null);
  const [savedVisits, setSavedVisits] = useState(new Set()); // Track which countries have saved visits
  const [collapsedTravelDetails, setCollapsedTravelDetails] = useState(new Set()); // Track which countries have collapsed travel details
  const [collapsedVisits, setCollapsedVisits] = useState(new Set()); // Track which visits are collapsed
  const [collapsedCities, setCollapsedCities] = useState(new Set()); // Track which countries have collapsed cities
  const [collapsedRegions, setCollapsedRegions] = useState(new Set()); // Track which countries have collapsed regions
  const [timelineFilters, setTimelineFilters] = useState({
    livedIn: true,
    visited: true,
    traveledThrough: true
  });
  const [expandedCountries, setExpandedCountries] = useState(new Set());
  const [isSelectedCountriesOpen, setIsSelectedCountriesOpen] = useState(true); // Default open
  const [isAllCountriesOpen, setIsAllCountriesOpen] = useState(false); // Default closed

  const addHighlightedCountry = useUserDataStore((state) => state.addHighlightedCountry);
  const removeHighlightedCountry = useUserDataStore((state) => state.removeHighlightedCountry);
  const addCountryWithDates = useUserDataStore((state) => state.addCountryWithDates);
  const updateCountryDates = useUserDataStore((state) => state.updateCountryDates);
  const removeVisitDate = useUserDataStore((state) => state.removeVisitDate);
  const countryVisitDates = useUserDataStore((state) => state.countryVisitDates);
  const getCitiesForCountry = useUserDataStore((state) => state.getCitiesForCountry);
  const getCitiesForVisit = useUserDataStore((state) => state.getCitiesForVisit);
  const getAllCitiesForCountry = useUserDataStore((state) => state.getAllCitiesForCountry);
  const getRegionsForVisit = useUserDataStore((state) => state.getRegionsForVisit);
  const getAllRegionsForCountry = useUserDataStore((state) => state.getAllRegionsForCountry);
  const addRegionToCountry = useUserDataStore((state) => state.addRegionToCountry);
  const removeRegionFromCountry = useUserDataStore((state) => state.removeRegionFromCountry);
  const getRegionsForCountry = useUserDataStore((state) => state.getRegionsForCountry);

  // Calculate percentage of cities explored for a country
  const getCitiesExploredPercentage = (alpha3) => {
    const selectedCities = getAllCitiesForCountry(alpha3);
    const totalCities = citiesData[alpha3]?.length || 0;
    
    if (totalCities === 0) return 0;
    
    const percentage = Math.round((selectedCities.length / totalCities) * 100);
    return percentage;
  };

  // Calculate percentage of regions explored for a country
  const getRegionsExploredPercentage = (alpha3) => {
    const selectedRegions = getAllRegionsForCountry(alpha3);
    const country = countries.find(c => c.alpha3 === alpha3);
    const countryAlpha2 = country?.alpha2;
    const availableRegions = regionsData.find(regionCountry => regionCountry.countryShortCode === countryAlpha2)?.regions || [];
    const totalRegions = availableRegions.length;
    
    if (totalRegions === 0) return 0;
    
    const percentage = Math.round((selectedRegions.length / totalRegions) * 100);
    return percentage;
  };

  // Get chart color based on selected list
  const getChartColor = (listType) => {
    switch (listType) {
      case 'livedIn':
        return '#28a745'; // Green
      case 'visited':
        return '#6f42c1'; // Purple
      case 'wantToGo':
        return '#ffc107'; // Yellow
      case 'traveledThrough':
        return '#6c757d'; // Gray
      case 'all':
        return '#17a2b8'; // Teal for combined view
      default:
        return '#007bff'; // Default blue
    }
  };

  // Get current list countries based on selected list
  const livedInCountries = useUserDataStore((state) => state.livedInCountries || []);
  const visitedCountries = useUserDataStore((state) => state.visitedCountries || []);
  const wantToGoCountries = useUserDataStore((state) => state.wantToGoCountries || []);
  const traveledThroughCountries = useUserDataStore((state) => state.traveledThroughCountries || []);

  const getCurrentListCountries = () => {
    if (selectedList === 'livedIn') return livedInCountries;
    if (selectedList === 'visited') return visitedCountries;
    if (selectedList === 'wantToGo') return wantToGoCountries;
    if (selectedList === 'traveledThrough') return traveledThroughCountries;
    if (selectedList === 'all') {
      // Combine all countries from all lists
      const allCountries = new Set([
        ...livedInCountries,
        ...visitedCountries,
        ...wantToGoCountries,
        ...traveledThroughCountries
      ]);
      return Array.from(allCountries);
    }
    return [];
  };

  // Helper function to get visit dates for a country in the current list
  const getCurrentListVisitDates = (alpha3) => {
    const listDatesKey = `${alpha3}_${selectedList}`;
    return countryVisitDates[listDatesKey] || [];
  };

  const currentListCountries = getCurrentListCountries();

  const toggleSidebar = () => {
    onToggle(!isOpen);
  };

  const getFlagIcon = (alpha2) => {
    // Using circle-flags for minimal, clean circular SVG flags
    return `https://hatscripts.github.io/circle-flags/flags/${alpha2.toLowerCase()}.svg`;
  };

  const handleCountryClick = (alpha3) => {
    // Don't allow adding/removing countries when "all" is selected (it's a read-only combined view)
    if (selectedList === 'all') {
      return;
    }
    
    if (currentListCountries.includes(alpha3)) {
      removeHighlightedCountry(alpha3);
    } else {
      const country = countries.find(c => c.alpha3 === alpha3);
      
      // Check if this is a list that requires dates (Lived In or Visited)
      if (selectedList === 'livedIn' || selectedList === 'visited') {
        setSelectedCountry({ alpha3, name: country.name });
        setShowDatePicker(true);
      } else {
        // For other lists, add directly without dates
        addHighlightedCountry(alpha3);
      }
    }
  };

  const handleSaveDates = (visitDates) => {
    if (selectedCountry) {
      // If we have pending cities, add them to the first visit
      if (pendingCities.length > 0 && visitDates.length > 0) {
        visitDates[0].cities = pendingCities;
        setPendingCities([]);
      }
      addCountryWithDates(selectedCountry.alpha3, visitDates);
    }
    setShowDatePicker(false);
    setSelectedCountry(null);
  };

  const handleCloseDatePicker = () => {
    setShowDatePicker(false);
    setSelectedCountry(null);
    setPendingCities([]);
  };

  const handleCreateNewVisit = (cities) => {
    if (citySelectorCountry) {
      setPendingCities(cities);
      setSelectedCountry(citySelectorCountry);
      setShowDatePicker(true);
      setShowCitySelector(false);
    }
  };

  const handleCitySelectorOpen = (country) => {
    setCitySelectorCountry(country);
    setShowCitySelector(true);
  };

  const handleCitySelectorClose = () => {
    setShowCitySelector(false);
    setCitySelectorCountry(null);
  };

  const handleVisitCitySelectorOpen = (country, visitIndex, visitDates) => {
    setVisitCitySelectorData({
      country,
      visitIndex,
      visitDates
    });
    setShowVisitCitySelector(true);
  };

  const handleVisitCitySelectorClose = () => {
    setShowVisitCitySelector(false);
    setVisitCitySelectorData(null);
  };

  const handleVisitRegionSelectorOpen = (country, visitIndex, visitDates) => {
    setVisitRegionSelectorData({
      country,
      visitIndex,
      visitDates
    });
    setShowVisitRegionSelector(true);
  };

  const handleVisitRegionSelectorClose = () => {
    setShowVisitRegionSelector(false);
    setVisitRegionSelectorData(null);
  };

  const handleRegionSelectorOpen = (country) => {
    setShowRegionSelector(true);
    setRegionSelectorData({ country });
  };

  const handleRegionSelectorClose = () => {
    setShowRegionSelector(false);
    setRegionSelectorData(null);
  };

  const toggleCountryExpansion = (alpha3) => {
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(alpha3)) {
      newExpanded.delete(alpha3);
    } else {
      newExpanded.add(alpha3);
    }
    setExpandedCountries(newExpanded);
  };

  const handleDateEdit = (alpha3, visitIndex, field, value) => {
    const currentDates = getCurrentListVisitDates(alpha3);
    const newDates = [...currentDates];
    newDates[visitIndex] = { ...newDates[visitIndex], [field]: value };
    updateCountryDates(alpha3, newDates);
    // Clear saved state when dates are modified
    setSavedVisits(prev => {
      const newSet = new Set(prev);
      newSet.delete(alpha3);
      return newSet;
    });
  };

  const handleTransportToggle = (alpha3, visitIndex, transportId) => {
    const currentDates = getCurrentListVisitDates(alpha3);
    const newDates = [...currentDates];
    const currentTransport = newDates[visitIndex].transport || [];
    
    if (currentTransport.includes(transportId)) {
      // Remove transport mode
      newDates[visitIndex].transport = currentTransport.filter(t => t !== transportId);
    } else {
      // Add transport mode
      newDates[visitIndex].transport = [...currentTransport, transportId];
    }
    
    updateCountryDates(alpha3, newDates);
    // Clear saved state when transport is modified
    setSavedVisits(prev => {
      const newSet = new Set(prev);
      newSet.delete(alpha3);
      return newSet;
    });
  };

  const handleAddVisit = (alpha3) => {
    const currentDates = getCurrentListVisitDates(alpha3);
    const newDates = [...currentDates, { from: '', to: '', transport: ['plane'], isOngoing: false }];
    updateCountryDates(alpha3, newDates);
    // Clear saved state when new visit is added
    setSavedVisits(prev => {
      const newSet = new Set(prev);
      newSet.delete(alpha3);
      return newSet;
    });
  };

  const handleOngoingToggle = (alpha3, visitIndex, isOngoing) => {
    const currentDates = getCurrentListVisitDates(alpha3);
    const newDates = [...currentDates];
    newDates[visitIndex] = { 
      ...newDates[visitIndex], 
      isOngoing: isOngoing,
      to: isOngoing ? 'Present' : newDates[visitIndex].to
    };
    updateCountryDates(alpha3, newDates);
    // Clear saved state when ongoing status is modified
    setSavedVisits(prev => {
      const newSet = new Set(prev);
      newSet.delete(alpha3);
      return newSet;
    });
  };

  const isValidVisitData = (alpha3) => {
    const visits = getCurrentListVisitDates(alpha3);
    return visits.every(visit => {
      // Must have a from date
      if (!visit.from) return false;
      
      // If not ongoing, must have a to date
      if (!visit.isOngoing && !visit.to) return false;
      
      // If ongoing, to date should be 'Present' or empty
      if (visit.isOngoing && visit.to && visit.to !== 'Present') return false;
      
      return true;
    });
  };

  const handleSaveVisits = (alpha3) => {
    if (isValidVisitData(alpha3)) {
      // Mark this country's visits as saved
      setSavedVisits(prev => new Set([...prev, alpha3]));
      console.log('Visits saved successfully for', alpha3);
    }
  };

  const toggleTravelDetailsCollapse = (alpha3) => {
    setCollapsedTravelDetails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alpha3)) {
        newSet.delete(alpha3);
      } else {
        newSet.add(alpha3);
      }
      return newSet;
    });
  };

  const toggleVisitCollapse = (alpha3, visitIndex) => {
    const visitKey = `${alpha3}-${visitIndex}`;
    setCollapsedVisits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(visitKey)) {
        newSet.delete(visitKey);
      } else {
        newSet.add(visitKey);
      }
      return newSet;
    });
  };

  const toggleCitiesCollapse = (alpha3) => {
    setCollapsedCities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alpha3)) {
        newSet.delete(alpha3);
      } else {
        newSet.add(alpha3);
      }
      return newSet;
    });
  };

  const toggleRegionsCollapse = (alpha3) => {
    setCollapsedRegions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alpha3)) {
        newSet.delete(alpha3);
      } else {
        newSet.add(alpha3);
      }
      return newSet;
    });
  };


  const handleRemoveAllDates = (alpha3) => {
    updateCountryDates(alpha3, []);
  };

  // Transportation mode options
  const transportModes = [
    { id: 'plane', icon: '✈️', label: 'Plane' },
    { id: 'train', icon: '🚂', label: 'Train' },
    { id: 'bus', icon: '🚌', label: 'Bus' },
    { id: 'car', icon: '🚗', label: 'Car' },
    { id: 'ferry', icon: '⛴️', label: 'Ferry' },
    { id: 'sailboat', icon: '⛵', label: 'Sailboat' }
  ];

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate countries into added and not added
  const addedCountries = filteredCountries.filter(country => 
    currentListCountries.includes(country.alpha3)
  );
  const notAddedCountries = filteredCountries.filter(country => 
    !currentListCountries.includes(country.alpha3)
  );

  const getListTitle = () => {
    switch (selectedList) {
      case 'livedIn': return 'Lived In';
      case 'visited': return 'Visited';
      case 'wantToGo': return 'Want to Go';
      case 'traveledThrough': return 'Traveled Through';
      case 'all': return 'All Countries';
      default: return 'Selected Countries';
    }
  };

  // Timeline data processing
  const getTimelineData = () => {
    const timelineItems = [];
    
    // Process all countries with visit dates from all lists
    const listTypes = ['livedIn', 'visited', 'traveledThrough'];
    
    listTypes.forEach(listType => {
      // Get countries in this list
      const countriesInList = listType === 'livedIn' ? livedInCountries :
                             listType === 'visited' ? visitedCountries :
                             traveledThroughCountries;
      
      // Apply timeline filters
      if (!timelineFilters[listType]) return;
      
      countriesInList.forEach(alpha3 => {
        const country = countries.find(c => c.alpha3 === alpha3);
        if (!country) return;
        
        // Get dates for this country in this specific list
        const listDatesKey = `${alpha3}_${listType}`;
        const dates = countryVisitDates[listDatesKey] || [];
        
        if (dates.length === 0) return;
        
        // Add each visit date as a timeline item
        dates.forEach((visit, index) => {
          timelineItems.push({
            id: `${alpha3}-${listType}-${index}`,
            country: country.name,
            alpha3: alpha3,
            alpha2: country.alpha2,
            from: visit.from,
            to: visit.to,
            transport: visit.transport,
            cities: visit.cities || [],
            regions: visit.regions || [],
            listType: listType,
            isMultipleVisits: dates.length > 1
          });
        });
      });
    });
    
    // Sort by from date (earliest first)
    return timelineItems.sort((a, b) => new Date(a.from) - new Date(b.from));
  };

  const timelineData = getTimelineData();

  // Helper functions for statistics
  const getVisitedContinents = () => {
    const continentMap = {
      'Africa': ['DZ', 'AO', 'BW', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CG', 'CD', 'DJ', 'EG', 'GQ', 'ER', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'CI', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'SZ', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW'],
      'Asia': ['AF', 'AM', 'AZ', 'BH', 'BD', 'BT', 'BN', 'KH', 'CN', 'CY', 'GE', 'IN', 'ID', 'IR', 'IQ', 'IL', 'JP', 'JO', 'KZ', 'KW', 'KG', 'LA', 'LB', 'MY', 'MV', 'MN', 'MM', 'NP', 'KP', 'OM', 'PK', 'PS', 'PH', 'QA', 'SA', 'SG', 'KR', 'LK', 'SY', 'TW', 'TJ', 'TH', 'TL', 'TR', 'TM', 'AE', 'UZ', 'VN', 'YE'],
      'Europe': ['AD', 'AL', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'XK', 'LV', 'LI', 'LT', 'LU', 'MT', 'MD', 'MC', 'ME', 'NL', 'MK', 'NO', 'PL', 'PT', 'RO', 'RU', 'SM', 'RS', 'SK', 'SI', 'ES', 'SE', 'CH', 'UA', 'GB', 'VA'],
      'North America': ['AG', 'BS', 'BB', 'BZ', 'CA', 'CR', 'CU', 'DM', 'DO', 'SV', 'GD', 'GT', 'HN', 'JM', 'MX', 'NI', 'PA', 'KN', 'LC', 'VC', 'TT', 'US'],
      'South America': ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'FK', 'GF', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE'],
      'Oceania': ['AU', 'FJ', 'KI', 'MH', 'FM', 'NR', 'NZ', 'PW', 'PG', 'WS', 'SB', 'TO', 'TV', 'VU'],
      'Antarctica': ['AQ', 'BV', 'HM', 'GS', 'TF']
    };

    const visitedContinents = new Set();
    currentListCountries.forEach(alpha3 => {
      const country = countries.find(c => c.alpha3 === alpha3);
      if (country) {
        Object.entries(continentMap).forEach(([continent, codes]) => {
          if (codes.includes(country.alpha2)) {
            visitedContinents.add(continent);
          }
        });
      }
    });

    return Array.from(visitedContinents);
  };

  const getContinentStats = () => {
    const continentData = {
      'Africa': { countries: ['DZ', 'AO', 'BW', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CG', 'CD', 'DJ', 'EG', 'GQ', 'ER', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'CI', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'SZ', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW'], color: '#e74c3c' },
      'Asia': { countries: ['AF', 'AM', 'AZ', 'BH', 'BD', 'BT', 'BN', 'KH', 'CN', 'CY', 'GE', 'IN', 'ID', 'IR', 'IQ', 'IL', 'JP', 'JO', 'KZ', 'KW', 'KG', 'LA', 'LB', 'MY', 'MV', 'MN', 'MM', 'NP', 'KP', 'OM', 'PK', 'PS', 'PH', 'QA', 'SA', 'SG', 'KR', 'LK', 'SY', 'TW', 'TJ', 'TH', 'TL', 'TR', 'TM', 'AE', 'UZ', 'VN', 'YE'], color: '#f39c12' },
      'Europe': { countries: ['AD', 'AL', 'AT', 'BY', 'BE', 'BA', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'XK', 'LV', 'LI', 'LT', 'LU', 'MT', 'MD', 'MC', 'ME', 'NL', 'MK', 'NO', 'PL', 'PT', 'RO', 'RU', 'SM', 'RS', 'SK', 'SI', 'ES', 'SE', 'CH', 'UA', 'GB', 'VA'], color: '#3498db' },
      'North America': { countries: ['AG', 'BS', 'BB', 'BZ', 'CA', 'CR', 'CU', 'DM', 'DO', 'SV', 'GD', 'GT', 'HN', 'JM', 'MX', 'NI', 'PA', 'KN', 'LC', 'VC', 'TT', 'US'], color: '#2ecc71' },
      'South America': { countries: ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'FK', 'GF', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE'], color: '#9b59b6' },
      'Oceania': { countries: ['AU', 'FJ', 'KI', 'MH', 'FM', 'NR', 'NZ', 'PW', 'PG', 'WS', 'SB', 'TO', 'TV', 'VU'], color: '#1abc9c' },
      'Antarctica': { countries: ['AQ', 'BV', 'HM', 'GS', 'TF'], color: '#95a5a6' }
    };

    return Object.entries(continentData).map(([name, data]) => {
      const visited = currentListCountries.filter(alpha3 => {
        const country = countries.find(c => c.alpha3 === alpha3);
        return country && data.countries.includes(country.alpha2);
      }).length;

      const total = name === 'Antarctica' ? data.countries.length : 
        countries.filter(c => data.countries.includes(c.alpha2) && c.status === 'UN').length;

      return {
        name,
        visited,
        total,
        color: getChartColor(selectedList)
      };
    });
  };

  return (
    <>
      {/* Sidebar */}
      <div ref={ref} className={`sidebar-overlay ${isOpen ? 'open' : ''} ${isMobile ? 'mobile' : 'desktop'}`}>
        <div className="sidebar-content">
          <div className="sidebar-header">
              <h3>My Travel Metrics</h3>
            <button className="sidebar-close-btn" onClick={toggleSidebar}>
              <div className="hamburger-icon">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
          </div>
          
                  {/* Tab Navigation */}
                  <div className="sidebar-tabs">
                    <button 
                      className={`tab-btn ${activeTab === 'countries' ? 'active' : ''}`}
                      onClick={() => setActiveTab('countries')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                      </svg>
                      Countries
                    </button>
                    <button 
                      className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                      onClick={() => setActiveTab('timeline')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      My Timeline
                    </button>
                    <button 
                      className={`tab-btn ${activeTab === 'inTotal' ? 'active' : ''}`}
                      onClick={() => setActiveTab('inTotal')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3v18h18"/>
                        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                      </svg>
                      World Stats
                    </button>
                  </div>
          
          {/* Countries Tab Content */}
          {activeTab === 'countries' && (
            <>
              <div className="sidebar-search-container">
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sidebar-search"
                />
              </div>
              
              <div className="countries-list">
            {/* Added Countries Section */}
            {addedCountries.length > 0 && (
              <>
                <div className="section-header collapsible" onClick={() => setIsSelectedCountriesOpen(!isSelectedCountriesOpen)}>
                  <div className="section-header-left">
                    <span className="collapse-icon">
                      {isSelectedCountriesOpen ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9,18 15,12 9,6"></polyline>
                        </svg>
                      )}
                    </span>
                    <h4>{getListTitle()}</h4>
                    <span className="count">({addedCountries.length})</span>
                  </div>
                </div>
            {isSelectedCountriesOpen && addedCountries.map((country) => (
              <div key={country.alpha3} className="country-item selected">
                <div className="country-main" onClick={() => handleCountryClick(country.alpha3)}>
                  <div className="flag-container colored">
                    <img 
                      src={getFlagIcon(country.alpha2)} 
                      alt={`${country.name} flag`}
                      className="flag-icon"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <span className="flag-fallback" style={{display: 'none'}}>
                      {country.alpha2}
                    </span>
                  </div>
                  <div className="country-info">
                    <span className="country-name">
                      {country.name}
                      <span className={`status-badge ${country.status?.toLowerCase()}`}>
                        {country.status}
                      </span>
                    </span>
                  </div>
                  <div className="country-actions">
                    <button 
                      className="expand-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCountryExpansion(country.alpha3);
                      }}
                      title="View travel details"
                    >
                      {expandedCountries.has(country.alpha3) ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9,18 15,12 9,6"></polyline>
                        </svg>
                      )}
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeHighlightedCountry(country.alpha3);
                      }}
                      title="Remove from list"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                {/* Travel Details */}
                {expandedCountries.has(country.alpha3) && (
                  <div className="travel-details">
                    <div className="travel-details-header">
                      <div className="travel-details-title">
                        <h5>Travel Details</h5>
                        <button 
                          className="collapse-travel-details-btn"
                          onClick={() => toggleTravelDetailsCollapse(country.alpha3)}
                          title={collapsedTravelDetails.has(country.alpha3) ? "Expand travel details" : "Collapse travel details"}
                        >
                          {collapsedTravelDetails.has(country.alpha3) ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9,18 15,12 9,6"></polyline>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                          )}
                        </button>
                      </div>
                      <button 
                        className="remove-all-dates-btn"
                        onClick={() => handleRemoveAllDates(country.alpha3)}
                        title="Remove all dates"
                      >
                        Clear All Dates
                      </button>
                    </div>
                    
                    {!collapsedTravelDetails.has(country.alpha3) && (
                      <div className="travel-details-content">
                        {(getCurrentListVisitDates(country.alpha3)).length === 0 ? (
                      <div className="no-dates">
                        <p>No visit dates recorded.</p>
                        <button 
                          className="add-visit-btn"
                          onClick={() => handleAddVisit(country.alpha3)}
                        >
                          + Add Visit Dates
                        </button>
                      </div>
                    ) : (
                      <div className="visit-dates">
                        {(getCurrentListVisitDates(country.alpha3)).map((visit, index) => (
                          <div key={index} className="visit-date-item">
                            <div className="visit-date-header">
                              <div className="visit-title-section">
                                <h6>Visit {index + 1}</h6>
                                <button 
                                  className="collapse-visit-btn"
                                  onClick={() => toggleVisitCollapse(country.alpha3, index)}
                                  title={collapsedVisits.has(`${country.alpha3}-${index}`) ? "Expand visit" : "Collapse visit"}
                                >
                                  {collapsedVisits.has(`${country.alpha3}-${index}`) ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="9,18 15,12 9,6"></polyline>
                                    </svg>
                                  ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="6,9 12,15 18,9"></polyline>
                                    </svg>
                                  )}
                                </button>
                              </div>
                              <div className="visit-actions">
                                <button 
                                  className="remove-visit-btn"
                                  onClick={() => removeVisitDate(country.alpha3, index)}
                                  title="Remove this visit"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                            
                            {!collapsedVisits.has(`${country.alpha3}-${index}`) && (
                              <>
                                <div className="visit-inputs">
                                  <div className="date-input-group">
                                    <label>From:</label>
                                    <input
                                      type="date"
                                      value={visit.from}
                                      onChange={(e) => handleDateEdit(country.alpha3, index, 'from', e.target.value)}
                                    />
                                  </div>
                                  <div className="date-input-group">
                                    <label>To:</label>
                                    <input
                                      type="date"
                                      value={visit.to}
                                      onChange={(e) => handleDateEdit(country.alpha3, index, 'to', e.target.value)}
                                      disabled={visit.isOngoing}
                                    />
                                    {visit.isOngoing && (
                                      <span className="ongoing-indicator">Present</span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Ongoing Visit Checkbox */}
                                <div className="ongoing-visit-section">
                                  <label className="ongoing-checkbox-label">
                                    <input
                                      type="checkbox"
                                      checked={visit.isOngoing || false}
                                      onChange={(e) => handleOngoingToggle(country.alpha3, index, e.target.checked)}
                                    />
                                    <span className="checkmark"></span>
                                    I am still in this region/haven't left
                                  </label>
                                </div>
                                
                                {/* Transportation Mode Selection */}
                                <div className="transport-selection">
                                  <label>Transportation:</label>
                                  <div className="transport-options">
                                    {transportModes.map((mode) => (
                                      <button
                                        key={mode.id}
                                        type="button"
                                        className={`transport-btn ${(visit.transport || []).includes(mode.id) ? 'selected' : ''}`}
                                        onClick={() => handleTransportToggle(country.alpha3, index, mode.id)}
                                        title={mode.label}
                                      >
                                        <span className="transport-icon">{mode.icon}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* Cities Section for this Visit */}
                                <div className="visit-cities-section">
                                  <div className="visit-cities-header">
                                    <label>Cities:</label>
                                    <button 
                                      className="select-cities-btn"
                                      onClick={() => handleVisitCitySelectorOpen(country, index, visit)}
                                      title="Select cities for this visit"
                                    >
                                      Add Cities ({getCitiesForVisit(country.alpha3, index, selectedList).length})
                                    </button>
                                  </div>
                                  {getCitiesForVisit(country.alpha3, index, selectedList).length > 0 && (
                                    <div className="visit-cities-list">
                                      {getCitiesForVisit(country.alpha3, index, selectedList).map((city, cityIndex) => (
                                        <span key={cityIndex} className="city-tag">
                                          {city}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Regions Section for this Visit */}
                                <div className="visit-cities-section">
                                  <div className="visit-cities-header">
                                    <label>Regions:</label>
                                    <button 
                                      className="select-cities-btn"
                                      onClick={() => handleVisitRegionSelectorOpen(country, index, visit)}
                                      title="Select regions for this visit"
                                    >
                                      Add Regions ({getRegionsForVisit(country.alpha3, index, selectedList).length})
                                    </button>
                                  </div>
                                  {getRegionsForVisit(country.alpha3, index, selectedList).length > 0 && (
                                    <div className="visit-cities-list">
                                      {getRegionsForVisit(country.alpha3, index, selectedList).map((region, regionIndex) => (
                                        <span key={regionIndex} className="city-tag">
                                          {region}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                        <div className="visit-actions">
                          <button 
                            className="add-visit-btn"
                            onClick={() => handleAddVisit(country.alpha3)}
                          >
                            + Add Another Visit
                          </button>
                          <button 
                            className={`save-visits-btn ${savedVisits.has(country.alpha3) ? 'saved' : ''}`}
                            onClick={() => handleSaveVisits(country.alpha3)}
                            disabled={!isValidVisitData(country.alpha3)}
                          >
                            {savedVisits.has(country.alpha3) ? 'Saved ✓' : 'Save Visits'}
                          </button>
                        </div>
                      </div>
                    )}
                      </div>
                    )}
                    
                    {/* Regions Section */}
                    <div className="cities-section">
                        <div className="cities-header">
                          <div className="cities-title-section">
                            <h5>All Regions</h5>
                            <button 
                              className="collapse-cities-btn"
                              onClick={() => toggleRegionsCollapse(country.alpha3)}
                              title={collapsedRegions.has(country.alpha3) ? "Expand regions" : "Collapse regions"}
                            >
                              {collapsedRegions.has(country.alpha3) ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="9,18 15,12 9,6"></polyline>
                                </svg>
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="6,9 12,15 18,9"></polyline>
                                </svg>
                              )}
                            </button>
                          </div>
                          <div className="cities-stats">
                            <span className="cities-count">
                              {getAllRegionsForCountry(country.alpha3).length} selected
                            </span>
                            <span className="cities-percentage">
                              {getRegionsExploredPercentage(country.alpha3)}% explored
                            </span>
                          </div>
                        </div>
                      {!collapsedRegions.has(country.alpha3) && (
                        <>
                          {getAllRegionsForCountry(country.alpha3).length > 0 ? (
                            <div className="selected-cities">
                              {getAllRegionsForCountry(country.alpha3).map((regionName, index) => (
                                <span key={index} className="city-tag">
                                  {regionName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="no-cities">No regions selected.</p>
                          )}
                        </>
                      )}
                      
                      
                      <button 
                        className="add-cities-btn"
                        onClick={() => handleRegionSelectorOpen(country)}
                      >
                        + Add Regions
                      </button>
                    </div>
                    
                    {/* Cities Section */}
                    <div className="cities-section">
                        <div className="cities-header">
                          <div className="cities-title-section">
                            <h5>All Cities</h5>
                            <button 
                              className="collapse-cities-btn"
                              onClick={() => toggleCitiesCollapse(country.alpha3)}
                              title={collapsedCities.has(country.alpha3) ? "Expand cities" : "Collapse cities"}
                            >
                              {collapsedCities.has(country.alpha3) ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="9,18 15,12 9,6"></polyline>
                                </svg>
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="6,9 12,15 18,9"></polyline>
                                </svg>
                              )}
                            </button>
                          </div>
                          <div className="cities-stats">
                            <span className="cities-count">
                              {getAllCitiesForCountry(country.alpha3).length} selected
                            </span>
                            <span className="cities-percentage">
                              {getCitiesExploredPercentage(country.alpha3)}% explored
                            </span>
                          </div>
                        </div>
                      {!collapsedCities.has(country.alpha3) && (
                        <>
                          {getAllCitiesForCountry(country.alpha3).length > 0 ? (
                            <div className="selected-cities">
                              {getAllCitiesForCountry(country.alpha3).map((cityName, index) => (
                                <span key={index} className="city-tag">
                                  {cityName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="no-cities">No cities selected.</p>
                          )}
                        </>
                      )}
                      
                      
                      <button 
                        className="add-cities-btn"
                        onClick={() => handleCitySelectorOpen(country)}
                      >
                        + Add Cities
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
                <div className="separator"></div>
              </>
            )}

            {/* Not Added Countries Section */}
            {notAddedCountries.length > 0 && (
              <>
                <div className="section-header collapsible" onClick={() => setIsAllCountriesOpen(!isAllCountriesOpen)}>
                  <div className="section-header-left">
                    <span className="collapse-icon">
                      {isAllCountriesOpen ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9,18 15,12 9,6"></polyline>
                        </svg>
                      )}
                    </span>
                    <h4>All Countries</h4>
                    <span className="count">({notAddedCountries.length})</span>
                  </div>
                </div>
                {isAllCountriesOpen && notAddedCountries.map((country) => (
                  <div key={country.alpha3} className="country-item">
                    <div className="country-main" onClick={() => handleCountryClick(country.alpha3)}>
                      <div className="flag-container greyscale">
                        <img 
                          src={getFlagIcon(country.alpha2)} 
                          alt={`${country.name} flag`}
                          className="flag-icon"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <span className="flag-fallback" style={{display: 'none'}}>
                          {country.alpha2}
                        </span>
                      </div>
                      <div className="country-info">
                        <span className="country-name">{country.name}</span>
                        <span className={`status-badge ${country.status?.toLowerCase()}`}>
                          {country.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
              </div>
            </>
          )}
          
          {/* Timeline Tab Content */}
          {activeTab === 'timeline' && (
            <div className="timeline-container">
              <div className="timeline-header">
                <h4>Travel Timeline</h4>
                <span className="timeline-count">({timelineData.length} visits)</span>
              </div>
              
              {/* Timeline Filters */}
              <div className="timeline-filters">
                <div className="filter-group">
                  <label className="filter-label">
                    <input
                      type="checkbox"
                      checked={timelineFilters.livedIn}
                      onChange={(e) => setTimelineFilters(prev => ({ ...prev, livedIn: e.target.checked }))}
                    />
                    <span className="filter-text livedIn">Lived In</span>
                  </label>
                  <label className="filter-label">
                    <input
                      type="checkbox"
                      checked={timelineFilters.visited}
                      onChange={(e) => setTimelineFilters(prev => ({ ...prev, visited: e.target.checked }))}
                    />
                    <span className="filter-text visited">Visited</span>
                  </label>
                  <label className="filter-label">
                    <input
                      type="checkbox"
                      checked={timelineFilters.traveledThrough}
                      onChange={(e) => setTimelineFilters(prev => ({ ...prev, traveledThrough: e.target.checked }))}
                    />
                    <span className="filter-text traveledThrough">Traveled Through</span>
                  </label>
                </div>
              </div>
              
              {timelineData.length === 0 ? (
                <div className="timeline-empty">
                  <p>No visits with dates yet.</p>
                  <p>Add countries with visit dates to see your timeline!</p>
                </div>
              ) : (
                <div className="timeline">
                  {timelineData.map((item, index) => (
                    <div key={item.id} className="timeline-item">
                      <div className="timeline-marker">
                        <div className={`flag-container ${item.listType}`}>
                          <img 
                            src={getFlagIcon(item.alpha2)} 
                            alt={`${item.country} flag`}
                            className="flag-icon"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <span className="flag-fallback" style={{display: 'none'}}>
                            {item.alpha2}
                          </span>
                        </div>
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-country">{item.country}</div>
                        <div className="timeline-dates">
                          {new Date(item.from).toLocaleDateString()} - {item.to === 'Present' ? 'Present' : new Date(item.to).toLocaleDateString()}
                        </div>
                        <div className="timeline-meta">
                          <div className={`timeline-type ${item.listType}`}>
                            {item.listType === 'livedIn' ? 'Lived In' : 
                             item.listType === 'visited' ? 'Visited' :
                             item.listType === 'wantToGo' ? 'Want to Go' : 'Traveled Through'}
                          </div>
                          {item.transport && item.transport.length > 0 && (
                            <div className="timeline-transport">
                              <div className="transport-icons">
                                {item.transport.map((transportId, idx) => (
                                  <span key={idx} className="transport-icon">
                                    {transportModes.find(mode => mode.id === transportId)?.icon || '✈️'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {item.cities && item.cities.length > 0 && (
                            <div className="timeline-cities">
                              <span className="cities-label">Cities:</span>
                              <div className="cities-list">
                                {item.cities.map((city, idx) => (
                                  <span key={idx} className="city-tag">
                                    {city}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {item.regions && item.regions.length > 0 && (
                            <div className="timeline-cities">
                              <span className="cities-label">Regions:</span>
                              <div className="cities-list">
                                {item.regions.map((region, idx) => (
                                  <span key={idx} className="city-tag">
                                    {region}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {item.isMultipleVisits && (
                          <div className="timeline-multiple">Multiple visits</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* In Total Tab Content */}
          {activeTab === 'inTotal' && (
            <div className="in-total-container">
              <div className="in-total-header">
                <h4>Statistics</h4>
                <span className="in-total-subtitle">Based on {getListTitle()}</span>
              </div>
              
              {/* My Countries Section */}
              {currentListCountries.length > 0 && (
                <div className="my-countries-section">
                  <h5>My Countries</h5>
                  <div className="countries-badges">
                    {currentListCountries.map((alpha3) => {
                      const country = countries.find(c => c.alpha3 === alpha3);
                      if (!country) return null;
                      
                      return (
                        <div key={alpha3} className="country-badge" title={country.name}>
                          <img 
                            src={getFlagIcon(country.alpha2)} 
                            alt={`${country.name} flag`}
                            className="flag-icon"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <span className="flag-fallback" style={{display: 'none'}}>
                            {country.alpha2}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="stats-cards">
                {/* In Total Card */}
                <div className="stats-card">
                  <div className="stats-card-header">
                    <h5>In Total</h5>
                  </div>
                  <div className="stats-card-content">
                    <div className="circle-chart">
                      <div className="circle-chart-svg">
                        <svg viewBox="0 0 100 100" className="circle-chart-svg">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#e9ecef"
                            strokeWidth="8"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={getChartColor(selectedList)}
                            strokeWidth="8"
                            strokeDasharray={`${(currentListCountries.length / countries.filter(c => c.status === 'UN').length) * 251.2} 251.2`}
                            strokeDashoffset="62.8"
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                        <div className="circle-chart-text">
                          {Math.round((currentListCountries.length / countries.filter(c => c.status === 'UN').length) * 100)}%
                        </div>
                      </div>
                    </div>
                    <div className="stats-text">
                      <div className="stats-main">{Math.round((currentListCountries.length / countries.filter(c => c.status === 'UN').length) * 100)}% World</div>
                      <div className="stats-sub">out of 194 UN countries</div>
                    </div>
                  </div>
                </div>

                {/* Continents Card */}
                <div className="stats-card">
                  <div className="stats-card-header">
                    <h5>Continents</h5>
                  </div>
                  <div className="stats-card-content">
                    <div className="circle-chart">
                      <div className="circle-chart-svg">
                        <svg viewBox="0 0 100 100" className="circle-chart-svg">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#e9ecef"
                            strokeWidth="8"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={getChartColor(selectedList)}
                            strokeWidth="8"
                            strokeDasharray={`${(getVisitedContinents().length / 7) * 251.2} 251.2`}
                            strokeDashoffset="62.8"
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                        <div className="circle-chart-text">
                          {getVisitedContinents().length}/7
                        </div>
                      </div>
                    </div>
                    <div className="stats-text">
                      <div className="stats-main">{getVisitedContinents().length}/7</div>
                      <div className="stats-sub">Including Antarctica</div>
                    </div>
                  </div>
                </div>

                {/* Countries Card */}
                <div className="stats-card">
                  <div className="stats-card-header">
                    <h5>Countries</h5>
                  </div>
                  <div className="stats-card-content">
                    <div className="circle-chart">
                      <div className="circle-chart-svg">
                        <svg viewBox="0 0 100 100" className="circle-chart-svg">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#e9ecef"
                            strokeWidth="8"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={getChartColor(selectedList)}
                            strokeWidth="8"
                            strokeDasharray={`${(currentListCountries.length / countries.length) * 251.2} 251.2`}
                            strokeDashoffset="62.8"
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                        <div className="circle-chart-text">
                          {currentListCountries.length}
                        </div>
                      </div>
                    </div>
                    <div className="stats-text">
                      <div className="stats-main">{currentListCountries.length}</div>
                      <div className="stats-sub">out of {countries.length} countries</div>
                    </div>
                  </div>
                </div>

                {/* Continent Breakdown */}
                {getContinentStats().map((continent, index) => (
                  <div key={continent.name} className="stats-card">
                    <div className="stats-card-header">
                      <h5>{continent.name}</h5>
                    </div>
                    <div className="stats-card-content">
                      <div className="circle-chart">
                        <div className="circle-chart-svg">
                          <svg viewBox="0 0 100 100" className="circle-chart-svg">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#e9ecef"
                              strokeWidth="8"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={continent.color}
                              strokeWidth="8"
                              strokeDasharray={`${(continent.visited / continent.total) * 251.2} 251.2`}
                              strokeDashoffset="62.8"
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                          <div className="circle-chart-text">
                            {continent.visited}
                          </div>
                        </div>
                      </div>
                      <div className="stats-text">
                        <div className="stats-main">{continent.visited}/{continent.total}</div>
                        <div className="stats-sub">
                          {continent.name === 'Antarctica' ? 'All territories' : 'countries recognized by the UN'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <DatePickerPopup
        isOpen={showDatePicker}
        onClose={handleCloseDatePicker}
        onSave={handleSaveDates}
        countryName={selectedCountry?.name}
        existingDates={selectedCountry ? getCurrentListVisitDates(selectedCountry.alpha3) : []}
      />
      
      {showCitySelector && citySelectorCountry && (
        <EnhancedCitySelector
          countryAlpha3={citySelectorCountry.alpha3}
          countryName={citySelectorCountry.name}
          onClose={handleCitySelectorClose}
          onCreateNewVisit={handleCreateNewVisit}
        />
      )}
      
      {showVisitCitySelector && visitCitySelectorData && (
        <VisitCitySelector
          countryAlpha3={visitCitySelectorData.country.alpha3}
          countryName={visitCitySelectorData.country.name}
          visitIndex={visitCitySelectorData.visitIndex}
          visitDates={visitCitySelectorData.visitDates}
          onClose={handleVisitCitySelectorClose}
        />
      )}
      
      {showVisitRegionSelector && visitRegionSelectorData && (
        <RegionSelector
          countryAlpha3={visitRegionSelectorData.country.alpha3}
          countryName={visitRegionSelectorData.country.name}
          visitIndex={visitRegionSelectorData.visitIndex}
          visitDates={visitRegionSelectorData.visitDates}
          onClose={handleVisitRegionSelectorClose}
        />
      )}
      
      {showRegionSelector && regionSelectorData && (
        <EnhancedRegionSelector
          countryAlpha3={regionSelectorData.country.alpha3}
          countryName={regionSelectorData.country.name}
          onClose={handleRegionSelectorClose}
          onCreateNewVisit={handleCreateNewVisit}
        />
      )}
    </>
  );
});

export default Sidebar;
