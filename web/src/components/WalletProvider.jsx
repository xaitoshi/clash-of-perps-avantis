import { useMemo, useState, useEffect, createElement } from 'react';
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

function isInFarcasterFrame() {
  try { return window !== window.parent; } catch { return true; }
}

// Registers Farcaster embedded wallet via Wallet Standard (inside Warpcast)
function FarcasterWalletWrapper({ children }) {
  const [FcProvider, setFcProvider] = useState(null);

  useEffect(() => {
    if (!isInFarcasterFrame()) return;
    import('@farcaster/mini-app-solana').then(mod => {
      setFcProvider(() => mod.FarcasterSolanaProvider);
    }).catch(() => {});
  }, []);

  // FarcasterSolanaProvider registers the wallet adapter via Wallet Standard
  // It must wrap children but NOT create its own ConnectionProvider
  if (FcProvider) {
    return createElement(FcProvider, null, children);
  }
  return children;
}

export default function WalletProvider({ children }) {
  const wallets = useMemo(() => [], []);
  const rpc = useBestRpc();

  return (
    <FarcasterWalletWrapper>
      <ConnectionProvider endpoint={rpc}>
        <SolWalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </SolWalletProvider>
      </ConnectionProvider>
    </FarcasterWalletWrapper>
  );
}
