// src/lib/trialMatcherAuth.ts
//
// Firestore-based email whitelist for /trial-matcher access control.
//
// Firestore structure (create this collection in your Firebase console):
//
//   Collection: trial_matcher_users
//   Document ID: user's email address (e.g. "dr.smith@hospital.org")
//   Fields:
//     - email: string        (same as doc ID, for readability)
//     - role: "crc" | "physician"
//     - name: string         (display name, optional)
//     - organization: string (optional)
//     - addedAt: timestamp
//     - active: boolean      (set to false to revoke access without deleting)
//
// To grant access, add a document to the trial_matcher_users collection.
// To revoke access, set active: false or delete the document.
//
// Example Firestore doc:
// {
//   email: "coordinator@oncologycenter.org",
//   role: "crc",
//   name: "Jane Coordinator",
//   organization: "LCRI Oncology Center",
//   addedAt: Timestamp,
//   active: true
// }

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type TrialMatcherRole = 'crc' | 'physician';

export interface TrialMatcherUser {
email: string;
role: TrialMatcherRole;
name?: string;
organization?: string;
active: boolean;
}

export type AccessResult =
| { granted: true;  user: TrialMatcherUser }
| { granted: false; reason: 'not_authenticated' | 'not_whitelisted' | 'inactive' | 'error' };

/**
* Checks whether the given email is on the trial_matcher_users whitelist.
* Returns the user's role if access is granted, or a denial reason if not.
*/
export async function checkTrialMatcherAccess(email: string): Promise<AccessResult> {
  try {
    // Normalize email — Firestore doc IDs are case-sensitive
    const normalizedEmail = email.trim().toLowerCase();

    console.log('[TrialMatcherAuth] Checking email:', normalizedEmail);

    const docRef = doc(db, 'trial_matcher_users', normalizedEmail);
    const docSnap = await getDoc(docRef);

    console.log('[TrialMatcherAuth] Document exists:', docSnap.exists());
    console.log('[TrialMatcherAuth] Document data:', docSnap.data());

    if (!docSnap.exists()) {
      console.warn('[TrialMatcherAuth] Email not found in whitelist:', normalizedEmail);
      return { granted: false, reason: 'not_whitelisted' };
    }

    const data = docSnap.data() as TrialMatcherUser;

    console.log('[TrialMatcherAuth] Role:', data.role);
    console.log('[TrialMatcherAuth] Active:', data.active);

    if (data.active === false) {
      console.warn('[TrialMatcherAuth] User is inactive:', normalizedEmail);
      return { granted: false, reason: 'inactive' };
    }

    console.log('[TrialMatcherAuth] Access granted for:', normalizedEmail);

    return {
      granted: true,
      user: {
        email: normalizedEmail,
        role: data.role ?? 'crc',
        name: data.name,
        organization: data.organization,
        active: true,
      },
    };
  } catch (err) {
    console.error('[TrialMatcherAuth] Firestore check failed:', err);
    return { granted: false, reason: 'error' };
  }
}