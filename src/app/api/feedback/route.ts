import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, email, page, userId, aiResponseId, rating } = body;

    if (!message && !rating) {
      return NextResponse.json({ error: 'Message or rating required' }, { status: 400 });
    }

    const db = getFirestore();
    
    const feedback = {
      type: type || 'general',
      message: message || '',
      email: email || '',
      page: page || '',
      userId: userId || null,
      aiResponseId: aiResponseId || null,
      rating: rating || null,
      createdAt: new Date(),
      status: 'new',
    };

    const docRef = await db.collection('feedback').add(feedback);

    // Send email notification (optional)
    if (process.env.RESEND_API_KEY && message) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'TrialMatchRX <alerts@mytrialmatchrx.com>',
            to: 'trialmatchrx@ijelany.com',
            subject: `[Feedback] ${type || 'General'}: ${message.substring(0, 50)}...`,
            html: `
              <h2>New Feedback Received</h2>
              <p><strong>Type:</strong> ${type || 'General'}</p>
              <p><strong>Page:</strong> ${page || 'N/A'}</p>
              <p><strong>User Email:</strong> ${email || 'Not provided'}</p>
              <p><strong>User ID:</strong> ${userId || 'Anonymous'}</p>
              <hr />
              <p><strong>Message:</strong></p>
              <p>${message}</p>
              <hr />
              <p><small>Feedback ID: ${docRef.id}</small></p>
            `,
          }),
        });
      } catch (emailError) {
        console.error('Failed to send feedback email:', emailError);
      }
    }

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
