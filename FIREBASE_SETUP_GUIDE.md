# 🔥 Firebase & Cloud Firestore Detailed Setup Guide

This comprehensive guide walks you through setting up **Firebase** and **Cloud Firestore Database** from scratch for the **AI Resume Analyzer & Mock Interview Platform**.

Follow these exact steps to get your API keys and connect your live database.

---

## 📋 Table of Contents
1. [Step 1: Create a Firebase Project](#step-1-create-a-firebase-project)
2. [Step 2: Register a Web App & Get API Credentials](#step-2-register-a-web-app--get-api-credentials)
3. [Step 3: Enable Cloud Firestore Database](#step-3-enable-cloud-firestore-database)
4. [Step 4: Configure Firestore Security Rules](#step-4-configure-firestore-security-rules)
5. [Step 5: Add Credentials to Your Project (.env)](#step-5-add-credentials-to-your-project-env)
6. [Step 6: Verify Connection in Console Logs](#step-6-verify-connection-in-console-logs)
7. [Database Collections Schema Reference](#database-collections-schema-reference)

---

## Step 1: Create a Firebase Project

1. Open your browser and navigate to the **[Firebase Console](https://console.firebase.google.com/)**.
2. Sign in with your Google Account.
3. Click **"Add project"** (or **"Create a project"**).
4. Enter a name for your project, for example: `ai-resume-analyzer`.
5. *(Optional)* You can disable Google Analytics or leave it enabled (default).
6. Click **"Create project"** and wait a few seconds for Firebase to provision your project.
7. Click **"Continue"** to enter the Firebase project dashboard.

---

## Step 2: Register a Web App & Get API Credentials

1. In the Project Overview page, under **"Get started by adding Firebase to your app"**, click the **Web icon** (`</>`).
2. Enter an **App nickname** (e.g., `ResumeAI-Web`).
3. You can leave the "Also set up Firebase Hosting" checkbox **unchecked** for now.
4. Click **"Register app"**.
5. Firebase will display a code block containing your `firebaseConfig` object, which looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef",
  measurementId: "G-XXXXXXXXXX"
};
```

> [!TIP]
> Keep this page open, or note down these values. You will paste them into your `.env` file in **Step 5**.
>
> If you ever need to find these keys again later:
> Click the **⚙️ Project Settings** (gear icon next to Project Overview in left sidebar) -> scroll down to **"Your apps"** section.

---

## Step 3: Enable Cloud Firestore Database

1. In the left navigation sidebar of Firebase Console, click on **Build** -> **Firestore Database**.
2. Click the **"Create database"** button.
3. **Database ID & Location**:
   - Leave Database ID as `(default)`.
   - Choose a location closest to you or your users (e.g., `nam5 (us-central)`, `asia-south1 (Mumbai)`, `europe-west1`, etc.).
   - Click **"Next"**.
4. **Security Rules mode**:
   - Select **"Start in test mode"** (this allows read/write access for initial testing).
   - Click **"Create"** (or **"Enable"**).
5. Wait a moment while Firebase provisions Cloud Firestore. Once ready, you will see the Firestore Data panel.

---

## Step 4: Configure Firestore Security Rules

To ensure your app can read and write resume analyses and interview sessions properly, update the Firestore Rules:

1. Inside **Firestore Database**, click on the **"Rules"** tab at the top.
2. Replace the rules editor content with the following configuration:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Resume Analysis audits collection
    match /resume_analyses/{documentId} {
      allow read, write, delete: if true;
    }
    
    // Mock Interview Sessions and Evaluations collection
    match /interview_sessions/{documentId} {
      allow read, write, delete: if true;
    }
    
    // Default fallback rule
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"** to activate these security rules.

> [!NOTE]
> These rules allow the web client to save and query documents freely. For production deployments with Firebase Authentication, you can restrict access based on `request.auth.uid`.

---

## Step 5: Add Credentials to Your Project (.env)

1. In the root of your project directory (`ai-resume-analyzer`), open or create the `.env` file.
2. Add your Firebase keys with the `VITE_` prefix as shown below (replace with your actual values from Step 2):

```env
# Google Gemini API Key
GEMINI_API_KEY="your_actual_gemini_api_key"

# Firebase Cloud Firestore Credentials
VITE_FIREBASE_API_KEY="AIzaSyD-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef1234567890abcdef"
VITE_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"
```

3. Save the `.env` file.
4. Restart your development server so Vite reloads the new environment variables:
   ```bash
   npm run dev
   ```

---

## Step 6: Verify Connection in Console Logs

Open your browser's Developer Tools Console (**F12** or **Ctrl+Shift+I** -> **Console** tab):

When the application loads, you will see clear console logs:
- `[Firebase] Initializing Firebase connection...`
- `[Firebase] Connected to Firestore project: "your-project-id" 🚀`
- `[Firestore] Subscribed to real-time resume audits collection.`
- `[Firestore] Subscribed to real-time interview sessions collection.`

When you analyze a resume:
- `[Firestore] Saving resume analysis to collection "resume_analyses" (ID: ...)...`
- `[Firestore] Resume analysis saved successfully! ✅`

---

## 🗄️ Database Collections Schema Reference

The app automatically manages two main collections in Firestore:

### 1. `resume_analyses` Collection
Stores all analyzed resumes, ATS scores, section breakdowns, and recommendations:
- `id` *(string)*: Unique document ID
- `fileName` *(string)*: Uploaded file name
- `candidateName` *(string)*: Extracted candidate name
- `targetRole` *(string)*: Evaluated target job role
- `atsScore` *(number)*: Calculated ATS score (0-100)
- `atsCategory` *(string)*: 'Excellent' | 'Good' | 'Needs Improvement' | 'Critical Updates Needed'
- `date` *(string)*: Formatted date string
- `createdAt` *(number)*: Epoch timestamp for sorting
- `result` *(object)*: Full structured analysis report (skillsFound, missingSkills, strengths, weaknesses, grammarSuggestions, improvementTips, suitableJobRoles, sectionScores)

### 2. `interview_sessions` Collection
Stores mock interview sessions, questions, candidate answers, detailed evaluations, and progress metrics:
- `id` *(string)*: Unique session ID
- `targetRole` *(string)*: Role tested (e.g., 'Full Stack Software Engineer')
- `interviewLevel` *(string)*: 'Beginner' | 'Intermediate' | 'Advanced'
- `interviewType` *(string)*: 'Technical' | 'HR / Behavioral' | 'Mixed'
- `interviewMode` *(string)*: 'Chat' | 'Voice'
- `overallScore` *(number)*: Calculated final score (0-100)
- `overallRating` *(string)*: 'Exceptional' | 'Strong' | 'Adequate' | 'Needs Improvement'
- `candidateName` *(string)*: Candidate name
- `savedAt` / `completedAt` *(string)*: ISO timestamp strings
- `session` *(object)*: Completed session details, questions, answers, durations
- `evaluations` *(array)*: Individual per-question scores, feedback, strengths, model answers
- `finalSummary` *(object)*: Aggregated scores, dimension ratings, radar charts, action plans

---

🎉 **You are now completely set up with Firebase Cloud Firestore!**
All your resume audits and mock interview records are dynamically stored in the cloud in real-time.
