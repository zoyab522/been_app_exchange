# Travel Metrics - Personal Travel Tracking App

A web app model of Been (a mobile app) built with React and Vite to visualize places you've been. I really just wanted to build a web version of this and put a spin on the user experience from my own experiences with the very popular mobile app. I also wanted to experiment with adding regions and cities :) I've spent a lot of time trying to build out the current UI and adding visits, cities, and regions in chronological order and in trying to make this as intuitive but also fun + cool as possible! 

Currently: testing this on my friends who have been all over the world to see what they have to say and incorporating what they have to say 🌍🧳

My Feature Wishlist: 
- A better view on mobile phones + tablets. It's definitely optimized for wide screens, working on reorganizing it for tiny screens. I want this to work on as many devices as possible without compromising ease of use! And I certainly don't want it to be overwhelming or too much on a screen at a time. 
- A separate layer on the map to see your cities 📍🏙️
- A separate layer to see regions/states + US states 🗾
- Better exporting (exporting the whole map view, with your stats and timeline!) 📦📤
- Log In for saving your data :D 👥📈
- Adding more locations! National Parks and airports, to name a couple! 🌲✈️
- A dark mode 🌗🌙

## Current Features

- 🗺️ **Map + Globe Visualization** - Powered by Mapbox GL JS
- 📊 **Travel Stats** - Track countries, cities, and regions explored, as well as % of the world you've seen based on places you add to you travel lists. 
- 📅 **Timeline View** - Visualize travel history chronologically
- 🏷️ **Multiple Map Views** - Organize countries by "Lived In", "Visited", "Want to Go", and "Traveled Through". Possible future additions: add your own lists!

## Tech Stack

- **Frontend**: React 18 + Vite
- **State Management**: Zustand
- **Maps**: Mapbox GL JS
- **Styling**: CSS3 with modern features
- **Export**: HTML2Canvas for PDF generation
