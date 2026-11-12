import React, { useState } from 'react';
import { X, Star, MessageSquarePlus, Send, AlertCircle, CheckCircle2, LogIn } from 'lucide-react';
import { useAuth, ADMIN_EMAIL } from '../context/AuthContext.tsx';
import { apiService } from '../services/api.ts';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onOpenAuth }) => {
  const { user } = useAuth();

  const [category, setCategory] = useState<'bug' | 'algorithm_question' | 'feature_request' | 'general'>('general');
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [emailNotificationStatus, setEmailNotificationStatus] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in to submit feedback.');
      return;
    }

    if (message.trim().length < 5) {
      setError('Feedback message must be at least 5 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiService.submitFeedback({
        category,
        rating,
        message: message.trim()
      });

      setSuccess(true);
      setEmailNotificationStatus(res.emailSent);
      setTimeout(() => {
        setSuccess(false);
        setMessage('');
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-950 border border-blue-800">
            <MessageSquarePlus className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Share Your Feedback</h2>
            <p className="text-xs text-slate-400">Help improve OS simulations &amp; deadlock diagnostics</p>
          </div>
        </div>

        {!user ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-amber-400 mb-2" />
            <h3 className="text-sm font-semibold text-white">Authentication Required</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Feedback submissions are authenticated and recorded in Cloud Firestore for admin review.
            </p>
            <button
              onClick={() => { onClose(); onOpenAuth(); }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
            >
              <LogIn className="h-4 w-4" />
              Sign In to Continue
            </button>
          </div>
        ) : success ? (
          <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/40 p-5 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
            <h3 className="text-sm font-semibold text-white">Feedback Submitted Successfully!</h3>
            <p className="text-xs text-emerald-300/80 mt-1">
              Your feedback was recorded in Cloud Firestore and queued for administrator review.
            </p>
            {emailNotificationStatus && (
              <p className="text-[11px] text-emerald-400 font-mono mt-2">
                Notification dispatched to {ADMIN_EMAIL}.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Category Select */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="general">General Feedback</option>
                <option value="bug">Bug Report</option>
                <option value="algorithm_question">OS Algorithm Question</option>
                <option value="feature_request">Feature Request / Exercise Request</option>
              </select>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Rating</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-600 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 font-mono text-xs text-slate-400">{rating} / 5</span>
              </div>
            </div>

            {/* Feedback Message */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Your Comments</label>
              <textarea
                required
                rows={4}
                placeholder="Describe your feedback, test scenario, or suggestions..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {loading ? 'Submitting...' : 'Send Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
