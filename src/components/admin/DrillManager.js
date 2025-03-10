import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { useDrills } from '../../hooks/useDrills';
import { useAuth } from '../auth/AuthProvider';
import BulkImportUtility from './BulkImportUtility';

function DrillManager() {
  const { isAdmin } = useAuth();
  const { 
    drills: firestoreDrills, 
    migrateDrillsToFirestore, 
    loading: drillsLoading,
    refreshDrills 
  } = useDrills();
  
  const [drillsList, setDrillsList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDrill, setEditingDrill] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Load drills from Firestore
  useEffect(() => {
    const fetchDrillsFromFirestore = async () => {
      try {
        const q = query(collection(db, 'drills'), orderBy('category'));
        const querySnapshot = await getDocs(q);
        
        const fetchedDrills = [];
        const categorySet = new Set();
        
        querySnapshot.forEach((doc) => {
          const drill = {
            id: doc.id,
            ...doc.data()
          };
          fetchedDrills.push(drill);
          categorySet.add(drill.category);
        });
        
        setDrillsList(fetchedDrills);
        setCategories(Array.from(categorySet));
        
      } catch (err) {
        console.error('Error fetching drills:', err);
        setError('Failed to load drills from database');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDrillsFromFirestore();
  }, [drillsLoading]); // Add drillsLoading as a dependency to trigger refreshes

  // Filter drills by category
  const filteredDrills = selectedCategory 
    ? drillsList.filter(drill => drill.category === selectedCategory)
    : drillsList;

  // Handle migration of drills from JSON to Firestore
  const handleMigration = async () => {
    if (window.confirm('This will import all drills from the local JSON file to Firestore. Continue?')) {
      setLoading(true);
      
      try {
        await migrateDrillsToFirestore();
        setSuccess('Drills successfully migrated to Firestore!');
        
        // Reload the drills list
        const q = query(collection(db, 'drills'), orderBy('category'));
        const querySnapshot = await getDocs(q);
        
        const fetchedDrills = [];
        const categorySet = new Set();
        
        querySnapshot.forEach((doc) => {
          const drill = {
            id: doc.id,
            ...doc.data()
          };
          fetchedDrills.push(drill);
          categorySet.add(drill.category);
        });
        
        setDrillsList(fetchedDrills);
        setCategories(Array.from(categorySet));
        
        // Refresh drills in other components
        refreshDrills();
      } catch (err) {
        console.error('Error migrating drills:', err);
        setError('Failed to migrate drills');
      } finally {
        setLoading(false);
      }
    }
  };

  // Delete a drill
  const handleDeleteDrill = async (drillId) => {
    if (window.confirm('Are you sure you want to delete this drill?')) {
      setLoading(true);
      
      try {
        await deleteDoc(doc(db, 'drills', drillId));
        
        // Update state to remove the deleted drill
        setDrillsList(prev => prev.filter(drill => drill.id !== drillId));
        
        // Refresh drills in other components
        refreshDrills();
        
        setSuccess('Drill deleted successfully');
      } catch (err) {
        console.error('Error deleting drill:', err);
        setError('Failed to delete drill');
      } finally {
        setLoading(false);
      }
    }
  };

  // Set up editing for a drill
  const setupEditDrill = (drill) => {
    setEditingDrill({
      ...drill,
      achievements: {
        level1: drill.achievements?.level1 || drill.achievements?.beginner || '',
        level2: drill.achievements?.level2 || drill.achievements?.intermediate || '',
        level3: drill.achievements?.level3 || drill.achievements?.advanced || ''
      }
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingDrill(null);
  };

  // Save edited drill
  const saveDrill = async () => {
    setLoading(true);
    
    try {
      if (editingDrill.id) {
        // Update existing drill
        const drillRef = doc(db, 'drills', editingDrill.id);
        await updateDoc(drillRef, {
          name: editingDrill.name,
          description: editingDrill.description,
          duration: parseInt(editingDrill.duration),
          category: editingDrill.category,
          achievements: editingDrill.achievements,
          updatedAt: new Date()
        });
        
        // Update state
        setDrillsList(prev => 
          prev.map(drill => 
            drill.id === editingDrill.id ? {...editingDrill, updatedAt: new Date()} : drill
          )
        );
        
        setSuccess('Drill updated successfully');
      } else {
        // Create new drill
        const newDrill = {
          name: editingDrill.name,
          description: editingDrill.description,
          duration: parseInt(editingDrill.duration),
          category: editingDrill.category,
          achievements: editingDrill.achievements,
          createdAt: new Date()
        };
        
        const docRef = await addDoc(collection(db, 'drills'), newDrill);
        
        // Add to state
        setDrillsList(prev => [...prev, { id: docRef.id, ...newDrill }]);
        
        // Add category if it's new
        if (!categories.includes(editingDrill.category)) {
          setCategories(prev => [...prev, editingDrill.category]);
        }
        
        setSuccess('New drill created successfully');
      }
      
      // Refresh drills in other components
      refreshDrills();
      
      // Reset editing state
      setEditingDrill(null);
    } catch (err) {
      console.error('Error saving drill:', err);
      setError('Failed to save drill');
    } finally {
      setLoading(false);
    }
  };

  // Create a new drill
  const createNewDrill = () => {
    setEditingDrill({
      name: '',
      description: '',
      duration: 10,
      category: categories[0] || '',
      achievements: {
        level1: '',
        level2: '',
        level3: ''
      }
    });
  };

  // Clear messages after a delay
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Handle file upload for bulk import
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        const content = e.target.result;
        const drills = JSON.parse(content);
        
        // Check if it's a valid drills file
        if (!drills || typeof drills !== 'object') {
          setError('Invalid drill data format');
          return;
        }
        
        // Create a batch
        const batch = writeBatch(db);
        let count = 0;
        
        // Process drills
        for (const [category, drillsArray] of Object.entries(drills)) {
          for (const drill of drillsArray) {
            if (!drill.name || !drill.description || !drill.duration) {
              continue; // Skip invalid drills
            }
            
            const drillRef = doc(collection(db, 'drills'));
            batch.set(drillRef, {
              ...drill,
              category,
              createdAt: new Date()
            });
            count++;
          }
        }
        
        // Commit the batch
        await batch.commit();
        
        // Refresh drills
        refreshDrills();
        
        setSuccess(`Successfully imported ${count} drills`);
      } catch (err) {
        console.error('Error importing drills:', err);
        setError('Failed to import drills: ' + err.message);
      } finally {
        setLoading(false);
        // Reset the file input
        event.target.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  // Toggle bulk import section
  const toggleBulkImport = () => {
    setShowBulkImport(!showBulkImport);
  };

  // If not admin, don't show the component
  if (!isAdmin) {
    return <div className="text-center p-4">Admin access required</div>;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Drill Management</h2>
      
      {loading && (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 text-green-800 p-4 mb-4 rounded">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 text-red-800 p-4 mb-4 rounded">
          {error}
        </div>
      )}
      
      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={handleMigration}
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Migrate Drills from JSON
        </button>
        
        <button 
          onClick={createNewDrill}
          disabled={loading}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          Create New Drill
        </button>
        
        <div className="relative">
          <input
            type="file"
            id="drillsFile"
            accept=".json"
            className="hidden"
            onChange={handleFileUpload}
          />
          <label 
            htmlFor="drillsFile"
            className="cursor-pointer bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:bg-gray-400 inline-block"
          >
            Import Drills from File
          </label>
        </div>
        
        <button
          onClick={toggleBulkImport}
          className="bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600"
        >
          {showBulkImport ? 'Hide Bulk Import' : 'Show Bulk Import Tool'}
        </button>
      </div>
      
      {/* Bulk Import Section */}
      {showBulkImport && (
        <div className="mb-6">
          <BulkImportUtility />
        </div>
      )}
      
      <div className="mb-6">
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
              key={category}
              className={`px-3 py-1 rounded text-sm ${
                selectedCategory === category ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>
      
      {/* Editing Form */}
      {editingDrill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-auto">
            <h3 className="text-lg font-medium mb-4">
              {editingDrill.id ? 'Edit Drill' : 'Create New Drill'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editingDrill.name}
                  onChange={(e) => setEditingDrill({...editingDrill, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editingDrill.description}
                  onChange={(e) => setEditingDrill({...editingDrill, description: e.target.value})}
                  className="w-full p-2 border rounded"
                  rows="3"
                  required
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={editingDrill.duration}
                  onChange={(e) => setEditingDrill({...editingDrill, duration: e.target.value})}
                  className="w-full p-2 border rounded"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={editingDrill.category}
                  onChange={(e) => setEditingDrill({...editingDrill, category: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Level 1 Achievement</label>
                <input
                  type="text"
                  value={editingDrill.achievements.level1}
                  onChange={(e) => setEditingDrill({
                    ...editingDrill, 
                    achievements: {...editingDrill.achievements, level1: e.target.value}
                  })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Level 2 Achievement</label>
                <input
                  type="text"
                  value={editingDrill.achievements.level2}
                  onChange={(e) => setEditingDrill({
                    ...editingDrill, 
                    achievements: {...editingDrill.achievements, level2: e.target.value}
                  })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Level 3 Achievement</label>
                <input
                  type="text"
                  value={editingDrill.achievements.level3}
                  onChange={(e) => setEditingDrill({
                    ...editingDrill, 
                    achievements: {...editingDrill.achievements, level3: e.target.value}
                  })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={cancelEdit}
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              
              <button
                onClick={saveDrill}
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Drills List */}
      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDrills.map(drill => (
              <tr key={drill.id}>
                <td className="px-6 py-4 whitespace-nowrap">{drill.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{drill.category}</td>
                <td className="px-6 py-4 whitespace-nowrap">{drill.duration} min</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => setupEditDrill(drill)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteDrill(drill.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            
            {filteredDrills.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No drills found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DrillManager;