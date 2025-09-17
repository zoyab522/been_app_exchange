import { useState, useEffect } from 'react';
import './WelcomePopup.css';

const WelcomePopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome popup before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    
    if (!hasSeenWelcome) {
      // Show popup after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Remember that user has seen the welcome popup
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="welcome-popup-backdrop" onClick={handleBackdropClick}>
      <div className="welcome-popup">
        <div className="welcome-popup-header">
          <h2 className="welcome-popup-title">
            ✈️ Been
          </h2>
          <button 
            className="welcome-popup-close"
            onClick={handleClose}
            aria-label="Close welcome popup"
          >
            ×
          </button>
        </div>
        
        <div className="welcome-popup-content">
          <p className="welcome-popup-description">
            Track your travel experiences and explore the world you've discovered! 
            
          </p>
          
          <div className="welcome-popup-features">
            <ul>
              <li>📍 <strong>Visualize Travels</strong> - Highlight countries you've been to on the map</li>
              <li>📊 <strong>See How Much You've Explored </strong> - View your world exploration percentage</li>
              <li>📅 <strong>Timeline</strong> - See your travel history chronologically</li>
              <li>📤 <strong>Export</strong> - Save your travel statistics as a PDF</li>
            </ul>
          </div>
          
          <div className="welcome-popup-footer">
            <button 
              className="welcome-popup-button"
              onClick={handleClose}
            >
              Start Exploring! 🌍
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;
