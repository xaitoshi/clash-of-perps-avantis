import { useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider as SolWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

import '@solana/wallet-adapter-react-ui/styles.css';

const RPC_LIST = [
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet-beta.solana.com',
  'https://solana.drpc.org',
  'https://rpc.ankr.com/solana',
];

function useBestRpc() {
  const [rpc, setRpc] = useState(RPC_LIST[0]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const url of RPC_LIST) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000);
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' }),
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (res.ok && !cancelled) {
            setRpc(url);
            return;
          }
        } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return rpc;
}

import { isFarcasterFrame } from '../hooks/useFarcaster';

/**
 * Wait for Farcaster Solana wallet to register via wallet-standard.
 * The @farcaster/mini-app-solana package registers asynchronously —
 * we must delay WalletProvider mount until that completes, otherwise
 * autoConnect fires before the wallet exists.
 */
function useFarcasterWalletReady() {
  const inFrame = useMemo(() => isFarcasterFrame(), []);
  const [ready, setReady] = useState(!inFrame); // instant if not in frame

  useEffect(() => {
    if (!inFrame) return;

    let done = false;

    // Listen for wallet-standard registration event
    const handler = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    window.addEventListener('wallet-standard:register-wallet', handler);

    // Also import the package to trigger registration
    import('@farcaster/mini-app-solana').then(() => {
      // Give wallet-standard event a moment to fire
      setTimeout(() => {
        if (!done) { done = true; setReady(true); }
      }, 500);
    }).catch(() => {
      if (!done) { done = true; setReady(true); }
    });

    // Safety timeout — don't block forever
    const timer = setTimeout(() => {
      if (!done) { done = true; setReady(true); }
    }, 3000);

    return () => {
      done = true;
      clearTimeout(timer);
      window.removeEventListener('wallet-standard:register-wallet', handler);
    };
  }, [inFrame]);

  return { ready, inFrame };
}

export default function WalletProvider({ children }) {
  const wallets = useMemo(() => [], []);
  const rpc = useBestRpc();
  const { ready, inFrame } = useFarcasterWalletReady();

  // Don't mount wallet adapter until Farcaster wallet is registered
  if (!ready) return null;

  return (
    <ConnectionProvider endpoint={rpc}>
      <SolWalletProvider
        wallets={wallets}
        autoConnect={true}
        localStorageKey={inFrame ? 'fcWalletName' : 'walletName'}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolWalletProvider>
    </ConnectionProvider>
  );
}
