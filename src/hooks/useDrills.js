import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  addDoc,
  doc 
} from 'firebase/firestore';
import drillsJSON from '../drills.json'; // Import the original JSON as fallback

export function useDrills() {
  const [drills, setDrills] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now()); // Track last refresh time

  // Function to fetch drills from Firestore
  const fetchDrills = useCallback(async () => {
    setLoading(true);
    try {
      const drillsRef = collection(db, 'drills');
      const q = query(drillsRef, orderBy('category'), orderBy('name'));
      console.log('useDrills - Running query for drills collection');
      const querySnapshot = await getDocs(q);
      console.log('useDrills - Query returned:', querySnapshot.size, 'documents');
      
      // Group by category
      const drillsByCategory = {};
      
      querySnapshot.forEach((doc) => {
        const drillData = doc.data();
        const category = drillData.category;
        console.log('useDrills - Processing drill:', doc.id, 'category:', category);
        
        if (!drillsByCategory[category]) {
          drillsByCategory[category] = [];
        }
        
        drillsByCategory[category].push({
          ...drillData,
          id: doc.id
        });
      });
      
      // If no drills in Firestore, use the local JSON
      console.log('useDrills - Categories found:', Object.keys(drillsByCategory));
      if (Object.keys(drillsByCategory).length === 0) {
        console.log('useDrills - No drills in Firestore, using local JSON');
        setDrills(drillsJSON);
      } else {
        console.log('useDrills - Using Firestore drills');
        setDrills(drillsByCategory);
      }
      
    } catch (err) {
      console.error('Error fetching drills:', err);
      setError(err.message);
      
      // Fallback to local JSON if Firestore fails
      setDrills(drillsJSON);
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to add a single new drill
  const addDrill = async (drillData) => {
    try {
      const drillRef = collection(db, 'drills');
      const docRef = await addDoc(drillRef, {
        ...drillData,
        createdAt: new Date()
      });
      
      // Refresh drills
      refreshDrills();
      
      return docRef.id;
    } catch (err) {
      console.error('Error adding drill:', err);
      throw err;
    }
  };

  // Function to refresh drills
  const refreshDrills = () => {
    console.log('useDrills - refreshDrills called');
    setLastRefresh(Date.now());
  };

  // Fetch drills initially and when refresh is triggered
  useEffect(() => {
    console.log('useDrills - useEffect triggered, calling fetchDrills');
    fetchDrills();
  }, [fetchDrills, lastRefresh]);

  return { 
    drills, 
    loading, 
    error, 
    addDrill,
    refreshDrills
  };
}