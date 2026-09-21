import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * "Continue with Google" button.
 *
 * Renders the official Google Identity Services button when
 * VITE_GOOGLE_CLIENT_ID is configured. Renders a disabled placeholder with a
 * setup hint during development when it is not, so the layout never breaks.
 *
 * Setup:
 *   1. Google Cloud Console -> APIs & Services -> Credentials -> OAuth 2.0 Client ID
 *      (type: Web application; add your dev + production origins under
 *      "Authorized JavaScript origins")
 *   2. Put the client ID in .env as VITE_GOOGLE_CLIENT_ID (frontend)
 *      and GOOGLE_CLIENT_ID (backend) — they must be the same value.
 */
export default function GoogleLoginButton({ onError }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const btnRef = useRef(null);
  const [ready, setReady] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !window.google?.accounts?.id) return undefined;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            const user = await loginWithGoogle(response.credential);
            navigate(user.role === 'admin' ? '/admin' : '/my-orders');
          } catch (err) {
            if (onError) onError(err.message || 'Google sign-in failed');
          }
        },
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        shape: 'rectangular',
      });
      setReady(true);
    } catch (e) {
      if (onError) onError('Could not load Google sign-in');
    }
    return undefined;
  }, [clientId, loginWithGoogle, navigate, onError]);

  if (!ready) {
    return (
      <div className="space-y-1.5">
        <button
          type="button"
          disabled
          className="w-full py-3 border border-ivory/20 rounded-lg text-xs font-semibold uppercase tracking-wider text-muted flex items-center justify-center gap-2.5 cursor-not-allowed"
        >
          <GoogleG className="w-4 h-4" />
          Continue with Google
        </button>
        {!clientId && (
          <p className="text-[10px] text-muted text-center">
            Google sign-in needs VITE_GOOGLE_CLIENT_ID in .env (and GOOGLE_CLIENT_ID on the server)
          </p>
        )}
      </div>
    );
  }

  return <div ref={btnRef} className="flex justify-center" />;
}

function GoogleG({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.9h5.35c-.25 1.3-1.7 3.8-5.35 3.8A5.8 5.8 0 1 1 15.9 8l2.3-2.2A9 9 0 1 0 12 21c5.2 0 8.65-3.65 8.65-8.8 0-.6-.1-1.1-.3-1.1z"
      />
    </svg>
  );
}
