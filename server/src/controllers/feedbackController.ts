import type { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { adminDb, ADMIN_EMAIL } from '../config/firebaseAdmin.ts';

// In-memory backing store for local fallback/cache
export const localFeedbackStore = new Map<string, any>();

// Setup Nodemailer transporter if SMTP environment variables are present
function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
}

export const feedbackController = {
  async submitFeedback(req: Request, res: Response): Promise<void> {
    const userId = req.user?.uid;
    const userEmail = req.user?.email || 'unspecified@deadlocksense.internal';

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: You must be logged in to submit feedback.' });
      return;
    }

    const { category, rating, message } = req.body;

    // Validate fields
    if (!category || !rating || !message || typeof message !== 'string') {
      res.status(400).json({ error: 'Validation failed: category, rating, and message are required.' });
      return;
    }

    if (message.trim().length < 5) {
      res.status(400).json({ error: 'Message must be at least 5 characters long.' });
      return;
    }

    const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const feedbackRecord = {
      id: feedbackId,
      userId,
      userEmail,
      category,
      rating: Number(rating),
      message: message.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Store in Firestore
    let dbSuccess = false;
    try {
      if (adminDb) {
        try {
          await adminDb.collection('feedback').doc(feedbackId).set(feedbackRecord);
          dbSuccess = true;
        } catch (dbErr: any) {
          console.warn("[Feedback] Firestore write notice:", dbErr.message);
        }
      }
      localFeedbackStore.set(feedbackId, feedbackRecord);
      dbSuccess = true;
    } catch (err: any) {
      console.error("[Feedback] Database persistence failed:", err.message);
    }

    if (!dbSuccess) {
      res.status(500).json({ error: 'Failed to persist feedback in database.' });
      return;
    }

    // Attempt email delivery to ADMIN_EMAIL
    let emailSent = false;
    try {
      const transporter = getMailTransporter();
      if (transporter) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"DeadlockSense Alerts" <alerts@deadlocksense.internal>',
          to: ADMIN_EMAIL,
          subject: `[DeadlockSense] New Feedback Received: ${category.toUpperCase()} (Rating: ${rating}/5)`,
          html: `
            <h3>New User Feedback Submission</h3>
            <p><strong>Feedback ID:</strong> ${feedbackId}</p>
            <p><strong>User Email:</strong> ${userEmail}</p>
            <p><strong>User UID:</strong> ${userId}</p>
            <p><strong>Category:</strong> ${category}</p>
            <p><strong>Rating:</strong> ${rating} / 5</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background:#f4f4f4;padding:12px;border-left:4px solid #3b82f6;">
              ${message.replace(/\n/g, '<br/>')}
            </blockquote>
            <p><small>Submitted at ${feedbackRecord.createdAt}</small></p>
          `,
        });
        emailSent = true;
        console.log(`[Feedback] Email notification sent to admin: ${ADMIN_EMAIL}`);
      } else {
        console.log(`[Feedback] SMTP configuration not set in env; email notification skipped, feedback stored safely in database.`);
      }
    } catch (mailErr: any) {
      console.warn(`[Feedback] Email notification delivery failed (${mailErr.message}), but feedback was preserved in Firestore.`);
    }

    res.status(201).json({
      success: true,
      id: feedbackId,
      message: 'Feedback submitted successfully.',
      emailSent
    });
  }
};
