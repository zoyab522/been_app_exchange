import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useUserDataStore } from '../store/useUserDataStore';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const Map = ({ onToggleView, isGlobeView, selectedList, isSidebarOpen }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  
  // Get the appropriate countries based on selectedList
  const livedInCountries = useUserDataStore((state) => state.livedInCountries || []);
  const visitedCountries = useUserDataStore((state) => state.visitedCountries || []);
  const wantToGoCountries = useUserDataStore((state) => state.wantToGoCountries || []);
  const traveledThroughCountries = useUserDataStore((state) => state.traveledThroughCountries || []);
  const countryCities = useUserDataStore((state) => state.countryCities || {});
  
  const getCurrentListCountries = () => {
    switch (selectedList) {
      case 'livedIn': return livedInCountries;
      case 'visited': return visitedCountries;
      case 'wantToGo': return wantToGoCountries;
      case 'traveledThrough': return traveledThroughCountries;
      case 'all': {
        // Combine all countries from all lists
        const allCountries = new Set([
          ...livedInCountries,
          ...visitedCountries,
          ...wantToGoCountries,
          ...traveledThroughCountries
        ]);
        return Array.from(allCountries);
      }
      default: return [];
    }
  };
  
  const highlightedCountries = getCurrentListCountries();
  
  
  // Get highlight color based on selected list
  const getHighlightColor = (listType) => {
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
        return '#f08'; // Fallback
    }
  };
  
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [0, 20],
      zoom: 1.5,
      projection: 'mercator', // Start with 2D map view
    });

    mapRef.current = map;

    map.on('load', () => {
      map.addSource('countries', {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1',
      });
      
      const initialColor = getHighlightColor(selectedList);
      
      map.addLayer({
        id: 'country-highlight',
        type: 'fill',
        source: 'countries', 
        'source-layer': 'country_boundaries',
        paint: {  
          'fill-color': initialColor,
          'fill-opacity': 0.2, // Start with low opacity, will be updated dynamically
        },
        filter: ['in', 'iso_3166_1_alpha_3', ...highlightedCountries],
      });

    });
      // Cleanup function to remove the map on unmount
      return () => map.remove();
    }, []);


    // Update color when selected list changes by recreating the layer
    useEffect(() => {
      const map = mapRef.current;
      if (map && map.isStyleLoaded() && map.getLayer('country-highlight')) {
        const newColor = getHighlightColor(selectedList);
        
        // Remove the existing layer
        map.removeLayer('country-highlight');
        
        // Add the layer again with the new color
        map.addLayer({
          id: 'country-highlight',
          type: 'fill',
          source: 'countries', 
          'source-layer': 'country_boundaries',
          paint: {  
            'fill-color': newColor,
            'fill-opacity': 0.2, // Start with low opacity, will be updated by opacity useEffect
          },
          filter: ['in', 'iso_3166_1_alpha_3', ...highlightedCountries],
        });
        
        // Immediately apply the correct opacity after layer creation
        const opacityCases = highlightedCountries.flatMap(alpha3 => {
          const cityCount = countryCities[alpha3]?.length || 0;
          let opacity = 0.2; // Very low opacity for countries with no cities
          
          if (cityCount >= 20) opacity = 1.0;
          else if (cityCount >= 10) opacity = 0.8;
          else if (cityCount >= 5) opacity = 0.6;
          else if (cityCount >= 3) opacity = 0.5;
          else if (cityCount >= 1) opacity = 0.4;
          
          return [
            ['==', ['get', 'iso_3166_1_alpha_3'], alpha3],
            opacity
          ];
        });
        
        const opacityExpression = opacityCases.length > 0 
          ? ['case', ...opacityCases, 0.2] // Default opacity for countries not in the list
          : 0.2; // If no highlighted countries, use default opacity
        
        map.setPaintProperty('country-highlight', 'fill-opacity', opacityExpression);
      }
    }, [selectedList, highlightedCountries, countryCities]);

    // Update opacity based on city counts
    useEffect(() => {
      const map = mapRef.current;
      if (map && map.isStyleLoaded() && map.getLayer('country-highlight')) {
        // Create a data-driven opacity expression based on city counts
        const opacityCases = highlightedCountries.flatMap(alpha3 => {
          const cityCount = countryCities[alpha3]?.length || 0;
          let opacity = 0.2; // Very low opacity for countries with no cities
          
          if (cityCount >= 20) opacity = 1.0;
          else if (cityCount >= 10) opacity = 0.8;
          else if (cityCount >= 5) opacity = 0.6;
          else if (cityCount >= 3) opacity = 0.5;
          else if (cityCount >= 1) opacity = 0.4;
          
          return [
            ['==', ['get', 'iso_3166_1_alpha_3'], alpha3],
            opacity
          ];
        });
        
        const opacityExpression = opacityCases.length > 0 
          ? ['case', ...opacityCases, 0.2] // Default opacity for countries not in the list
          : 0.2; // If no highlighted countries, use default opacity
        
        map.setPaintProperty('country-highlight', 'fill-opacity', opacityExpression);
      }
    }, [highlightedCountries, countryCities]);


    // Expose map reference for parent component
    window.mapRef = mapRef;

    // Resize map when sidebar state changes
    useEffect(() => {
      const map = mapRef.current;
      if (map) {
        // Use setTimeout to ensure the CSS transition has completed
        const timeoutId = setTimeout(() => {
          map.resize();
        }, 300); // Match the CSS transition duration
        
        return () => clearTimeout(timeoutId);
      }
    }, [isSidebarOpen]);

    // Handle window resize events with debouncing to prevent excessive resizing
    useEffect(() => {
      let resizeTimeout;
      
      const handleResize = () => {
        const map = mapRef.current;
        if (map) {
          // Clear previous timeout
          clearTimeout(resizeTimeout);
          
          // Debounce resize calls to prevent excessive resizing during window resize
          resizeTimeout = setTimeout(() => {
            map.resize();
          }, 150); // Small delay to debounce rapid resize events
        }
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimeout);
      };
    }, []);

  return <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />;
}

export default Map;