import React, { useState, useEffect } from 'react';
import drillsData from './drills.json';

function DrillsPage() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [drills, setDrills] = useState([]);
  const [achievements, setAchievements] = useState({});
  const [sessionDrills, setSessionDrills] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Load achievements from localStorage on initial load
  useEffect(() => {
    const savedAchievements = localStorage.getItem('drillAchievements');
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    }
  }, []);

  // Save achievements to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('drillAchievements', JSON.stringify(achievements));
  }, [achievements]);

  // Update drills when category changes
  useEffect(() => {
    if (selectedCategory) {
      setDrills(drillsData[selectedCategory] || []);
    } else {
      // When no category is selected, show all drills
      const allDrills = Object.values(drillsData).flat();
      setDrills(allDrills);
    }
  }, [selectedCategory]);

  // Get all available categories from the drill data
  const categories = Object.keys(drillsData).map(key => ({
    id: key,
    label: key.charAt(0).toUpperCase() + key.slice(1).replace('-', ' ')
  }));

  // Update achievement level for a drill
  const updateAchievement = (drillId, level) => {
    setAchievements(prev => ({
      ...prev,
      [drillId]: level
    }));
  };

  // Add drill to practice session
  const addToSession = (drill) => {
    setSessionDrills(prev => [...prev, drill]);
    setShowConfirmation(true);
    
    // Hide confirmation after 2 seconds
    setTimeout(() => {
      setShowConfirmation(false);
    }, 2000);
  };

  // Create practice session from selected drills
  const createSession = () => {
    if (sessionDrills.length === 0) return;
    
    // Calculate total duration
    const totalDuration = sessionDrills.reduce((total, drill) => total + drill.duration, 0);
    
    // Determine focus areas
    const focusAreas = [...new Set(sessionDrills.map(drill => {
      // Extract category from drill ID (e.g., "putting-ladder" → "putting")
      return drill.id.split('-')[0];
    }))];
    
    // Create session object
    const newSession = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      duration: totalDuration,
      focus: focusAreas.join(', '),
      notes: `Drills: ${sessionDrills.map(d => d.name).join(', ')}`,
      drills: sessionDrills
    };
    
    // Get existing sessions
    const existingSessions = JSON.parse(localStorage.getItem('golfSessions') || '[]');
    
    // Add new session to the beginning
    const updatedSessions = [newSession, ...existingSessions];
    
    // Save to localStorage
    localStorage.setItem('golfSessions', JSON.stringify(updatedSessions));
    
    // Clear session drills
    setSessionDrills([]);
    
    // Show confirmation
    alert('Practice session created successfully!');
  };

  // Remove drill from session
  const removeFromSession = (drillId) => {
    setSessionDrills(prev => prev.filter(drill => drill.id !== drillId));
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Session Builder Panel (if drills are selected) */}
      {sessionDrills.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 shadow-lg">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Creating Practice Session</h3>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                {sessionDrills.reduce((total, drill) => total + drill.duration, 0)} mins
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-2">
              {sessionDrills.map(drill => (
                <div key={drill.id} className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center">
                  {drill.name}
                  <button 
                    onClick={() => removeFromSession(drill.id)}
                    className="ml-1 text-gray-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            <button
              onClick={createSession}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Create Practice Session
            </button>
          </div>
        </div>
      )}
      
      {/* Alert Animation */}
      {showConfirmation && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 px-4 py-2 rounded shadow-md animate-fade">
          Drill added to session!
        </div>
      )}
      
      {/* Category Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md sticky top-0 z-10">
        <label className="block text-sm font-medium mb-2">Filter by Category</label>
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1 rounded text-sm ${
              selectedCategory === '' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setSelectedCategory('')}
          >
            All
          </button>
          
          {categories.map(category => (
            <button
              key={category.id}
              className={`px-3 py-1 rounded text-sm ${
                selectedCategory === category.id ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Drills List */}
      <div className="space-y-6 pb-24">
        {drills.map(drill => (
          <div key={drill.id} className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-semibold">{drill.name}</h2>
              <div className="flex items-center">
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2">
                  {drill.duration} mins
                </span>
                <button 
                  onClick={() => addToSession(drill)}
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                >
                  Add to Session
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 mb-3 text-sm">{drill.description}</p>
            
            {/* Achievement Levels */}
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Achievement Levels</h3>
              <div className="grid grid-cols-3 gap-2">
                {['beginner', 'intermediate', 'advanced'].map(level => (
                  <button
                    key={level}
                    onClick={() => updateAchievement(drill.id, level)}
                    className={`text-xs py-1 px-2 rounded border ${
                      achievements[drill.id] === level
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {drill.achievements[achievements[drill.id] || 'beginner']}
              </div>
            </div>
          </div>
        ))}
        
        {drills.length === 0 && (
          <p className="text-gray-500 text-center py-6">No drills found</p>
        )}
      </div>
    </div>
  );
}

export default DrillsPage;