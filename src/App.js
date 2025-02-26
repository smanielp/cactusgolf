import React, { useState, useEffect } from 'react';
import DrillsPage from './DrillsPage';

function App() {
  const [activeTab, setActiveTab] = useState('journal'); // 'journal', 'drills'
  const [practiceSession, setPracticeSession] = useState({
    date: '',
    duration: '',
    focus: '',
    notes: ''
  });
  
  const [sessions, setSessions] = useState([]);
  const [expandedSession, setExpandedSession] = useState(null);

  // Function to load sessions from localStorage
  const loadSessions = () => {
    const savedSessions = localStorage.getItem('golfSessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  };

  // Load sessions from localStorage on initial load
  useEffect(() => {
    loadSessions();
    
    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event listener for our app
    window.addEventListener('sessionsUpdated', loadSessions);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sessionsUpdated', loadSessions);
    };
  }, []);
  
  // Handle storage changes (useful when multiple tabs are open)
  const handleStorageChange = (e) => {
    if (e.key === 'golfSessions') {
      loadSessions();
    }
  };

  // Save sessions to localStorage whenever they change within this component
  const saveSessions = (updatedSessions) => {
    localStorage.setItem('golfSessions', JSON.stringify(updatedSessions));
    setSessions(updatedSessions);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('sessionsUpdated'));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPracticeSession(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newSession = {
      ...practiceSession,
      id: Date.now(),
      date: practiceSession.date || new Date().toISOString().split('T')[0]
    };
    
    const updatedSessions = [newSession, ...sessions];
    saveSessions(updatedSessions);
    
    // Reset form
    setPracticeSession({
      date: '',
      duration: '',
      focus: '',
      notes: ''
    });
  };

  // Toggle expanded session details
  const toggleSessionDetails = (sessionId) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
    }
  };

  // Function to check if a session has drill results
  const hasResults = (session) => {
    return session.drills && session.drills.some(drill => drill.result);
  };

  // Pass loadSessions function to DrillsPage
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'journal') {
      // Reload sessions when switching to journal tab
      loadSessions();
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold text-center text-green-800 mb-6">Cactus Golf Practice Tracker</h1>
      
      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 ${activeTab === 'journal' 
            ? 'border-b-2 border-green-600 text-green-800 font-medium' 
            : 'text-gray-500 hover:text-green-800'}`}
          onClick={() => handleTabChange('journal')}
        >
          Practice Journal
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'drills' 
            ? 'border-b-2 border-green-600 text-green-800 font-medium' 
            : 'text-gray-500 hover:text-green-800'}`}
          onClick={() => handleTabChange('drills')}
        >
          Practice Drills
        </button>
      </div>
      
      {/* Practice Journal Tab */}
      {activeTab === 'journal' && (
        <>
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Log New Practice Session</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={practiceSession.date}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
              <input
                type="number"
                name="duration"
                value={practiceSession.duration}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Focus Area</label>
              <select
                name="focus"
                value={practiceSession.focus}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select focus area</option>
                <option value="driving">Driving</option>
                <option value="irons">Iron Play</option>
                <option value="wedges">Wedge Play</option>
                <option value="chipping">Chipping</option>
                <option value="putting">Putting</option>
                <option value="bunker">Bunker Shots</option>
                <option value="full-round">Full Round</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                name="notes"
                value={practiceSession.notes}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                rows="3"
              ></textarea>
            </div>
            
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Log Session
            </button>
          </form>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Recent Practice Sessions</h2>
            
            {sessions.length === 0 ? (
              <p className="text-gray-500">No practice sessions logged yet.</p>
            ) : (
              <div className="space-y-4">
                {sessions.map(session => (
                  <div key={session.id} className="border-b pb-3">
                    <div 
                      className="flex justify-between cursor-pointer"
                      onClick={() => toggleSessionDetails(session.id)}
                    >
                      <div className="flex items-center">
                        <span className="font-medium">{new Date(session.date).toLocaleDateString()}</span>
                        {session.successRate && (
                          <span className={`ml-2 text-xs px-2 py-1 rounded ${
                            session.successRate >= 80 ? 'bg-green-100 text-green-800' :
                            session.successRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {session.successRate}% success
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                          {session.duration} mins
                        </span>
                        <span className="ml-1 text-gray-500">
                          {expandedSession === session.id ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm mt-1">
                      <span className="font-medium">Focus:</span> {
                        session.focus.split(',').map(focus => 
                          focus.trim().charAt(0).toUpperCase() + focus.trim().slice(1).replace('-', ' ')
                        ).join(', ')
                      }
                    </div>
                    
                    {session.notes && (
                      <div className="text-sm mt-1 text-gray-600">{session.notes}</div>
                    )}
                    
                    {/* Expanded details when clicked */}
                    {expandedSession === session.id && session.drills && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <h4 className="text-sm font-medium mb-1">Drills:</h4>
                        <div className="space-y-2">
                          {session.drills.map(drill => (
                            <div key={drill.id} className="text-xs bg-gray-50 p-2 rounded">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{drill.name}</span>
                                <span className="text-gray-500">{drill.duration} mins</span>
                              </div>
                              
                              {/* Show results if available */}
                              {drill.result && (
                                <div className="mt-1 flex items-center">
                                  <div className="mr-2">Results:</div>
                                  <div 
                                    className={`px-2 py-1 rounded ${
                                      drill.result.achieved >= drill.result.requirement.count
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {drill.result.achieved}/{drill.result.requirement.count} {drill.result.requirement.text.split(' ').slice(-1)[0]}
                                  </div>
                                </div>
                              )}
                              
                              {drill.description && (
                                <div className="mt-1 text-gray-600">{drill.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Practice Drills Tab */}
      {activeTab === 'drills' && <DrillsPage onSessionSaved={loadSessions} />}
    </div>
  );
}

export default App;