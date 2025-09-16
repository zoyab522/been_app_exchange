import { useUserDataStore } from '../store/useUserDataStore';

const ListSelector = ({ selectedList, onListChange }) => {
  const updateHighlightedCountries = useUserDataStore((state) => state.updateHighlightedCountries);

  const handleListChange = (listType) => {
    onListChange(listType);
    // Update the highlighted countries to show the selected list
    updateHighlightedCountries();
  };

  const tabs = [
    { id: 'livedIn', label: 'Lived In' },
    { id: 'visited', label: 'Visited' },
    { id: 'wantToGo', label: 'Want to Go' },
    { id: 'traveledThrough', label: 'Traveled Through' },
    { id: 'all', label: 'All' }
  ];

  return (
    <div className="list-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`list-tab ${selectedList === tab.id ? 'active' : ''}`}
          onClick={() => handleListChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default ListSelector;