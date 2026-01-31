# TrialMatchRX v2

AI-powered precision matching for cancer clinical trials. Find trials personalized to your cancer type, stage, biomarkers, and treatment history.

## Features

- 🤖 **AI-Powered Search**: Natural language queries using Claude AI
- 🎯 **Precision Matching**: Match scores based on cancer profile
- 📊 **Rich Trial Data**: Detailed eligibility, locations, and biomarker info
- 🔔 **Trial Alerts**: Get notified when new matching trials open
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🌙 **Dark Mode**: Easy on the eyes

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Firebase Cloud Functions
- **Database**: Firestore
- **Auth**: Firebase Authentication
- **AI**: Claude API (Anthropic)
- **Data Source**: ClinicalTrials.gov API

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project
- Anthropic API key

### Installation

1. **Clone and install dependencies**:
   ```bash
   cd trialmatchrx-v2
   npm install
   cd functions && npm install && cd ..
   ```

2. **Configure Firebase**:
   ```bash
   firebase login
   firebase use --add  # Select your project
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Firebase config and Anthropic API key
   ```

4. **Set Cloud Functions secrets**:
   ```bash
   firebase functions:secrets:set ANTHROPIC_API_KEY
   # Enter your Anthropic API key when prompted
   ```

5. **Deploy Firestore rules and indexes**:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

### Development

Run the development server:

```bash
npm run dev
```

Run with Firebase emulators:

```bash
firebase emulators:start
# In another terminal:
npm run dev
```

### Deployment

Build and deploy to Firebase:

```bash
npm run deploy
```

Deploy only functions:

```bash
npm run deploy:functions
```

## Project Structure

```
trialmatchrx-v2/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── page.tsx         # Homepage
│   │   ├── search/          # Search page
│   │   ├── trial/[nctId]/   # Trial detail page
│   │   └── ...
│   ├── components/          # React components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── SearchForm.tsx
│   │   └── TrialCard.tsx
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and services
│   │   ├── firebase.ts      # Firebase client
│   │   ├── firestore.ts     # Database operations
│   │   ├── claude.ts        # Claude AI integration
│   │   ├── clinicaltrials-gov.ts  # ClinicalTrials.gov API
│   │   └── store.ts         # Zustand state management
│   └── types/               # TypeScript types
├── functions/               # Firebase Cloud Functions
│   └── src/
│       └── index.ts         # API endpoints
├── public/                  # Static assets
├── firebase.json            # Firebase config
├── firestore.rules          # Security rules
└── firestore.indexes.json   # Database indexes
```

## API Endpoints

### Search Trials
```
POST /api/search
Body: { criteria: SearchCriteria, profile?: PatientProfile }
```

### AI Match Analysis
```
POST /api/ai-match
Body: { action: 'parse' | 'analyze' | 'summarize', ... }
```

## Data Model

### Trial
- `nctId`: ClinicalTrials.gov identifier
- `title`, `briefTitle`, `officialTitle`
- `status`: Recruiting, Active, Completed, etc.
- `phase`: Phase 1-4
- `conditions`, `conditionsNormalized`
- `biomarkers`, `biomarkersRequired`, `biomarkersExcluded`
- `stages`: Stage I-IV, Metastatic, etc.
- `eligibilityCriteria`, `eligibilityParsed`
- `locations`: Array of study sites
- `interventions`: Drugs/treatments being tested

### User Profile
- `cancerType`, `cancerSubtype`, `stage`
- `biomarkers`: Array of patient's biomarkers
- `priorTreatments`: Treatment history
- `zip`, `searchRadius`: Location preferences

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Proprietary - All rights reserved.

## Disclaimer

TrialMatchRX does not provide medical advice. Always consult a licensed healthcare professional before making decisions about clinical trial participation.

---

Built by Kenneth with Claude AI
