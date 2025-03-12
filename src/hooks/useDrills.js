import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  addDoc,
  writeBatch,
  doc 
} from 'firebase/firestore';
import drillsJSON from '../drills.json'; // Import the original JSON for migration

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

  // Function to migrate drills from JSON to Firestore (admin only)
  const migrateDrillsToFirestore = async () => {
    try {
      const batch = writeBatch(db);
      let batchCount = 0;
      const MAX_BATCH_SIZE = 500; // Firestore limit is 500 writes per batch
      
      // Track batches to commit
      const batches = [];
      let currentBatch = batch;
      
      // For each category in the drills JSON
      for (const [category, drillsList] of Object.entries(drillsJSON)) {
        for (const drill of drillsList) {
          // Create a new document reference
          const drillRef = doc(collection(db, 'drills'));
          
          // Add to current batch
          currentBatch.set(drillRef, {
            ...drill,
            category,
            createdAt: new Date()
          });
          
          batchCount++;
          
          // If we hit the batch limit, prepare to commit and start a new batch
          if (batchCount >= MAX_BATCH_SIZE) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            batchCount = 0;
          }
        }
      }
      
      // Add the last batch if it has operations
      if (batchCount > 0) {
        batches.push(currentBatch);
      }
      
      // Commit all batches
      for (const batch of batches) {
        await batch.commit();
      }
      
      // Refresh the drills list
      await fetchDrills();
      
      return true;
    } catch (err) {
      console.error('Error migrating drills:', err);
      return false;
    }
  };

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
    migrateDrillsToFirestore,
    addDrill,
    refreshDrills
  };
}