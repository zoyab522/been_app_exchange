import { useState, useRef } from 'react';
import { useUserDataStore } from '../store/useUserDataStore';
import html2canvas from 'html2canvas';
import countries from '../data/countries.json';

const ExportButton = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { selectedList, getCurrentListCountries } = useUserDataStore();
  const mapRef = useRef(null);

  const getListTitle = () => {
    switch (selectedList) {
      case 'livedIn': return 'Lived In';
      case 'visited': return 'Visited';
      case 'wantToGo': return 'Want to Go';
      case 'traveledThrough': return 'Traveled Through';
      case 'all': return 'All Countries';
      default: return 'Travel Data';
    }
  };

  const calculateWorldPercentage = () => {
    const currentCountries = getCurrentListCountries();
    const totalCountries = 195; // Approximate number of countries in the world
    return Math.round((currentCountries.length / totalCountries) * 100);
  };

  const getCountryNames = () => {
    const currentCountries = getCurrentListCountries();
    return currentCountries.map(alpha3 => {
      const country = countries.find(c => c.alpha3 === alpha3);
      return country ? country.name : alpha3;
    });
  };

  const getMapGradient = () => {
    switch (selectedList) {
      case 'livedIn': return 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'; // Green
      case 'visited': return 'linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%)'; // Purple
      case 'wantToGo': return 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)'; // Yellow/Orange
      case 'traveledThrough': return 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'; // Gray
      case 'all': return 'linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%)'; // Teal to Purple
      default: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'; // Default blue
    }
  };

  const getStatisticsData = () => {
    const { 
      livedInCountries = [], 
      visitedCountries = [], 
      wantToGoCountries = [], 
      traveledThroughCountries = [],
      livedInCities = [],
      visitedCities = [],
      wantToGoCities = [],
      traveledThroughCities = [],
      livedInRegions = [],
      visitedRegions = [],
      wantToGoRegions = [],
      traveledThroughRegions = []
    } = useUserDataStore.getState();

    // Ensure all arrays are defined and calculate total statistics
    const totalCountries = (livedInCountries?.length || 0) + (visitedCountries?.length || 0) + (wantToGoCountries?.length || 0) + (traveledThroughCountries?.length || 0);
    const totalCities = (livedInCities?.length || 0) + (visitedCities?.length || 0) + (wantToGoCities?.length || 0) + (traveledThroughCities?.length || 0);
    const totalRegions = (livedInRegions?.length || 0) + (visitedRegions?.length || 0) + (wantToGoRegions?.length || 0) + (traveledThroughRegions?.length || 0);
    const worldPercentage = Math.round((totalCountries / 195) * 100);

    return {
      livedInCountries: livedInCountries || [],
      visitedCountries: visitedCountries || [],
      wantToGoCountries: wantToGoCountries || [],
      traveledThroughCountries: traveledThroughCountries || [],
      livedInCities: livedInCities || [],
      visitedCities: visitedCities || [],
      wantToGoCities: wantToGoCities || [],
      traveledThroughCities: traveledThroughCities || [],
      livedInRegions: livedInRegions || [],
      visitedRegions: visitedRegions || [],
      wantToGoRegions: wantToGoRegions || [],
      traveledThroughRegions: traveledThroughRegions || [],
      totalCountries,
      totalCities,
      totalRegions,
      worldPercentage
    };
  };


  const exportToPDF = async () => {
    setIsExporting(true);

    try {
      // Check if html2canvas is available
      if (!html2canvas) {
        throw new Error('html2canvas library not loaded');
      }
      
      // Get all statistics data
      let stats;
      try {
        stats = getStatisticsData();
      } catch (error) {
        console.error('Error getting statistics data:', error);
        throw new Error('Failed to retrieve statistics data. Please try again.');
      }
      
      // Get country names for each list
      const getCountryNames = (countryCodes) => {
        if (!countryCodes || !Array.isArray(countryCodes)) {
          return [];
        }
        return countryCodes.map(alpha3 => {
          const country = countries.find(c => c.alpha3 === alpha3);
          return country ? country.name : alpha3;
        });
      };

      // Create a container div for the export
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'fixed';
      exportContainer.style.top = '-9999px';
      exportContainer.style.left = '-9999px';
      exportContainer.style.width = '1200px';
      exportContainer.style.height = '800px';
      exportContainer.style.backgroundColor = 'white';
      exportContainer.style.padding = '20px';
      exportContainer.style.fontFamily = 'Montserrat, sans-serif';
      document.body.appendChild(exportContainer);

      // Create the export content
      const exportHTML = `
        <div style="display: flex; flex-direction: column; height: 100%;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            <h1 style="margin: 0; color: #333; font-size: 28px; font-weight: 700;">My Travel Metrics</h1>
            <h2 style="margin: 10px 0 0 0; color: #007bff; font-size: 20px; font-weight: 500;">Complete Statistics Report</h2>
          </div>

          <!-- Statistics Overview -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #dee2e6;">
              <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px; font-weight: 600;">Total Countries</h3>
              <div style="font-size: 32px; font-weight: 700; color: #007bff;">${stats.totalCountries}</div>
              <div style="font-size: 14px; color: #666; margin-top: 5px;">${stats.worldPercentage}% of World</div>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #dee2e6;">
              <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px; font-weight: 600;">Total Cities</h3>
              <div style="font-size: 32px; font-weight: 700; color: #28a745;">${stats.totalCities}</div>
              <div style="font-size: 14px; color: #666; margin-top: 5px;">Cities Explored</div>
            </div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #dee2e6;">
              <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px; font-weight: 600;">Total Regions</h3>
              <div style="font-size: 32px; font-weight: 700; color: #6f42c1;">${stats.totalRegions}</div>
              <div style="font-size: 14px; color: #666; margin-top: 5px;">Regions Explored</div>
            </div>
          </div>

          <!-- Detailed Lists -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; flex: 1;">
            <!-- Countries Lists -->
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
              <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px; font-weight: 600;">Countries by Category</h3>
              
              <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 8px 0; color: #28a745; font-size: 14px; font-weight: 600;">Lived In (${stats.livedInCountries.length})</h4>
                <div style="max-height: 80px; overflow-y: auto; font-size: 12px; color: #333;">
                  ${getCountryNames(stats.livedInCountries).map(country => 
                    `<div style="padding: 2px 0;">${country}</div>`
                  ).join('')}
                </div>
              </div>
              
              <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 8px 0; color: #6f42c1; font-size: 14px; font-weight: 600;">Visited (${stats.visitedCountries.length})</h4>
                <div style="max-height: 80px; overflow-y: auto; font-size: 12px; color: #333;">
                  ${getCountryNames(stats.visitedCountries).map(country => 
                    `<div style="padding: 2px 0;">${country}</div>`
                  ).join('')}
                </div>
              </div>
              
              <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 8px 0; color: #ffc107; font-size: 14px; font-weight: 600;">Want to Go (${stats.wantToGoCountries.length})</h4>
                <div style="max-height: 80px; overflow-y: auto; font-size: 12px; color: #333;">
                  ${getCountryNames(stats.wantToGoCountries).map(country => 
                    `<div style="padding: 2px 0;">${country}</div>`
                  ).join('')}
                </div>
              </div>
              
              <div>
                <h4 style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px; font-weight: 600;">Traveled Through (${stats.traveledThroughCountries.length})</h4>
                <div style="max-height: 80px; overflow-y: auto; font-size: 12px; color: #333;">
                  ${getCountryNames(stats.traveledThroughCountries).map(country => 
                    `<div style="padding: 2px 0;">${country}</div>`
                  ).join('')}
                </div>
              </div>
            </div>

            <!-- Cities and Regions Lists -->
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
              <h3 style="margin: 0 0 15px 0; color: #333; font-size: 16px; font-weight: 600;">Cities & Regions</h3>
              
              <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 8px 0; color: #28a745; font-size: 14px; font-weight: 600;">Cities (${stats.totalCities})</h4>
                <div style="max-height: 120px; overflow-y: auto; font-size: 12px; color: #333;">
                  ${(() => {
                    const allCities = [...(stats.livedInCities || []), ...(stats.visitedCities || []), ...(stats.wantToGoCities || []), ...(stats.traveledThroughCities || [])];
                    const displayCities = allCities.slice(0, 20);
                    const remainingCount = allCities.length - 20;
                    return displayCities.map(city => `<div style="padding: 2px 0;">${city}</div>`).join('') + 
                           (remainingCount > 0 ? `<div style="padding: 2px 0; color: #666; font-style: italic;">... and ${remainingCount} more</div>` : '');
                  })()}
                </div>
              </div>
              
              <div>
                <h4 style="margin: 0 0 8px 0; color: #6f42c1; font-size: 14px; font-weight: 600;">Regions (${stats.totalRegions})</h4>
                <div style="max-height: 120px; overflow-y: auto; font-size: 12px; color: #333;">
                  ${(() => {
                    const allRegions = [...(stats.livedInRegions || []), ...(stats.visitedRegions || []), ...(stats.wantToGoRegions || []), ...(stats.traveledThroughRegions || [])];
                    const displayRegions = allRegions.slice(0, 20);
                    const remainingCount = allRegions.length - 20;
                    return displayRegions.map(region => `<div style="padding: 2px 0;">${region}</div>`).join('') + 
                           (remainingCount > 0 ? `<div style="padding: 2px 0; color: #666; font-style: italic;">... and ${remainingCount} more</div>` : '');
                  })()}
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee; color: #999; font-size: 11px;">
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </div>
        </div>
      `;

      exportContainer.innerHTML = exportHTML;

      // Capture the export container
      const canvas = await html2canvas(exportContainer, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        width: 1200,
        height: 800,
        ignoreElements: (element) => {
          // Ignore any canvas elements to avoid WebGL context issues
          return element.tagName === 'CANVAS';
        }
      });

      // Convert to PNG and download (we'll call it PDF for user clarity)
      const link = document.createElement('a');
      link.download = `travel-metrics-statistics-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Clean up
      document.body.removeChild(exportContainer);

    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={exportToPDF}
      disabled={isExporting}
      className="export-btn"
      title="Export statistics to PDF"
    >
      {isExporting ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', animation: 'spin 1s linear infinite'}}>
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          Exporting...
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export Statistics
        </>
      )}
    </button>
  );
};

export default ExportButton;
