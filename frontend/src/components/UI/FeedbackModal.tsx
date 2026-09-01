import React, { useState } from 'react';
import {
  X,
  MessageSquareHeart,
  Star,
  Send,
} from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-violet-500/20 bg-[#0b0b10] shadow-2xl shadow-violet-950/40">

        {/* Violet glow */}
        <div className="pointer-events-none absolute -top-32 right-0 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-white/[0.07] px-6 py-5">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10">
              <MessageSquareHeart className="h-5 w-5 text-violet-400" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Share your feedback
              </h2>

              <p className="text-xs text-slate-500">
                Help improve the DocAI experience
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Close feedback"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        {submitted ? (
  <div className="relative p-8 text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
      <span className="text-2xl text-violet-400">✓</span>
    </div>

    <h3 className="mt-5 text-xl font-semibold text-white">
      Thank you!
    </h3>

    <p className="mt-2 text-sm leading-6 text-slate-400">
      Your feedback has been received.
    </p>

    <button
      type="button"
      onClick={onClose}
      className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
    >
      Done
    </button>
  </div>
) : (
        <form
            onSubmit={async (e) => {
            e.preventDefault();

            setIsSubmitting(true);

            const form = e.currentTarget;
            const formData = new FormData(form);

            try {
                  const response = await fetch('https://formspree.io/f/mnpqjeld',
            {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (response.ok) {
        setSubmitted(true);
        form.reset();
        setRating(0);
      } else {
        alert('Something went wrong. Please try again.');
      }
        } catch {
          alert('Unable to send feedback. Please try again.');
        } finally {
          setIsSubmitting(false);
        }
        }}
            className="relative p-6"
        >
          {/* Name */}
          <label className="block">
            <span className="text-xs font-medium text-slate-300">
              Name
            </span>

            <input
              type="text"
              name="name"
              placeholder="Your name"
              className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-violet-500/50 focus:bg-violet-500/[0.05]"
            />
          </label>

          {/* Email */}
          <label className="mt-4 block">
            <span className="text-xs font-medium text-slate-300">
              Email
            </span>

            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-violet-500/50 focus:bg-violet-500/[0.05]"
            />
          </label>

          {/* Rating */}
          <div className="mt-5">
            <span className="text-xs font-medium text-slate-300">
              How was your experience?
            </span>

            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded-lg p-1.5 transition hover:bg-violet-500/10"
                  aria-label={`${value} stars`}
                >
                  <Star
                    className={`h-6 w-6 ${
                      value <= rating
                        ? 'fill-violet-400 text-violet-400'
                        : 'text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            <input
              type="hidden"
              name="rating"
              value={rating}
            />
          </div>

          {/* Feedback */}
          <label className="mt-5 block">
            <span className="text-xs font-medium text-slate-300">
              Feedback
            </span>

            <textarea
              name="message"
              required
              rows={4}
              placeholder="Tell me about your experience..."
              className="mt-2 w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-violet-500/50 focus:bg-violet-500/[0.05]"
            />
          </label>

          {/* Submit */}
          <button
            type="submit"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </button>

        </form>
)}
      </div>
    </div>
  );
};

export default FeedbackModal;
