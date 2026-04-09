import { useState, useEffect, useCallback } from 'react';

let sdkInstance = null;
let initPromise = null;

export function isFarcasterFrame() {
  try { return window !== window.parent; } catch { return true; }
}

function _log(level, message) {
  fetch('/api/client-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, message, ua: navigator.userAgent, url: location.href }),
  }).catch(() => {});
}

// Always init SDK and call ready() — don't gate on detection
// Per Farcaster docs: "If you don't call ready(), users will see an infinite loading screen"
initPromise = import('@farcaster/miniapp-sdk').then(async (mod) => {
  sdkInstance = mod.sdk;
  _log('info', 'SDK imported, calling ready()');
  await mod.sdk.actions.ready({ disableNativeGestures: true });
  _log('info', 'ready() done');
  return mod.sdk;
}).catch((err) => {
  _log('error', `SDK init/ready failed: ${err}`);
  return null;
});

export function useFarcaster() {
  const [isInFrame, setIsInFrame] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    initPromise.then(async (sdk) => {
      if (cancelled || !sdk) { setLoading(false); return; }

      // Check if we're actually in a mini app context
      try {
        const ctx = await sdk.context;
        if (ctx?.user && !cancelled) {
          setIsInFrame(true);
          setUser({
            fid: Number(ctx.user.fid) || 0,
            username: String(ctx.user.username || ''),
            displayName: String(ctx.user.displayName || ''),
            pfpUrl: String(ctx.user.pfpUrl || ''),
          });
          _log('info', `Context: fid=${ctx.user.fid}, platform=${ctx?.client?.platformType || '?'}`);
        }
      } catch {}

      if (!cancelled) setLoading(false);
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
