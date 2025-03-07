import React, { useState } from 'react';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useDrills } from '../../hooks/useDrills';

function BulkImportUtility() {
  const [importData, setImportData] = useState('');
  const [importType, setImportType] = useState('json'); // 'json' or 'csv'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({ success: false, message: '', count: 0 });
  const { refreshDrills } = useDrills();

  const handleTextChange = (e) => {
    setImportData(e.target.value);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Determine file type based on extension
    if (file.name.endsWith('.csv')) {
      setImportType('csv');
    } else if (file.name.endsWith('.json')) {
      setImportType('json');
    } else {
      alert('Only .json and .csv files are supported');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportData(event.target.result);
    };
    reader.readAsText(file);
  };

  // Parse CSV data into the JSON structure our app expects
  const parseCSV = (csvData) => {
    // Split CSV into lines
    const lines = csvData.split('\n').filter(line => line.trim());
    
    // Extract headers from the first line
    const headers = lines[0].split(',').map(header => header.trim());
    
    // Find indices of required fields
    const categoryIdx = headers.findIndex(h => h.toLowerCase() === 'category');
    const nameIdx = headers.findIndex(h => h.toLowerCase() === 'name');
    const descriptionIdx = headers.findIndex(h => h.toLowerCase() === 'description');
    const durationIdx = headers.findIndex(h => h.toLowerCase() === 'duration');
    const beginnerIdx = headers.findIndex(h => h.toLowerCase().includes('beginner'));
    const intermediateIdx = headers.findIndex(h => h.toLowerCase().includes('intermediate'));
    const advancedIdx = headers.findIndex(h => h.toLowerCase().includes('advanced'));
    const idIdx = headers.findIndex(h => h.toLowerCase() === 'id');
    
    // Validate required fields
    if (categoryIdx === -1 || nameIdx === -1 || descriptionIdx === -1 || durationIdx === -1) {
      throw new Error('CSV is missing required columns: category, name, description, duration');
    }
    
    // Group drills by category
    const drillsByCategory = {};
    
    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      // Skip empty lines
      if (!lines[i].trim()) continue;
      
      // Split line into fields, handling potential commas in quoted fields
      let fields = [];
      let currentField = '';
      let inQuotes = false;
      
      for (let char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(currentField);
          currentField = '';
        } else {
          currentField += char;
        }
      }
      // Add the last field
      fields.push(currentField);
      
      // Trim each field and remove quotes
      fields = fields.map(field => field.trim().replace(/^"|"$/g, ''));
      
      // Extract field values
      const category = fields[categoryIdx].toLowerCase().trim();
      const name = fields[nameIdx];
      const description = fields[descriptionIdx];
      const duration = parseInt(fields[durationIdx]) || 10; // Default to 10 if parsing fails
      
      // Skip if required fields are missing
      if (!category || !name || !description) {
        console.warn(`Skipping row ${i + 1}: Missing required fields`);
        continue;
      }
      
      // Create a unique ID if not provided
      const id = idIdx !== -1 && fields[idIdx] 
        ? fields[idIdx] 
        : `${category}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      
      // Create the drill object
      const drill = {
        id,
        name,
        description,
        duration,
        achievements: {
          beginner: beginnerIdx !== -1 ? fields[beginnerIdx] : `Complete the ${name} drill`,
          intermediate: intermediateIdx !== -1 ? fields[intermediateIdx] : `Improve performance in the ${name} drill`,
          advanced: advancedIdx !== -1 ? fields[advancedIdx] : `Master the ${name} drill`
        }
      };
      
      // Add to the appropriate category array
      if (!drillsByCategory[category]) {
        drillsByCategory[category] = [];
      }
      
      drillsByCategory[category].push(drill);
    }
    
    return drillsByCategory;
  };

  const importDrills = async () => {
    if (!importData) {
      setResult({ success: false, message: 'No data to import', count: 0 });
      return;
    }

    setLoading(true);
    try {
      let drillsData;
      
      // Parse data based on type
      if (importType === 'json') {
        drillsData = JSON.parse(importData);
        // Validate data structure
        if (!drillsData || typeof drillsData !== 'object') {
          throw new Error('Invalid JSON format. Expected object with category keys.');
        }
      } else if (importType === 'csv') {
        drillsData = parseCSV(importData);
      } else {
        throw new Error('Unsupported import type');
      }

      // Process by batches to respect Firestore limits (max 500 operations per batch)
      const MAX_BATCH_SIZE = 500;
      let totalCount = 0;
      let batches = [];
      let currentBatch = writeBatch(db);
      let currentCount = 0;

      // Process each category
      for (const [category, drills] of Object.entries(drillsData)) {
        if (!Array.isArray(drills)) {
          console.warn(`Skipping category "${category}" - not an array`);
          continue;
        }

        // Process each drill in this category
        for (const drill of drills) {
          // Skip invalid drills
          if (!drill.name || !drill.description) {
            console.warn(`Skipping drill without name or description in category "${category}"`);
            continue;
          }
          
          // Create a new document reference
          const drillRef = doc(collection(db, 'drills'));
          
          // Prepare the drill data
          const drillData = {
            ...drill,
            category,
            createdAt: new Date()
          };
          
          // Add to current batch
          currentBatch.set(drillRef, drillData);
          currentCount++;
          totalCount++;
          
          // If batch is full, add to batches array and create new batch
          if (currentCount >= MAX_BATCH_SIZE) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            currentCount = 0;
          }
        }
      }
      
      // Add the last batch if it has operations
      if (currentCount > 0) {
        batches.push(currentBatch);
      }
      
      // Commit all batches
      for (const batch of batches) {
        await batch.commit();
      }
      
      // Refresh drills in all components
      refreshDrills();
      
      setResult({
        success: true,
        message: `Successfully imported ${totalCount} drills into Firestore.`,
        count: totalCount
      });
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        message: `Error importing drills: ${error.message}`,
        count: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getExampleJson = () => {
    const example = {
      "putting": [
        {
          "id": "putting-example-1",
          "name": "Circle Putting Challenge",
          "description": "Place 8 balls in a circle around the hole at 3-foot distance.",
          "duration": 10,
          "achievements": {
            "beginner": "Make 3 out of 8 putts",
            "intermediate": "Make 5 out of 8 putts",
            "advanced": "Make 7 out of 8 putts"
          }
        }
      ],
      "driving": [
        {
          "id": "driving-example-1",
          "name": "Fairway Finder",
          "description": "Try to hit 10 drives into a simulated fairway target.",
          "duration": 15,
          "achievements": {
            "beginner": "Hit 3 out of 10 into the fairway",
            "intermediate": "Hit 5 out of 10 into the fairway",
            "advanced": "Hit 7 out of 10 into the fairway"
          }
        }
      ]
    };
    return JSON.stringify(example, null, 2);
  };

  const getExampleCSV = () => {
    return `Category,ID,Name,Description,Duration,Beginner Achievement,Intermediate Achievement,Advanced Achievement
putting,putting-example-1,Circle Putting Challenge,"Place 8 balls in a circle around the hole at 3-foot distance.",10,Make 3 out of 8 putts,Make 5 out of 8 putts,Make 7 out of 8 putts
driving,driving-example-1,Fairway Finder,"Try to hit 10 drives into a simulated fairway target.",15,"Hit 3 out of 10 into the fairway","Hit 5 out of 10 into the fairway","Hit 7 out of 10 into the fairway"`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Bulk Import Drills</h2>
      
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Import multiple drills to Firestore at once. You can upload a JSON or CSV file, or paste the data directly.
        </p>
        
        <div className="flex flex-col space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Upload File</label>
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">Or Paste Data</label>
              <div className="flex items-center space-x-2">
                <label className="text-sm">
                  <input 
                    type="radio" 
                    name="importType" 
                    value="json" 
                    checked={importType === 'json'} 
                    onChange={() => setImportType('json')}
                    className="mr-1"
                  />
                  JSON
                </label>
                <label className="text-sm">
                  <input 
                    type="radio" 
                    name="importType" 
                    value="csv" 
                    checked={importType === 'csv'} 
                    onChange={() => setImportType('csv')}
                    className="mr-1"
                  />
                  CSV
                </label>
              </div>
            </div>
            <textarea
              value={importData}
              onChange={handleTextChange}
              className="w-full h-64 p-2 border rounded font-mono text-sm"
              placeholder={`Paste your ${importType.toUpperCase()} data here`}
            ></textarea>
          </div>
          
          <div className="text-right">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => {
                if (importType === 'json') {
                  setImportData(getExampleJson());
                } else if (importType === 'csv') {
                  setImportData(getExampleCSV());
                }
              }}
            >
              See Example Format
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-6">
        <button
          onClick={importDrills}
          disabled={loading || !importData}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Importing...' : 'Import Drills'}
        </button>
      </div>
      
      {result.message && (
        <div className={`mt-4 p-4 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result.message}
          {result.success && result.count > 0 && (
            <p className="mt-2 font-medium">
              Remember to refresh your drills list to see the imported drills.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default BulkImportUtility;