#!/usr/bin/env node

/**
 * Script to upload demo data to Firebase Cloud Storage
 * This script uploads the keyboard and lamp demo projects to the Firebase storage
 */

const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes } = require('firebase/storage');
const fs = require('fs');
const path = require('path');

// Firebase configuration - using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration is incomplete. Please check your environment variables.');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * Upload a file to Firebase Storage
 */
async function uploadFile(localPath, storagePath) {
  try {
    const fileBuffer = fs.readFileSync(localPath);
    const storageRef = ref(storage, storagePath);
    
    // Determine content type based on file extension
    const contentType = localPath.endsWith('.json') ? 'application/json' : 'application/octet-stream';
    
    await uploadBytes(storageRef, fileBuffer, {
      contentType,
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        source: 'demo-data-script'
      }
    });
    
    console.log(`✅ Uploaded: ${storagePath}`);
  } catch (error) {
    console.error(`❌ Failed to upload ${storagePath}:`, error.message);
    throw error;
  }
}

/**
 * Upload demo project data
 */
async function uploadDemoProject(projectName) {
  const demoDataPath = path.join(__dirname, '..', 'demo-data', projectName);
  const storagePath = `manuals/demo/${projectName}`;
  
  console.log(`📁 Uploading ${projectName} demo data...`);
  
  try {
    // Upload metadata.json
    await uploadFile(
      path.join(demoDataPath, 'metadata.json'),
      `${storagePath}/metadata.json`
    );
    
    // Upload materials.json
    await uploadFile(
      path.join(demoDataPath, 'materials.json'),
      `${storagePath}/materials.json`
    );
    
    // Upload steps.json
    await uploadFile(
      path.join(demoDataPath, 'steps.json'),
      `${storagePath}/steps.json`
    );
    
    console.log(`✅ Successfully uploaded ${projectName} demo data`);
  } catch (error) {
    console.error(`❌ Failed to upload ${projectName} demo data:`, error.message);
    throw error;
  }
}

/**
 * Main function to upload all demo data
 */
async function main() {
  console.log('🚀 Starting demo data upload to Firebase Cloud Storage...');
  console.log(`📡 Project ID: ${firebaseConfig.projectId}`);
  console.log(`🪣 Storage Bucket: ${firebaseConfig.storageBucket}`);
  console.log('');
  
  try {
    // Upload keyboard demo data
    await uploadDemoProject('keyboard');
    console.log('');
    
    // Upload lamp demo data
    await uploadDemoProject('lamp');
    console.log('');
    
    console.log('🎉 All demo data uploaded successfully!');
    console.log('');
    console.log('📋 Uploaded structure:');
    console.log('├── manuals/demo/keyboard/');
    console.log('│   ├── metadata.json');
    console.log('│   ├── materials.json');
    console.log('│   └── steps.json');
    console.log('├── manuals/demo/lamp/');
    console.log('│   ├── metadata.json');
    console.log('│   ├── materials.json');
    console.log('│   └── steps.json');
    console.log('');
    console.log('💡 Note: Image files need to be uploaded separately to match the URLs in the JSON files.');
    
  } catch (error) {
    console.error('💥 Upload failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { uploadDemoProject, uploadFile };