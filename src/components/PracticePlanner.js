import React, { useState } from 'react';

// Database of practice drills organized by focus area
const drillsDatabase = {
  driving: [
    { id: 1, name: "Alignment Rod Drill", description: "Place alignment rods on the ground to ensure proper alignment and stance", duration: 10, difficulty: "level1" },
    { id: 2, name: "Tee Height Variation", description: "Practice with different tee heights to find optimal launch conditions", duration: 15, difficulty: "level1" },
    { id: 3, name: "Tempo Control", description: "Practice swings focusing on consistent tempo with driver", duration: 10, difficulty: "level2" },
    { id: 4, name: "9-to-3 Drill", description: "Partial swings (from 9 o'clock to 3 o'clock) to develop control", duration: 10, difficulty: "level2" },
    { id: 5, name: "Step-Through Drill", description: "Step through with your trail foot after impact to promote proper weight transfer", duration: 15, difficulty: "level3" },
  ],
  irons: [
    { id: 6, name: "One-Armed Drill", description: "Hit shots with just your lead arm to improve control and feel", duration: 10, difficulty: "level2" },
    { id: 7, name: "Distance Control", description: "Hit three different clubs to the same target focusing on distance control", duration: 15, difficulty: "level2" },
    { id: 8, name: "Ball Position Ladder", description: "Hit the same club with the ball in different positions in your stance", duration: 10, difficulty: "level1" },
    { id: 9, name: "Towel Under Arms", description: "Practice with a towel tucked under both armpits to maintain connection", duration: 10, difficulty: "level1" },
    { id: 10, name: "Low-Medium-High Shots", description: "Practice hitting shots with different trajectories using the same club", duration: 15, difficulty: "level3" },
  ],
  wedges: [
    { id: 11, name: "Clock Face Drill", description: "Practice swings of different lengths (7, 9, and 11 o'clock) for distance control", duration: 10, difficulty: "level2" },
    { id: 12, name: "Trajectory Control", description: "Hit wedge shots with varying trajectories to the same target", duration: 10, difficulty: "level3" },
    { id: 13, name: "Bunker to Wedge Transition", description: "Alternate between bunker shots and wedge shots to the same target", duration: 15, difficulty: "level3" },
    { id: 14, name: "Distance Ladder", description: "Hit to targets at 10-yard increments using the same wedge", duration: 15, difficulty: "level2" },
    { id: 15, name: "Landing Spot Control", description: "Focus on hitting specific landing spots rather than the final target", duration: 10, difficulty: "level1" },
  ],
  chipping: [
    { id: 16, name: "Around the Clock", description: "Set up 6-12 balls in a circle around a hole and chip to center", duration: 10, difficulty: "level1" },
    { id: 17, name: "Up-and-Down Challenge", description: "Try to get up and down from various positions around the green", duration: 15, difficulty: "level2" },
    { id: 18, name: "Three Club Challenge", description: "Use three different clubs to hit the same chip shot", duration: 10, difficulty: "level2" },
    { id: 19, name: "Leapfrog Drill", description: "Chip one ball, then chip the next ball past the first, and so on", duration: 10, difficulty: "level1" },
    { id: 20, name: "Chip and Putt Challenge", description: "Chip onto the green and then putt out, counting total strokes", duration: 15, difficulty: "level2" },
  ],
  putting: [
    { id: 21, name: "Gate Drill", description: "Set up tees as a gate and putt through without hitting them", duration: 10, difficulty: "level1" },
    { id: 22, name: "Circle Drill", description: "Place 6-8 balls in a circle, 3 feet from the hole, and make all putts", duration: 10, difficulty: "level1" },
    { id: 23, name: "Ladder Drill", description: "Putt to distances of 10, 20, 30 feet to develop distance control", duration: 15, difficulty: "level2" },
    { id: 24, name: "Clock Face Putting", description: "Place balls at each hour position around the hole at equal distance", duration: 15, difficulty: "level2" },
    { id: 25, name: "Two-Ball Drill", description: "Place two balls side by side and try to hit them at the same time", duration: 10, difficulty: "level3" },
  ],
  bunker: [
    { id: 26, name: "Dollar Bill Drill", description: "Place a dollar bill under the ball and try to take it with your swing", duration: 10, difficulty: "level2" },
    { id: 27, name: "Line in the Sand", description: "Draw a line in the sand and focus on hitting behind it", duration: 10, difficulty: "level1" },
    { id: 28, name: "Different Lies Drill", description: "Practice from different lies (buried, upslope, downslope)", duration: 15, difficulty: "level3" },
    { id: 29, name: "Eyes Closed Drill", description: "Hit bunker shots with your eyes closed to develop feel", duration: 10, difficulty: "level3" },
    { id: 30, name: "Splash Contest", description: "Focus on creating consistent splash with the sand", duration: 10, difficulty: "level1" },
  ],
  "full-round": [
    { id: 31, name: "9-Hole Play", description: "Play 9 holes focusing on course management", duration: 90, difficulty: "level2" },
    { id: 32, name: "18-Hole Play", description: "Complete a full 18-hole round", duration: 240, difficulty: "level2" },
    { id: 33, name: "Par 3 Course", description: "Play a par 3 course to work on short game", duration: 60, difficulty: "level1" },
    { id: 34, name: "Two-Ball Best Ball", description: "Play two balls and take the best score on each hole", duration: 120, difficulty: "level3" },
    { id: 35, name: "Scramble Practice", description: "Hit two shots from each position and play the best one", duration: 100, difficulty: "level2" },
  ],
};

