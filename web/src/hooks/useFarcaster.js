import { useState, useEffect, useCallback } from 'react';

let sdkReady = false;

// Detect if we're running inside a Farcaster client (Warpcast)
function isFarcasterFrame() {
  try {
    return window !== window.parent || window.location.search.includes('fc_');
  } catch {
    return true; // cross-origin iframe = likely Farcaster
  }
}

export function useFarcaster() {
  const [isInFrame, setIsInFrame] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFarcasterFrame()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        // Use early-init SDK from index.html if available, otherwise import
        let sdk = window.__fcSdk;
        if (!sdk && window.__fcEarly) {
          sdk = await window.__fcEarly;
        }
        if (!sdk) {
          const mod = await import('@farcaster/miniapp-sdk');
          sdk = mod.sdk;
          if (!sdkReady) {
            await sdk.actions.ready();
            sdkReady = true;
          }
        }

        if (cancelled) return;
        setIsInFrame(true);

        // Get user context
        const fcUser = window.__fcUser || sdk.context?.user;
        if (fcUser) {
          setUser({
            fid: fcUser.fid,
            username: fcUser.username,
            displayName: fcUser.displayName,
            pfpUrl: fcUser.pfpUrl,
          });
        }
      } catch (e) {
        console.warn('Farcaster SDK init failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // Share a cast (post) to Farcaster
  const shareCast = useCallback(async (text) => {
    if (!isInFrame) return;
    try {
      const sdk = window.__fcSdk;
      if (sdk) {
        await sdk.actions.openUrl(
          `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent('https://clashofperps.fun')}`
        );
      }
    } catch {}
  }, [isInFrame]);

  return { isInFrame, user, loading, shareCast };
}
