import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryConstraint,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Trial, User, PatientProfile, SavedSearch, Alert, SearchCriteria } from '@/types';

// =============================================================================
// COLLECTIONS
// =============================================================================

const COLLECTIONS = {
  TRIALS: 'trials',
  USERS: 'users',
  ALERTS: 'alerts',
  SEARCH_HISTORY: 'searchHistory',
} as const;

// =============================================================================
// TRIAL OPERATIONS
// =============================================================================

export async function getTrial(nctId: string): Promise<Trial | null> {
  const docRef = doc(db, COLLECTIONS.TRIALS, nctId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return { ...docSnap.data(), nctId: docSnap.id } as Trial;
}

export async function searchTrials(criteria: SearchCriteria): Promise<Trial[]> {
  const constraints: QueryConstraint[] = [];
  
  // Build query based on criteria
  if (criteria.cancerType) {
    constraints.push(where('conditionsNormalized', 'array-contains', criteria.cancerType));
  }
  
  if (criteria.status && criteria.status.length > 0) {
    constraints.push(where('status', 'in', criteria.status));
  } else {
    // Default to recruiting trials
    constraints.push(where('status', '==', 'Recruiting'));
  }
  
  if (criteria.phase && criteria.phase.length > 0) {
    constraints.push(where('phase', 'in', criteria.phase));
  }
  
  // Order and limit
  constraints.push(orderBy('lastUpdateDate', 'desc'));
  constraints.push(limit(criteria.limit || 50));
  
  const q = query(collection(db, COLLECTIONS.TRIALS), ...constraints);
  const snapshot = await getDocs(q);
  
  let trials = snapshot.docs.map(doc => ({ ...doc.data(), nctId: doc.id } as Trial));
  
  // Client-side filtering for complex criteria
  if (criteria.biomarkers && criteria.biomarkers.length > 0) {
    trials = trials.filter(trial => 
      criteria.biomarkers!.some(b => trial.biomarkers.includes(b))
    );
  }
  
  if (criteria.stage) {
    trials = trials.filter(trial => trial.stages.includes(criteria.stage!));
  }
  
  return trials;
}

export async function saveTrial(trial: Trial): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TRIALS, trial.nctId);
  await setDoc(docRef, {
    ...trial,
    updatedAt: Timestamp.now(),
  });
}

export async function saveTrialsBatch(trials: Trial[]): Promise<void> {
  // Use batched writes for efficiency
  const { writeBatch } = await import('firebase/firestore');
  const batch = writeBatch(db);
  
  for (const trial of trials) {
    const docRef = doc(db, COLLECTIONS.TRIALS, trial.nctId);
    batch.set(docRef, {
      ...trial,
      updatedAt: Timestamp.now(),
    });
  }
  
  await batch.commit();
}

// =============================================================================
// USER OPERATIONS
// =============================================================================

export async function getUser(uid: string): Promise<User | null> {
  const docRef = doc(db, COLLECTIONS.USERS, uid);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return { ...docSnap.data(), uid: docSnap.id } as User;
}

export async function createUser(uid: string, email: string, displayName?: string): Promise<User> {
  const user: User = {
    uid,
    email,
    displayName,
    savedTrials: [],
    savedSearches: [],
    alertsEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const docRef = doc(db, COLLECTIONS.USERS, uid);
  await setDoc(docRef, {
    ...user,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  
  return user;
}

export async function updateUserProfile(uid: string, profile: PatientProfile): Promise<void> { console.log("FIRESTORE: Starting write for", uid);
  const docRef = doc(db, COLLECTIONS.USERS, uid);
  await setDoc(docRef, {
    profile,
    updatedAt: Timestamp.now(),
  }, { merge: true }); console.log("FIRESTORE: Write complete");
}

export async function saveTrialToUser(uid: string, nctId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(docRef, {
    savedTrials: arrayUnion(nctId),
    updatedAt: Timestamp.now(),
  });
}

export async function removeTrialFromUser(uid: string, nctId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(docRef, {
    savedTrials: arrayRemove(nctId),
    updatedAt: Timestamp.now(),
  });
}

export async function saveSearchToUser(uid: string, search: SavedSearch): Promise<void> {
  const docRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(docRef, {
    savedSearches: arrayUnion(search),
    updatedAt: Timestamp.now(),
  });
}

// =============================================================================
// ALERT OPERATIONS
// =============================================================================

export async function createAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Promise<string> {
  const alertsRef = collection(db, COLLECTIONS.ALERTS);
  const docRef = doc(alertsRef);
  
  await setDoc(docRef, {
    ...alert,
    id: docRef.id,
    createdAt: Timestamp.now(),
  });
  
  return docRef.id;
}

export async function getUserAlerts(uid: string): Promise<Alert[]> {
  const q = query(
    collection(db, COLLECTIONS.ALERTS),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Alert));
}

export async function updateAlert(alertId: string, updates: Partial<Alert>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.ALERTS, alertId);
  await updateDoc(docRef, updates);
}

export async function deleteAlert(alertId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.ALERTS, alertId);
  await deleteDoc(docRef);
}

// =============================================================================
// STATISTICS
// =============================================================================

export async function getTrialStats(): Promise<{
  total: number;
  recruiting: number;
  byPhase: Record<string, number>;
  byCancerType: Record<string, number>;
}> {
  // For now, return mock stats - in production, use aggregation or Cloud Function
  return {
    total: 0,
    recruiting: 0,
    byPhase: {},
    byCancerType: {},
  };
}
