// import { create } from 'zustand';

// export const useUserDataStore = create((set) => ({
//   selectedList: 'visited',
//   highlightedCountry: null,

//   setHighlightedCountry: (iso) => set({ highlightedCountry: iso }),
// }));

import { create } from 'zustand';

export const useUserDataStore = create((set) => ({
  selectedList: 'livedIn',
  highlightedCountries: [],
  
  // Separate arrays for each list type
  livedInCountries: [],
  visitedCountries: [],
  wantToGoCountries: [],
  traveledThroughCountries: [],

  // Store visit dates for countries
  countryVisitDates: {}, // { alpha3: [{ from: '2023-01-01', to: '2023-01-15', transport: ['plane'], cities: ['city1', 'city2'], regions: ['region1', 'region2'] }] }

  // Store selected cities for each country (legacy - will be migrated to visit-based storage)
  countryCities: {}, // { alpha3: ['city1', 'city2'] }
  // Store selected regions for each country (legacy - will be migrated to visit-based storage)
  countryRegions: {}, // { alpha3: ['region1', 'region2'] }
  // Store city markers visibility for each country
  showCityMarkers: {}, // { alpha3: true/false }

  setSelectedList: (listType) => set({ selectedList: listType }),

  addHighlightedCountry: (alpha3) =>
    set((state) => {
      // Don't allow adding countries when "all" is selected (it's a read-only combined view)
      if (state.selectedList === 'all') {
        return state;
      }
      
      const listKey = state.selectedList === 'livedIn' ? 'livedInCountries' :
                     state.selectedList === 'visited' ? 'visitedCountries' :
                     state.selectedList === 'wantToGo' ? 'wantToGoCountries' :
                     state.selectedList === 'traveledThrough' ? 'traveledThroughCountries' :
                     'highlightedCountries';
      
      const currentList = state[listKey];
      
      if (currentList.includes(alpha3)) {
        return state; // Country already in list
      }
      
      return {
        [listKey]: [...currentList, alpha3],
        highlightedCountries: [...currentList, alpha3], // Update the main array for map
      };
    }),

  addCountryWithDates: (alpha3, visitDates = []) =>
    set((state) => {
      // Don't allow adding countries when "all" is selected (it's a read-only combined view)
      if (state.selectedList === 'all') {
        return state;
      }
      
      const listKey = state.selectedList === 'livedIn' ? 'livedInCountries' :
                     state.selectedList === 'visited' ? 'visitedCountries' :
                     state.selectedList === 'wantToGo' ? 'wantToGoCountries' :
                     state.selectedList === 'traveledThrough' ? 'traveledThroughCountries' :
                     'highlightedCountries';
      
      const currentList = state[listKey];
      
      if (currentList.includes(alpha3)) {
        return state; // Country already in list
      }
      
      // Store dates per list, not globally
      const listDatesKey = `${alpha3}_${state.selectedList}`;
      
      return {
        [listKey]: [...currentList, alpha3],
        highlightedCountries: [...currentList, alpha3],
        countryVisitDates: {
          ...state.countryVisitDates,
          [listDatesKey]: visitDates
        }
      };
    }),

  updateCountryDates: (alpha3, visitDates) =>
    set((state) => {
      const listDatesKey = `${alpha3}_${state.selectedList}`;
      return {
        countryVisitDates: {
          ...state.countryVisitDates,
          [listDatesKey]: visitDates
        }
      };
    }),

  removeVisitDate: (alpha3, visitIndex) =>
    set((state) => {
      const listDatesKey = `${alpha3}_${state.selectedList}`;
      const currentDates = state.countryVisitDates[listDatesKey] || [];
      const updatedDates = currentDates.filter((_, index) => index !== visitIndex);
      
      return {
        countryVisitDates: {
          ...state.countryVisitDates,
          [listDatesKey]: updatedDates
        }
      };
    }),

  removeHighlightedCountry: (alpha3) =>
    set((state) => {
      // Don't allow removing countries when "all" is selected (it's a read-only combined view)
      if (state.selectedList === 'all') {
        return state;
      }
      
      const listKey = state.selectedList === 'livedIn' ? 'livedInCountries' :
                     state.selectedList === 'visited' ? 'visitedCountries' :
                     state.selectedList === 'wantToGo' ? 'wantToGoCountries' :
                     state.selectedList === 'traveledThrough' ? 'traveledThroughCountries' :
                     'highlightedCountries';
      
      const filteredList = state[listKey].filter((c) => c !== alpha3);
      
      return {
        [listKey]: filteredList,
        highlightedCountries: filteredList, // Update the main array for map
      };
    }),

  clearHighlightedCountries: () =>
    set((state) => {
      // Don't allow clearing countries when "all" is selected (it's a read-only combined view)
      if (state.selectedList === 'all') {
        return state;
      }
      
      const listKey = state.selectedList === 'livedIn' ? 'livedInCountries' :
                     state.selectedList === 'visited' ? 'visitedCountries' :
                     state.selectedList === 'wantToGo' ? 'wantToGoCountries' :
                     state.selectedList === 'traveledThrough' ? 'traveledThroughCountries' :
                     'highlightedCountries';
      
      return {
        [listKey]: [],
        highlightedCountries: [],
      };
    }),

  // Function to update highlightedCountries when switching lists
  updateHighlightedCountries: () =>
    set((state) => {
      if (state.selectedList === 'all') {
        // Combine all countries from all lists
        const allCountries = new Set([
          ...(state.livedInCountries || []),
          ...(state.visitedCountries || []),
          ...(state.wantToGoCountries || []),
          ...(state.traveledThroughCountries || [])
        ]);
        return {
          highlightedCountries: Array.from(allCountries)
        };
      }
      
      const listKey = state.selectedList === 'livedIn' ? 'livedInCountries' :
                     state.selectedList === 'visited' ? 'visitedCountries' :
                     state.selectedList === 'wantToGo' ? 'wantToGoCountries' :
                     state.selectedList === 'traveledThrough' ? 'traveledThroughCountries' :
                     'highlightedCountries';
      
      return {
        highlightedCountries: state[listKey] || [],
      };
    }),

  // City management functions
  addCityToCountry: (alpha3, cityName) =>
    set((state) => {
      const currentCities = state.countryCities[alpha3] || [];
      if (currentCities.includes(cityName)) {
        return state; // City already added
      }
      
      return {
        countryCities: {
          ...state.countryCities,
          [alpha3]: [...currentCities, cityName]
        }
      };
    }),

  removeCityFromCountry: (alpha3, cityName) =>
    set((state) => {
      const currentCities = state.countryCities[alpha3] || [];
      const filteredCities = currentCities.filter(city => city !== cityName);
      
      return {
        countryCities: {
          ...state.countryCities,
          [alpha3]: filteredCities
        }
      };
    }),

  getCitiesForCountry: (alpha3) => {
    const state = useUserDataStore.getState();
    return state.countryCities[alpha3] || [];
  },

  // Region management functions (similar to city functions)
  addRegionToCountry: (alpha3, regionName) =>
    set((state) => {
      const currentRegions = state.countryRegions[alpha3] || [];
      if (currentRegions.includes(regionName)) {
        return state; // Region already added
      }
      
      return {
        countryRegions: {
          ...state.countryRegions,
          [alpha3]: [...currentRegions, regionName]
        }
      };
    }),

  removeRegionFromCountry: (alpha3, regionName) =>
    set((state) => {
      const currentRegions = state.countryRegions[alpha3] || [];
      const updatedRegions = currentRegions.filter(region => region !== regionName);
      
      return {
        countryRegions: {
          ...state.countryRegions,
          [alpha3]: updatedRegions
        }
      };
    }),

  getRegionsForCountry: (alpha3) => {
    const state = useUserDataStore.getState();
    return state.countryRegions[alpha3] || [];
  },

  // City markers visibility functions
  setShowCityMarkers: (alpha3, show) =>
    set((state) => ({
      showCityMarkers: {
        ...state.showCityMarkers,
        [alpha3]: show
      }
    })),

  getShowCityMarkers: (alpha3) => {
    const state = useUserDataStore.getState();
    return state.showCityMarkers[alpha3] || false;
  },

  // New functions for managing cities within visits
  addCityToVisit: (alpha3, visitIndex, cityName) =>
    set((state) => {
      const listDatesKey = `${alpha3}_${state.selectedList}`;
      const currentDates = state.countryVisitDates[listDatesKey] || [];
      if (visitIndex >= currentDates.length) return state;
      
      const updatedDates = [...currentDates];
      const visit = { ...updatedDates[visitIndex] };
      visit.cities = visit.cities || [];
      
      if (!visit.cities.includes(cityName)) {
        visit.cities = [...visit.cities, cityName];
        updatedDates[visitIndex] = visit;
        
        return {
          countryVisitDates: {
            ...state.countryVisitDates,
            [listDatesKey]: updatedDates
          }
        };
      }
      
      return state;
    }),

  removeCityFromVisit: (alpha3, visitIndex, cityName) =>
    set((state) => {
      const listDatesKey = `${alpha3}_${state.selectedList}`;
      const currentDates = state.countryVisitDates[listDatesKey] || [];
      if (visitIndex >= currentDates.length) return state;
      
      const updatedDates = [...currentDates];
      const visit = { ...updatedDates[visitIndex] };
      visit.cities = visit.cities || [];
      
      visit.cities = visit.cities.filter(city => city !== cityName);
      updatedDates[visitIndex] = visit;
      
      return {
        countryVisitDates: {
          ...state.countryVisitDates,
          [listDatesKey]: updatedDates
        }
      };
    }),

  getCitiesForVisit: (alpha3, visitIndex, listType = null) => {
    const state = useUserDataStore.getState();
    const list = listType || state.selectedList;
    const listDatesKey = `${alpha3}_${list}`;
    const visits = state.countryVisitDates[listDatesKey] || [];
    if (visitIndex >= visits.length) return [];
    return visits[visitIndex].cities || [];
  },

  // Get all cities for a country (from all visits + legacy cities)
  getAllCitiesForCountry: (alpha3) => {
    const state = useUserDataStore.getState();
    const legacyCities = state.countryCities[alpha3] || [];
    const allCities = new Set();
    
    // Add cities from visits in all lists
    const listTypes = ['livedIn', 'visited', 'traveledThrough'];
    listTypes.forEach(listType => {
      const listDatesKey = `${alpha3}_${listType}`;
      const visits = state.countryVisitDates[listDatesKey] || [];
      visits.forEach(visit => {
        if (visit.cities) {
          visit.cities.forEach(city => allCities.add(city));
        }
      });
    });
    
    // Add legacy cities (cities added directly without visits)
    legacyCities.forEach(city => allCities.add(city));
    
    return Array.from(allCities);
  },

  // Region management functions (similar to city functions)
  addRegionToVisit: (alpha3, visitIndex, regionName) =>
    set((state) => {
      const listDatesKey = `${alpha3}_${state.selectedList}`;
      const currentDates = state.countryVisitDates[listDatesKey] || [];
      if (visitIndex >= currentDates.length) return state;
      
      const updatedDates = [...currentDates];
      const visit = { ...updatedDates[visitIndex] };
      visit.regions = visit.regions || [];
      
      if (!visit.regions.includes(regionName)) {
        visit.regions = [...visit.regions, regionName];
        updatedDates[visitIndex] = visit;
        
        return {
          countryVisitDates: {
            ...state.countryVisitDates,
            [listDatesKey]: updatedDates
          }
        };
      }
      
      return state;
    }),

  removeRegionFromVisit: (alpha3, visitIndex, regionName) =>
    set((state) => {
      const listDatesKey = `${alpha3}_${state.selectedList}`;
      const currentDates = state.countryVisitDates[listDatesKey] || [];
      if (visitIndex >= currentDates.length) return state;
      
      const updatedDates = [...currentDates];
      const visit = { ...updatedDates[visitIndex] };
      visit.regions = visit.regions || [];
      
      visit.regions = visit.regions.filter(region => region !== regionName);
      updatedDates[visitIndex] = visit;
      
      return {
        countryVisitDates: {
          ...state.countryVisitDates,
          [listDatesKey]: updatedDates
        }
      };
    }),

  getRegionsForVisit: (alpha3, visitIndex, listType = null) => {
    const state = useUserDataStore.getState();
    const list = listType || state.selectedList;
    const listDatesKey = `${alpha3}_${list}`;
    const visits = state.countryVisitDates[listDatesKey] || [];
    if (visitIndex >= visits.length) return [];
    return visits[visitIndex].regions || [];
  },

  // Get all regions for a country (from all visits + legacy regions)
  getAllRegionsForCountry: (alpha3) => {
    const state = useUserDataStore.getState();
    const legacyRegions = state.countryRegions[alpha3] || [];
    const allRegions = new Set();
    
    // Add regions from visits in all lists
    const listTypes = ['livedIn', 'visited', 'traveledThrough'];
    listTypes.forEach(listType => {
      const listDatesKey = `${alpha3}_${listType}`;
      const visits = state.countryVisitDates[listDatesKey] || [];
      visits.forEach(visit => {
        if (visit.regions) {
          visit.regions.forEach(region => allRegions.add(region));
        }
      });
    });
    
    // Add legacy regions (regions added directly without visits)
    legacyRegions.forEach(region => allRegions.add(region));
    
    return Array.from(allRegions);
  },

  // Get countries for the currently selected list
  getCurrentListCountries: () => {
    const state = useUserDataStore.getState();
    switch (state.selectedList) {
      case 'livedIn': return state.livedInCountries;
      case 'visited': return state.visitedCountries;
      case 'wantToGo': return state.wantToGoCountries;
      case 'traveledThrough': return state.traveledThroughCountries;
      case 'all': {
        // Combine all countries from all lists
        const allCountries = new Set([
          ...state.livedInCountries,
          ...state.visitedCountries,
          ...state.wantToGoCountries,
          ...state.traveledThroughCountries
        ]);
        return Array.from(allCountries);
      }
      default: return [];
    }
  },
}));