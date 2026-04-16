import admin from 'firebase-admin';

// Initialize Firebase Admin once (cached by Node.js module system)
export const getAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Try to initialize with service account from environment
  const serviceAccountJson = process.env.FIREBASE_ADMIN_SDK_KEY;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_ADMIN_SDK_KEY environment variable is not set');
  }

  let serviceAccount: Record<string, unknown>;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error(
      'FIREBASE_ADMIN_SDK_KEY is not valid JSON. Ensure it is a single-line JSON string wrapped in quotes in .env.local.'
    );
  }

  if (typeof serviceAccount.private_key === 'string') {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
  });

  return admin.app();
};

/**
 * Verify Firebase ID token from request and return the decoded token.
 * Extract token from Authorization header: "Bearer <token>"
 */
export async function verifyIdToken(request: Request): Promise<admin.auth.DecodedIdToken> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.substring('Bearer '.length);

  try {
    const adminAuth = getAdminApp().auth();
    const decodedToken = await adminAuth.verifyIdToken(token);

    return decodedToken;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid ID token: ${error.message}`);
    }
    throw new Error('Invalid ID token');
  }
}

/**
 * Get the authenticated user's UID from the request.
 * Returns the UID or throws an error if token is invalid.
 */
export async function getAuthenticatedUserId(request: Request): Promise<string> {
  const decodedToken = await verifyIdToken(request);

  return decodedToken.uid;
}
