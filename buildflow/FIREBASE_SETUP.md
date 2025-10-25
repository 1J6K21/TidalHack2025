# Firebase Setup Guide for BuildFlow

This guide will help you set up Firebase Cloud Storage for the BuildFlow application, including demo data and security rules.

## Prerequisites

1. A Firebase project created at [Firebase Console](https://console.firebase.google.com/)
2. Firebase CLI installed: `npm install -g firebase-tools`
3. Environment variables configured in `.env.local`

## Step 1: Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Firebase configuration:

```bash
cp .env.local.example .env.local
```

Update the following variables with your Firebase project details:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 2: Enable Firebase Storage

1. Go to your Firebase Console
2. Navigate to **Storage** in the left sidebar
3. Click **Get Started**
4. Choose your storage location (preferably close to your users)
5. Click **Done**

## Step 3: Deploy Security Rules

Deploy the Firebase Storage security rules:

```bash
# Login to Firebase (if not already logged in)
firebase login

# Initialize Firebase in your project (if not already done)
firebase init storage

# Deploy the security rules
firebase deploy --only storage
```

The security rules in `firebase-storage.rules` provide:
- **Public read access** to demo content (`/manuals/demo/`, `/images/demo/`)
- **Authenticated access** to user-generated content
- **Public read access** to shared images (thumbnails, steps, materials)

## Step 4: Upload Demo Data

Upload the demo manual data to Firebase Cloud Storage:

```bash
npm run upload-demo-data
```

This script will upload:
- Keyboard demo project (metadata, materials, steps)
- Lamp demo project (metadata, materials, steps)

## Step 5: Upload Demo Images (Manual Step)

The demo data references image URLs that need to be uploaded manually. You'll need to upload images to match these paths:

### Keyboard Project Images
- `manuals/demo/keyboard/images/thumbnail.jpg`
- `manuals/demo/keyboard/images/materials/` (pcb.jpg, switches.jpg, keycaps.jpg, case.jpg, stabilizers.jpg, foam.jpg, cable.jpg)
- `manuals/demo/keyboard/images/steps/` (step-1.jpg through step-8.jpg)

### Lamp Project Images
- `manuals/demo/lamp/images/thumbnail.jpg`
- `manuals/demo/lamp/images/materials/` (base.jpg, arm.jpg, bulb.jpg, shade.jpg, switch.jpg, socket.jpg, wirenuts.jpg, screws.jpg)
- `manuals/demo/lamp/images/steps/` (step-1.jpg through step-6.jpg)

You can upload these images through:
1. **Firebase Console**: Go to Storage > Files and upload manually
2. **Firebase CLI**: Use `firebase storage:upload` commands
3. **Custom script**: Create a script similar to `uploadDemoData.js` for images

## Step 6: Verify Setup

Test your Firebase setup:

1. Start the development server: `npm run dev:demo`
2. Check browser console for any Firebase errors
3. Verify that demo mode loads without errors
4. Test manual data fetching in the application

## Directory Structure

After setup, your Firebase Storage should have this structure:

```
/manuals/
  /demo/
    /keyboard/
      metadata.json
      materials.json
      steps.json
      /images/
        thumbnail.jpg
        /materials/
          pcb.jpg
          switches.jpg
          keycaps.jpg
          case.jpg
          stabilizers.jpg
          foam.jpg
          cable.jpg
        /steps/
          step-1.jpg
          step-2.jpg
          step-3.jpg
          step-4.jpg
          step-5.jpg
          step-6.jpg
          step-7.jpg
          step-8.jpg
    /lamp/
      metadata.json
      materials.json
      steps.json
      /images/
        thumbnail.jpg
        /materials/
          base.jpg
          arm.jpg
          bulb.jpg
          shade.jpg
          switch.jpg
          socket.jpg
          wirenuts.jpg
          screws.jpg
        /steps/
          step-1.jpg
          step-2.jpg
          step-3.jpg
          step-4.jpg
          step-5.jpg
          step-6.jpg
  /generated/
    (user-generated content will be stored here)
```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check that security rules are deployed correctly
2. **File Not Found**: Verify that demo data was uploaded successfully
3. **CORS Errors**: Ensure your domain is added to Firebase Storage CORS settings
4. **Environment Variables**: Double-check that all Firebase config variables are set correctly

### Testing Commands

```bash
# Test Firebase connection
firebase projects:list

# Check security rules
firebase storage:rules:get

# View uploaded files
firebase storage:ls manuals/demo/

# Test demo data upload
npm run upload-demo-data
```

## Security Notes

- Demo content is publicly readable but not writable
- User-generated content requires authentication
- Images are publicly readable to allow sharing
- Admin content is restricted to Firebase Admin SDK only

## Next Steps

After completing this setup:
1. Test the application in demo mode
2. Implement user authentication for live mode
3. Add image upload functionality for user-generated content
4. Configure production environment variables