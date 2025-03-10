import React, { useState } from 'react';

function PracticeSessionExecutor({ sessionDrills, onComplete, onCancel }) {
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [results, setResults] = useState({});
  const [sessionComplete, setSessionComplete] = useState(false);
  
  const currentDrill = sessionDrills[currentDrillIndex];
  
  // Parse achievement requirements for the current drill
  const getAchievementRequirement = () => {
    if (!currentDrill || !currentDrill.achievements) return null;
    
    // Default to level1 (formerly beginner)
    const level = 'level1';
    const achievementText = currentDrill.achievements[level];
    
    // Try to extract the number of repetitions from the achievement text
    const match = achievementText.match(/(\d+)/);
    if (match) {
      return {
        count: parseInt(match[0]),
        text: achievementText
      };
    }
    
    return {
      count: 5, // Default if we can't parse a number
      text: achievementText
    };
  };
  
  const requirement = getAchievementRequirement();
  
  const handleResultChange = (value) => {
    setResults({
      ...results,
      [currentDrill.id]: {
        achieved: value,
        requirement: requirement
      }
    });
  };
  
  const nextDrill = () => {
    if (currentDrillIndex < sessionDrills.length - 1) {
      setCurrentDrillIndex(currentDrillIndex + 1);
    } else {
      setSessionComplete(true);
    }
  };
  
  const prevDrill = () => {
    if (currentDrillIndex > 0) {
      setCurrentDrillIndex(currentDrillIndex - 1);
    }
  };
  
  const completeSession = () => {
    // Calculate overall success percentage
    const totalDrills = sessionDrills.length;
    let successCount = 0;
    
    Object.values(results).forEach(result => {
      if (result.requirement && result.achieved >= result.requirement.count) {
        successCount++;
      }
    });
    
    const successRate = Math.round((successCount / totalDrills) * 100);
    
    // Prepare session data with results
    const sessionData = {
      drills: sessionDrills.map(drill => ({
        ...drill,
        result: results[drill.id] || { achieved: 0, requirement: requirement }
      })),
      successRate,
      completedAt: new Date().toISOString()
    };
    
    onComplete(sessionData);
  };
  
  if (sessionComplete) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Session Complete!</h2>
        
        <div className="mb-6">
          <p className="mb-2">You've completed all {sessionDrills.length} drills in this session.</p>
          <p>Click "Save Results" to log this session to your practice journal.</p>
        </div>
        
        <div className="space-y-4 mb-6">
          <h3 className="font-medium">Session Summary:</h3>
          {sessionDrills.map((drill, index) => {
            const result = results[drill.id] || { achieved: 0 };
            const requirement = result.requirement || getAchievementRequirement();
            const success = result.achieved >= requirement.count;
            
            return (
              <div key={drill.id} className="flex justify-between items-center border-b pb-2">
                <span>{index + 1}. {drill.name}</span>
                <span className={`px-2 py-1 rounded text-xs ${success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {result.achieved}/{requirement.count}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={completeSession}
            className="bg-green-600 text-white py-2 px-4 rounded flex-1 hover:bg-green-700"
          >
            Save Results
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded flex-1 hover:bg-gray-300"
          >
            Discard
          </button>
        </div>
      </div>
    );
  }
  
  if (!currentDrill) {
    return <div>No drills in this session.</div>;
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Practice Session</h2>
        <div className="text-sm bg-gray-100 px-3 py-1 rounded-full">
          {currentDrillIndex + 1} of {sessionDrills.length}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">{currentDrill.name}</h3>
        <p className="text-gray-600 mb-3">{currentDrill.description}</p>
        
        <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
          <p className="font-medium text-green-800">Goal: {requirement?.text}</p>
          <p className="text-sm text-gray-600">Duration: {currentDrill.duration} minutes</p>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          How many did you achieve?
        </label>
        <input
          type="number"
          value={results[currentDrill.id]?.achieved || 0}
          onChange={(e) => handleResultChange(parseInt(e.target.value) || 0)}
          min="0"
          max={requirement ? requirement.count * 2 : 20}
          className="w-full p-2 border rounded"
        />
        
        <div className="mt-2 flex items-center">
          <div className="bg-gray-200 h-2 flex-1 rounded-full overflow-hidden">
            <div 
              className="bg-green-500 h-full"
              style={{ 
                width: `${Math.min(
                  100, 
                  ((results[currentDrill.id]?.achieved || 0) / (requirement?.count || 1)) * 100
                )}%` 
              }}
            ></div>
          </div>
          <span className="ml-2 text-sm">
            {results[currentDrill.id]?.achieved || 0}/{requirement?.count || 0}
          </span>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={prevDrill}
          disabled={currentDrillIndex === 0}
          className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Previous
        </button>
        
        <button
          onClick={nextDrill}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          {currentDrillIndex < sessionDrills.length - 1 ? 'Next Drill' : 'Finish Session'}
        </button>
      </div>
    </div>
  );
}

export default PracticeSessionExecutor;