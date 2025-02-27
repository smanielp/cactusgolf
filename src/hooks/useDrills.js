import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, addDoc } from 'firebase/firestore';
import drillsJSON from '../drills.json'; // Import the original JSON for migration

export function useDrills() {
  const [drills, setDrills] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to migrate drills from JSON to Firestore (admin only)
  const migrateDrillsToFirestore = async () => {
    try {
      // For each category in the drills JSON
      for (const [category, drillsList] of Object.entries(drillsJSON)) {
        // Batch these for better performance in a real implementation
        for (const drill of drillsList) {
          const drillRef = collection(db, 'drills');
          await addDoc(drillRef, {
            ...drill,
            category,
            createdAt: new Date()
          });
        }
      }
      return true;
    } catch (err) {
      console.error('Error migrating drills:', err);
      return false;
    }
  };

  useEffect(() => {
    // Function to fetch drills from Firestore
    const fetchDrills = async () => {
      try {
        const drillsRef = collection(db, 'drills');
        const querySnapshot = await getDocs(drillsRef);
        
        // Group by category
        const drillsByCategory = {};
        
        querySnapshot.forEach((doc) => {
          const drillData = doc.data();
          const category = drillData.category;
          
          if (!drillsByCategory[category]) {
            drillsByCategory[category] = [];
          }
          
          drillsByCategory[category].push({
            ...drillData,
            id: doc.id
          });
        });
        
        // If no drills in Firestore, use the local JSON
        if (Object.keys(drillsByCategory).length === 0) {
          setDrills(drillsJSON);
        } else {
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
    };

    fetchDrills();
  }, []);

  return { 
    drills, 
    loading, 
    error, 
    migrateDrillsToFirestore // Exposed for admin use
  };
}