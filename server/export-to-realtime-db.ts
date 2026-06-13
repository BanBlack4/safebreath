import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Ensure Firebase is initialized
if (admin.apps.length === 0) {
  try {
    const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com` // Optional fallback
      });
      console.log("Firebase Admin initialized using service-account.json credential file.");
    } else {
      admin.initializeApp({
        projectId: "tensile-lens-l8gvj", 
      });
      console.log("Firebase Admin initialized using default environment/projectId");
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    process.exit(1);
  }
}

const db = admin.firestore();

// Formatter to clean up Firestore special types like Timestamps or document references to standard serializable fields
function formatData(data: any): any {
  if (data === null || data === undefined) return null;
  
  if (Array.isArray(data)) {
    return data.map(item => formatData(item));
  }
  
  if (typeof data === 'object') {
    // Check if it's a Firestore Timestamp reference
    if (data.toDate && typeof data.toDate === 'function') {
      return data.toDate().toISOString();
    }
    // Check if it's a nested Timestamp/Date object like {_seconds, _nanoseconds}
    if (data && typeof data._seconds === 'number' && typeof data._nanoseconds === 'number') {
      return new Date(data._seconds * 1000).toISOString();
    }
    
    const obj: any = {};
    for (const key of Object.keys(data)) {
      obj[key] = formatData(data[key]);
    }
    return obj;
  }
  
  return data;
}

// Recursively fetch a collection and all of its subcollections
async function exportCollection(collectionPath: string): Promise<any> {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const collectionData: any = {};
  
  for (const doc of snapshot.docs) {
    const docData = formatData(doc.data());
    
    // Look for any subcollections under this document
    const subcollections = await doc.ref.listCollections();
    
    if (subcollections.length > 0) {
      for (const subcolRef of subcollections) {
        const subcolData = await exportCollection(`${collectionPath}/${doc.id}/${subcolRef.id}`);
        if (subcolData) {
          docData[subcolRef.id] = subcolData;
        }
      }
    }
    
    collectionData[doc.id] = docData;
  }
  
  return collectionData;
}

async function runExporter() {
  console.log("🚀 Starting Firestore DB complete export for Realtime Database...");
  
  try {
    // We get a list of all root-level collections
    const rootCollections = await db.listCollections();
    const resultDatabase: any = {};
    
    if (rootCollections.length === 0) {
      console.log("⚠️ No root collections found in Firestore.");
    }
    
    for (const rootCol of rootCollections) {
      console.log(`📦 Exporting root collection: "${rootCol.id}"...`);
      const exportData = await exportCollection(rootCol.id);
      if (exportData) {
        resultDatabase[rootCol.id] = exportData;
      }
    }
    
    const outputFilename = 'firebase-to-realtime-db-import.json';
    const outputPath = path.join(process.cwd(), outputFilename);
    
    fs.writeFileSync(outputPath, JSON.stringify(resultDatabase, null, 2), 'utf-8');
    
    console.log(`\n✅ Database successfully exported to a Realtime-DB compatible format!`);
    console.log(`📁 File created: ${outputPath}`);
    console.log(`💡 Size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    console.log(`\nNext step to import is simple:`);
    console.log(`1. Go to your Firebase Console -> Realtime Database.`);
    console.log(`2. Click on the 3 dots (...) menu option in the upper-right corner of the database viewer.`);
    console.log(`3. Click "Import JSON" and select this file: '${outputFilename}'.`);
    
  } catch (err) {
    console.error("❌ Critical error during database export:", err);
  }
}

runExporter();