const PracticePlanner = ({ onSavePlan }) => {
  const [availableTime, setAvailableTime] = useState(60);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState([]);
  const [difficultyLevel, setDifficultyLevel] = useState('all');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  
  const handleFocusChange = (area) => {
    if (selectedFocusAreas.includes(area)) {
      setSelectedFocusAreas(selectedFocusAreas.filter(item => item !== area));
    } else {
      setSelectedFocusAreas([...selectedFocusAreas, area]);
    }
  };
  
  const generatePracticePlan = () => {
    // If no focus areas selected, return
    if (selectedFocusAreas.length === 0) return;
    
    let availableDrills = [];
    
    // Get drills from the selected focus areas
    selectedFocusAreas.forEach(area => {
      let drills = drillsDatabase[area] || [];
      
      // Filter by difficulty if needed
      if (difficultyLevel !== 'all') {
        drills = drills.filter(drill => drill.difficulty === difficultyLevel);
      }
      
      availableDrills = [...availableDrills, ...drills];
    });
    
    // Shuffle the drills for some randomness
    availableDrills.sort(() => Math.random() - 0.5);
    
    // Create the plan by adding drills until we reach the time limit
    const selectedDrills = [];
    let remainingTime = availableTime;
    let warmupTime = 5; // Always allocate 5 minutes for warmup
    
    // Allocate proportional time to each focus area
    const focusAreaTimes = {};
    selectedFocusAreas.forEach(area => {
      focusAreaTimes[area] = Math.floor((availableTime - warmupTime) / selectedFocusAreas.length);
    });
    
    // For each focus area, select drills until time is filled
    const planByArea = {};
    
    selectedFocusAreas.forEach(area => {
      const areaTime = focusAreaTimes[area];
      let usedTime = 0;
      const areaSpecificDrills = drillsDatabase[area] || [];
      
      // Filter by difficulty if needed
      const filteredDrills = difficultyLevel !== 'all' 
        ? areaSpecificDrills.filter(drill => drill.difficulty === difficultyLevel)
        : areaSpecificDrills;
      
      const shuffledDrills = [...filteredDrills].sort(() => Math.random() - 0.5);
      const selectedAreaDrills = [];
      
      for (const drill of shuffledDrills) {
        if (usedTime + drill.duration <= areaTime) {
          selectedAreaDrills.push(drill);
          usedTime += drill.duration;
        }
        
        if (usedTime >= areaTime) break;
      }
      
      planByArea[area] = {
        drills: selectedAreaDrills,
        allocatedTime: areaTime,
        actualTime: usedTime
      };
    });
    
    setGeneratedPlan({
      totalTime: availableTime,
      warmupTime,
      focusAreas: planByArea
    });
  };
  
  const savePlanToSession = () => {
    if (!generatedPlan) return;
    
    // Create a new session with the plan information
    const newSession = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      duration: generatedPlan.totalTime,
      focus: selectedFocusAreas.join(', '),
      notes: `Planned session: ${selectedFocusAreas.map(area => 
        `${area} (${generatedPlan.focusAreas[area].drills.map(d => d.name).join(', ')})`
      ).join('; ')}`,
      planned: true,
      completed: false
    };
    
    // Call the parent component's handler
    if (onSavePlan) {
      onSavePlan(newSession);
    }
    
    // Reset the form and plan
    setGeneratedPlan(null);
    setSelectedFocusAreas([]);
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4">Practice Planner</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Available Time (minutes)
        </label>
        <input
          type="number"
          value={availableTime}
          onChange={(e) => setAvailableTime(parseInt(e.target.value) || 30)}
          className="w-full p-2 border rounded"
          min="10"
          max="240"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Focus Areas (select one or more)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(drillsDatabase).map(area => (
            <div key={area} className="flex items-center">
              <input
                type="checkbox"
                id={`focus-${area}`}
                checked={selectedFocusAreas.includes(area)}
                onChange={() => handleFocusChange(area)}
                className="mr-2"
              />
              <label htmlFor={`focus-${area}`}>
                {area.charAt(0).toUpperCase() + area.slice(1).replace('-', ' ')}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">
          Difficulty Level
        </label>
        <select
          value={difficultyLevel}
          onChange={(e) => setDifficultyLevel(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="all">All Levels</option>
          <option value="level1">Level 1</option>
          <option value="level2">Level 2</option>
          <option value="level3">Level 3</option>
        </select>
      </div>
      
      <button
        onClick={generatePracticePlan}
        disabled={selectedFocusAreas.length === 0}
        className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400 mb-4"
      >
        Generate Practice Plan
      </button>
      
      {generatedPlan && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold text-lg mb-2">Your Practice Plan ({generatedPlan.totalTime} min)</h3>
          
          <div className="mb-4">
            <div className="bg-green-50 p-3 rounded border border-green-200 mb-3">
              <span className="font-medium">Warmup:</span> {generatedPlan.warmupTime} minutes of light stretching and easy swings
            </div>
            
            {Object.keys(generatedPlan.focusAreas).map(area => {
              const areaData = generatedPlan.focusAreas[area];
              return (
                <div key={area} className="mb-4">
                  <h4 className="font-medium text-green-800">
                    {area.charAt(0).toUpperCase() + area.slice(1).replace('-', ' ')} 
                    ({areaData.actualTime} min)
                  </h4>
                  
                  {areaData.drills.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                      {areaData.drills.map(drill => (
                        <li key={drill.id}>
                          <div className="font-medium">{drill.name} ({drill.duration} min)</div>
                          <div className="text-sm text-gray-600">{drill.description}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No suitable drills found for the selected time and difficulty.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          
          <button
            onClick={savePlanToSession}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Save Plan to Practice Sessions
          </button>
        </div>
      )}
    </div>
  );
};

export default PracticePlanner;