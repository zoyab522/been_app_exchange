import { useState, useEffect, useRef } from 'react'
import Map from '../components/Map'
import SearchBar from '../components/SearchBar'
import ListSelector from '../components/ListSelector'
import Sidebar from '../components/Sidebar'
import DatePickerPopup from '../components/DatePickerPopup'
import ExportButton from '../components/ExportButton'
import { useUserDataStore } from '../store/useUserDataStore'

const MapView = () => {
  const [isGlobeView, setIsGlobeView] = useState(false);
  const [selectedList, setSelectedList] = useState('livedIn');
  // Removed isSliding state - no longer needed without arrow navigation
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024 && window.innerWidth > 768);
  const [showTabsDropdown, setShowTabsDropdown] = useState(false);
  const [countryAdded, setCountryAdded] = useState(false);

  // Refs for export functionality
  const mapRef = useRef(null);
  const sidebarRef = useRef(null);

  const addCountryWithDates = useUserDataStore((state) => state.addCountryWithDates);
  const countryVisitDates = useUserDataStore((state) => state.countryVisitDates);

  const listOrder = ['livedIn', 'visited', 'wantToGo', 'traveledThrough', 'all'];
  const currentIndex = listOrder.indexOf(selectedList);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const wasMobile = isMobile;
      const wasTablet = isTablet;
      
      setIsMobile(width <= 768);
      setIsTablet(width <= 1024 && width > 768);
      
      // On mobile, if sidebar is open, close it when resizing to larger screens
      if (width > 1024 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
      
      // If transitioning from mobile/tablet to desktop, trigger map resize
      if ((wasMobile || wasTablet) && width > 1200) {
        // Small delay to ensure CSS transitions complete
        setTimeout(() => {
          const map = window.mapRef?.current;
          if (map) {
            map.resize();
          }
        }, 300);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen, isMobile, isTablet]);

  // Navigation functions removed - using dots in top bar instead

  const toggleView = () => {
    const map = window.mapRef?.current;
    if (map) {
      if (isGlobeView) {
        // Switch to 2D map view
        map.setProjection('mercator');
        map.setCenter([0, 20]);
        map.setZoom(1.5);
      } else {
        // Switch to 3D globe view
        map.setProjection('globe');
        map.setCenter([0, 20]);
        map.setZoom(1.5);
      }
      setIsGlobeView(!isGlobeView);
    }
  };

  const handleDatePickerOpen = (country) => {
    setSelectedCountry(country);
    setShowDatePicker(true);
  };

  const handleDatePickerClose = () => {
    setShowDatePicker(false);
    setSelectedCountry(null);
  };

  // For sidebar behavior, treat tablet as mobile (full-width sidebar)
  const isMobileOrTablet = isMobile || isTablet;
  
  // On mobile/tablet, show either map or sidebar, not both
  const showMap = !isMobileOrTablet || !isSidebarOpen;
  const showSidebar = isMobileOrTablet ? isSidebarOpen : true;
  
  // Show dropdown when sidebar is open on wider screens (not mobile/tablet)
  const shouldShowDropdown = isSidebarOpen && !isMobileOrTablet;
  
  // Auto-hide dropdown when sidebar closes
  useEffect(() => {
    if (!isSidebarOpen) {
      setShowTabsDropdown(false);
    }
  }, [isSidebarOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTabsDropdown && !event.target.closest('.tabs-dropdown')) {
        setShowTabsDropdown(false);
      }
    };

    if (showTabsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTabsDropdown]);

  return (
    <div className="map-view">
      {/* Export Button */}
      <ExportButton />
      <div className={`main-content ${isSidebarOpen && !isMobileOrTablet ? 'sidebar-open' : ''}`}>
        {/* Top Bar - Hidden on mobile when collapsed */}
        <div className={`top-bar ${isMobile ? 'mobile' : ''}`}>
          {/* Map View Toggle - Desktop only */}
          {!isMobile && (
            <div className="map-view-toggle-switch">
              <button
                onClick={toggleView}
                className={`toggle-switch ${isGlobeView ? 'globe-active' : 'map-active'}`}
                title={isGlobeView ? 'Switch to 2D Map' : 'Switch to 3D Globe'}
              >
                <div className="toggle-switch-track">
                  <div className="toggle-switch-thumb">
                    <span className="toggle-icon">
                      {isGlobeView ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28-.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" fill="currentColor"/>
                        </svg>
                      )}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          )}
          
          {/* Search Bar - Responsive positioning */}
          <div className={`search-bar-container ${isMobile ? 'mobile' : 'desktop'}`}>
            <SearchBar 
              selectedList={selectedList} 
              onDatePickerOpen={handleDatePickerOpen}
              onCountryAdded={countryAdded}
            />
          </div>
          
          {/* Mobile Tabs - Inside top bar, below search bar */}
          {isMobile && (
            <div className="tabs-below-container mobile">
              <div className="tabs-dropdown">
                <button 
                  className="tabs-dropdown-button"
                  onClick={() => setShowTabsDropdown(!showTabsDropdown)}
                >
                  {selectedList === 'livedIn' ? 'Lived In' : 
                   selectedList === 'visited' ? 'Visited' :
                   selectedList === 'wantToGo' ? 'Want to Go' : 
                   selectedList === 'traveledThrough' ? 'Traveled Through' : 'All'}
                  <span className="dropdown-arrow">▼</span>
                </button>
                {showTabsDropdown && (
                  <div className="tabs-dropdown-menu">
                    {listOrder.map((list) => (
                      <button
                        key={list}
                        className={`tabs-dropdown-item ${selectedList === list ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedList(list);
                          setShowTabsDropdown(false);
                        }}
                      >
                        {list === 'livedIn' ? 'Lived In' : 
                         list === 'visited' ? 'Visited' :
                         list === 'wantToGo' ? 'Want to Go' : 'Traveled Through'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          
        </div>
        
        {/* Desktop Tabs Below Top Bar - Centered */}
        {!isMobile && (
          <div className="tabs-below-container desktop">
            <ListSelector selectedList={selectedList} onListChange={setSelectedList} />
          </div>
        )}
        
        {/* Map View Toggle - Fixed position bottom left - Mobile and Tablet */}
        {isMobileOrTablet && (
          <div className="map-view-toggle-fixed">
          <button
            onClick={toggleView}
            className={`toggle-switch ${isGlobeView ? 'globe-active' : 'map-active'}`}
            title={isGlobeView ? 'Switch to 2D Map' : 'Switch to 3D Globe'}
          >
            <div className="toggle-switch-track">
              <div className="toggle-switch-thumb">
                <span className="toggle-icon">
                  {isGlobeView ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" fill="currentColor"/>
                    </svg>
                  )}
                </span>
              </div>
            </div>
          </button>
        </div>
        )}
        
        {/* Map Container - Show only when not in mobile sidebar view */}
        {showMap && (
          <div className="map-container" ref={mapRef}>
            <div className="map-slider">
              <Map onToggleView={toggleView} isGlobeView={isGlobeView} selectedList={selectedList} isSidebarOpen={isSidebarOpen} />
            </div>
          </div>
        )}
      </div>
      
      {/* Sidebar Toggle Button - Different behavior for mobile vs desktop */}
      {!isSidebarOpen && (
        <button 
          className={`sidebar-toggle-fixed ${isMobile ? 'mobile' : 'desktop'}`}
          onClick={() => setIsSidebarOpen(true)}
          title={isMobile ? "Open countries view" : "Open sidebar"}
        >
          <div className="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      )}
      
      
      <Sidebar 
        ref={sidebarRef}
        selectedList={selectedList} 
        onListChange={setSelectedList}
        isOpen={isSidebarOpen}
        onToggle={setIsSidebarOpen}
        isMobile={isMobileOrTablet}
      />
      
      {/* Date Picker Popup - Rendered at top level */}
      <DatePickerPopup
        isOpen={showDatePicker}
        onClose={handleDatePickerClose}
        onSave={(visitDates) => {
          if (selectedCountry) {
            addCountryWithDates(selectedCountry.alpha3, visitDates);
            setCountryAdded(true);
            // Reset the flag after a short delay
            setTimeout(() => setCountryAdded(false), 100);
          }
          handleDatePickerClose();
        }}
        countryName={selectedCountry?.name}
        existingDates={selectedCountry ? countryVisitDates[selectedCountry.alpha3] || [] : []}
      />
    </div>
  )
}

export default MapView;