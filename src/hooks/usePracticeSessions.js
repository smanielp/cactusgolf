import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  doc, 
  updateDoc
} from 'firebase/firestore';

export function usePracticeSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch sessions from Firestore
  const fetchSessions = async () => {
    if (!auth.currentUser) {
      // If not logged in, try to get from localStorage as fallback
      const localSessions = localStorage.getItem('golfSessions');
      if (localSessions) {
        setSessions(JSON.parse(localSessions));
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, 'sessions'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const sessionsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSessions(sessionsList);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.message);
      
      // Fallback to localStorage
      const localSessions = localStorage.getItem('golfSessions');
      if (localSessions) {
        setSessions(JSON.parse(localSessions));
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSessions();
    
    // Add auth state change listener
    const unsubscribe = auth.onAuthStateChanged ? auth.onAuthStateChanged((user) => {
      if (user) {
        fetchSessions();
      } else {
        setSessions([]);
      }
    }) : () => {};
    
    return () => unsubscribe();
  }, []);

  // Add a new session
  const addSession = async (sessionData) => {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to add a session');
      }
      
      const newSession = {
        ...sessionData,
        userId: auth.currentUser.uid,
        createdAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'sessions'), newSession);
      
      // Update local state
      setSessions(prev => [{
        id: docRef.id,
        ...newSession
      }, ...prev]);
      
      return docRef.id;
    } catch (err) {
      console.error('Error adding session:', err);
      throw err;
    }
  };

  // Update an existing session
  const updateSession = async (sessionId, data) => {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to update a session');
      }
      
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        ...data,
        updatedAt: new Date()
      });
      
      // Update local state
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, ...data, updatedAt: new Date() } 
          : session
      ));
      
      return true;
    } catch (err) {
      console.error('Error updating session:', err);
      throw err;
    }
  };

  // Delete a session
  const deleteSession = async (sessionId) => {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to delete a session');
      }
      
      await deleteDoc(doc(db, 'sessions', sessionId));
      
      // Update local state
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      return true;
    } catch (err) {
      console.error('Error deleting session:', err);
      throw err;
    }
  };

  // Migrate local storage sessions to Firestore (for existing users)
  const migrateLocalSessionsToFirestore = async () => {
    if (!auth.currentUser) {
      throw new Error('You must be logged in to migrate sessions');
    }
    
    try {
      const localSessions = localStorage.getItem('golfSessions');
      if (!localSessions) return true;
      
      const parsedSessions = JSON.parse(localSessions);
      
      for (const session of parsedSessions) {
        await addDoc(collection(db, 'sessions'), {
          ...session,
          userId: auth.currentUser.uid,
          migratedFromLocal: true,
          createdAt: new Date()
        });
      }
      
      // Clear localStorage after successful migration
      localStorage.removeItem('golfSessions');
      
      // Refresh the sessions list
      await fetchSessions();
      
      return true;
    } catch (err) {
      console.error('Error migrating sessions:', err);
      return false;
    }
  };

  return {
    sessions,
    loading,
    error,
    addSession,
    updateSession,
    deleteSession,
    refreshSessions: fetchSessions,
    migrateLocalSessionsToFirestore
  };
}