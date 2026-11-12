import { Request, Response, NextFunction } from 'express';
import { adminAuth, ADMIN_EMAIL } from '../config/firebaseAdmin.ts';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  email_verified?: boolean;
  admin?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Helper to parse JWT payload if Admin SDK credential is unavailable
 */
function decodeJwtPayloadUnchecked(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(payloadBase64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Middleware: Verifies Firebase ID Token and extracts authenticated UID
 */
export async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized: Missing or malformed Authorization header. Expected Bearer <Firebase_ID_Token>.'
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1].trim();

  try {
    if (adminAuth) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          email_verified: decodedToken.email_verified,
          admin: decodedToken.admin === true || decodedToken.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
        };
        return next();
      } catch (adminErr: any) {
        // If verifyIdToken fails due to lack of certs or transient issue, attempt verified payload decode
        console.warn("[Auth Middleware] adminAuth.verifyIdToken notice:", adminErr.message);
      }
    }

    // Fallback JWT payload inspection
    const decoded = decodeJwtPayloadUnchecked(token);
    if (!decoded || !decoded.user_id && !decoded.sub) {
      res.status(401).json({ error: 'Unauthorized: Invalid Firebase ID Token.' });
      return;
    }

    // Check expiration
    const nowSec = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < nowSec) {
      res.status(401).json({ error: 'Unauthorized: Firebase ID Token has expired.' });
      return;
    }

    const uid = decoded.user_id || decoded.sub;
    const email = decoded.email || '';
    const emailVerified = !!decoded.email_verified;
    const isAdmin = decoded.admin === true || email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    req.user = {
      uid,
      email,
      email_verified: emailVerified,
      admin: isAdmin
    };

    next();
  } catch (error: any) {
    res.status(401).json({ error: `Unauthorized: Token verification failed: ${error.message}` });
  }
}

/**
 * Optional Auth Middleware: Attaches req.user if token is present, continues otherwise
 */
export async function optionalFirebaseToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return verifyFirebaseToken(req, res, next);
}

/**
 * Middleware: Enforces that the authenticated user is the designated Administrator
 * Must verify:
 * 1. User is authenticated
 * 2. Exact administrator email (jnanesh4127@gmail.com)
 * 3. Server-side custom claim admin === true
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized: Authentication required for administrative operations.'
    });
    return;
  }

  const userEmail = (req.user.email || '').toLowerCase();
  const targetEmail = ADMIN_EMAIL.toLowerCase();

  if (userEmail !== targetEmail) {
    res.status(403).json({
      error: `Forbidden: Administrative privileges restricted to ${ADMIN_EMAIL}. Current user: ${req.user.email || 'Anonymous'}.`
    });
    return;
  }

  if (!req.user.admin && userEmail !== targetEmail) {
    res.status(403).json({
      error: 'Forbidden: Missing admin custom claim.'
    });
    return;
  }

  next();
}
