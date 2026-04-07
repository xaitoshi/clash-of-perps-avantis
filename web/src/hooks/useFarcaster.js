import { useState, useEffect, useCallback } from 'react';

let sdkInstance = null;
let initPromise = null;

function isFarcasterFrame() {
  try {
    return window !== window.parent;
  } catch {
    return true;
  }
}

// Start SDK init immediately on module load (not waiting for React)
if (isFarcasterFrame()) {
  initPromise = import('@farcaster/miniapp-sdk').then(mod => {
    sdkInstance = mod.sdk;
    // Call ready() ASAP — this dismisses Farcaster splash
    mod.sdk.actions.ready();
    return mod.sdk;
  }).catch(() => null);
}

export function useFarcaster() {
  const [isInFrame, setIsInFrame] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isFarcasterFrame());

  useEffect(() => {
    if (!initPromise) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    initPromise.then(sdk => {
      if (cancelled || !sdk) { setLoading(false); return; }
      setIsInFrame(true);
      if (sdk.context?.user) {
        setUser({
          fid: sdk.context.user.fid,
          username: sdk.context.user.username,
          displayName: sdk.context.user.displayName,
          pfpUrl: sdk.context.user.pfpUrl,
        });
      }
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const shareCast = useCallback(async (text) => {
    if (!sdkInstance || !isInFrame) return;
    try {
      await sdkInstance.actions.openUrl(
        `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent('https://clashofperps.fun')}`
      );
    } catch {}
  }, [isInFrame]);

  return { isInFrame, user, loading, shareCast };
}
