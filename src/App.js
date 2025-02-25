import React, { useState, useEffect } from 'react';

function App() {
  const [practiceSession, setPracticeSession] = useState({
    date: '',
    duration: '',
    focus: '',
    notes: ''
  });
  
  const [sessions, setSessions] = useState([]);

  // Load sessions from localStorage on initial load
  useEffect(() => {
    const savedSessions = localStorage.getItem('golfSessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('golfSessions', JSON.stringify(sessions));
  }, [sessions]);

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
    
    setSessions(prev => [newSession, ...prev]);
    
    // Reset form
    setPracticeSession({
      date: '',
      duration: '',
      focus: '',
      notes: ''
    });
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold text-center text-green-800 mb-6">Cactus Golf Practice Tracker</h1>
      
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
                <div className="flex justify-between">
                  <span className="font-medium">{new Date(session.date).toLocaleDateString()}</span>
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                    {session.duration} mins
                  </span>
                </div>
                <div className="text-sm mt-1">
                  <span className="font-medium">Focus:</span> {session.focus.charAt(0).toUpperCase() + session.focus.slice(1)}
                </div>
                {session.notes && (
                  <div className="text-sm mt-1 text-gray-600">{session.notes}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
