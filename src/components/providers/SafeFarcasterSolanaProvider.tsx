import React, { createContext, useEffect, useState, useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import { sdk } from '@farcaster/miniapp-sdk';

const FarcasterSolanaProvider = dynamic(
  () => import('@farcaster/mini-app-solana').then(mod => mod.FarcasterSolanaProvider),
  { ssr: false }
);

type SafeFarcasterSolanaProviderProps = {
  endpoint: string;
  children: React.ReactNode;
};

const SolanaProviderContext = createContext<{ hasSolanaProvider: boolean }>({ hasSolanaProvider: false });

export function SafeFarcasterSolanaProvider({ endpoint, children }: SafeFarcasterSolanaProviderProps) {
  const isClient = typeof window !== "undefined";
  const [hasSolanaProvider, setHasSolanaProvider] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  useEffect(() => {
    if (!isClient) return;
    let cancelled = false;
    (async () => {
      try {
        const provider = await sdk.wallet.getSolanaProvider();
        if (!cancelled) {
          setHasSolanaProvider(!!provider);
        }
      } catch {
        if (!cancelled) {
          setHasSolanaProvider(false);
        }
      } finally {
        if (!cancelled) {
          setChecked(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isClient]);

  // Suprimir errores conocidos de Solana provider de manera segura
  useLayoutEffect(() => {
    if (!isClient) return;
    
    const originalError = console.error;
    let errorShown = false;
    
    // Interceptar console.error de manera segura
    console.error = (...args: any[]) => {
      const errorMessage = args[0]?.toString() || '';
      
      // Suprimir errores conocidos relacionados con Solana provider y useInsertionEffect
      if (
        errorMessage.includes("WalletConnectionError: could not get Solana provider") ||
        errorMessage.includes("useInsertionEffect must not schedule updates") ||
        errorMessage.includes("Cross-Origin-Opener-Policy") ||
        errorMessage.includes("HTTP error! status: 404")
      ) {
        // Suprimir estos errores conocidos que no afectan la funcionalidad
        return;
      }
      
      // Pasar otros errores normalmente
      originalError.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
    };
  }, [isClient]);

  if (!isClient || !checked) {
    return null;
  }

  return (
    <SolanaProviderContext.Provider value={{ hasSolanaProvider }}>
      {hasSolanaProvider ? (
        <FarcasterSolanaProvider endpoint={endpoint}>
          {children}
        </FarcasterSolanaProvider>
      ) : (
        <>{children}</>
      )}
    </SolanaProviderContext.Provider>
  );
}

export function useHasSolanaProvider() {
  return React.useContext(SolanaProviderContext).hasSolanaProvider;
}
