"use client";

import { useEffect, useState } from "react";
import { useMiniApp } from "@neynar/react";
import { useUser } from "@clerk/nextjs";
import { sdk } from "@farcaster/miniapp-sdk";
import { Header } from "~/components/ui/Header";
import { Footer } from "~/components/ui/Footer";
import { HomeTab } from "~/components/ui/tabs";
import { MaquinasTab } from "~/components/vending/MaquinasTab";
import { RecoleccionesTab } from "~/components/ui/tabs/RecoleccionesTab";
import { CostosTab } from "~/components/vending/CostosTab";
import { RentabilidadView } from "~/components/vending/RentabilidadView";
import { LoginScreen } from "~/components/auth/LoginScreen";
import { useNeynarUser } from "../hooks/useNeynarUser";

// --- Types ---
export enum Tab {
  Dashboard = "dashboard",
  Maquinas = "maquinas",
  Recolecciones = "recolecciones",
  Costos = "costos",
  Rentabilidad = "rentabilidad",
}

export interface AppProps {
  title?: string;
}

/**
 * App component serves as the main container for the mini app interface.
 * 
 * This component orchestrates the overall mini app experience by:
 * - Managing tab navigation and state
 * - Handling Farcaster mini app initialization
 * - Coordinating wallet and context state
 * - Providing error handling and loading states
 * - Rendering the appropriate tab content based on user selection
 * 
 * The component integrates with the Neynar SDK for Farcaster functionality
 * and Wagmi for wallet management. It provides a complete mini app
 * experience with multiple tabs for different functionality areas.
 * 
 * Features:
 * - Tab-based navigation (Home, Actions, Context, Wallet)
 * - Farcaster mini app integration
 * - Wallet connection management
 * - Error handling and display
 * - Loading states for async operations
 * 
 * @param props - Component props
 * @param props.title - Optional title for the mini app (defaults to "Neynar Starter Kit")
 * 
 * @example
 * ```tsx
 * <App title="My Mini App" />
 * ```
 */
export default function App(
  { title }: AppProps = { title: "Gestión de Máquinas Vending" }
) {
  // --- Hooks ---
  const {
    isSDKLoaded,
    context,
    setInitialTab,
    setActiveTab,
    currentTab,
  } = useMiniApp();

  // --- Clerk auth hook ---
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);

  // --- Neynar user hook ---
  const { user: neynarUser } = useNeynarUser(context || undefined);

  // --- Effects ---
  // Prioridad: Si hay FID de Farcaster, usarlo. Si no, usar Clerk.
  useEffect(() => {
    // Si hay FID de Farcaster, usarlo como userId (omitir login)
    if (context?.user?.fid) {
      setAuthenticatedUserId(`fid-${context.user.fid}`);
    } else if (user?.id) {
      // Si no hay FID pero hay usuario de Clerk, usar Clerk
      setAuthenticatedUserId(user.id);
    } else {
      setAuthenticatedUserId(null);
    }
  }, [context?.user?.fid, user?.id]);

  useEffect(() => {
    if (isSDKLoaded && authenticatedUserId) {
      setInitialTab(Tab.Dashboard);
    }
  }, [isSDKLoaded, authenticatedUserId, setInitialTab]);

  // Llamar a sdk.actions.ready() cuando la app esté completamente cargada
  useEffect(() => {
    if (isSDKLoaded && authenticatedUserId) {
      // Si hay FID, no necesitamos esperar a Clerk
      const shouldCallReady = context?.user?.fid 
        ? isSDKLoaded && authenticatedUserId
        : isSDKLoaded && isClerkLoaded && authenticatedUserId && user;
      
      if (shouldCallReady) {
        // La app está lista, notificar al SDK
        sdk.actions.ready().catch((error) => {
          console.error('Error calling sdk.actions.ready():', error);
        });
      }
    }
  }, [isSDKLoaded, isClerkLoaded, authenticatedUserId, user, context?.user?.fid]);

  // --- Early Returns ---
  // Si hay FID, no necesitamos esperar a Clerk
  const hasFid = !!context?.user?.fid;
  const needsClerk = !hasFid;
  
  if (!isSDKLoaded || (needsClerk && !isClerkLoaded)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner h-8 w-8 mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // Mostrar pantalla de login solo si no hay FID y no hay usuario de Clerk
  if (!authenticatedUserId) {
    // Si hay FID, no mostrar login
    if (hasFid) {
      // Esperar a que se establezca el userId
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="spinner h-8 w-8 mx-auto mb-4"></div>
            <p>Cargando...</p>
          </div>
        </div>
      );
    }
    // Si no hay FID, mostrar login de Clerk
    return <LoginScreen onLogin={(userId) => setAuthenticatedUserId(userId)} />;
  }

  // --- Render ---
  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      {/* Header should be full width */}
      <Header 
        neynarUser={neynarUser} 
        clerkUser={user}
      />

      {/* Main content and footer should be centered */}
      <div className="container py-2 pb-24">
        {/* Main title */}
        <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>

        {/* Tab content rendering */}
        {currentTab === Tab.Dashboard && <HomeTab key={`dashboard-${currentTab}`} userId={authenticatedUserId} />}
        {currentTab === Tab.Maquinas && (
          <MaquinasTab key={`maquinas-${currentTab}`} userId={authenticatedUserId} />
        )}
        {currentTab === Tab.Recolecciones && (
          <RecoleccionesTab userId={authenticatedUserId} />
        )}
        {currentTab === Tab.Costos && (
          <CostosTab userId={authenticatedUserId} />
        )}
        {currentTab === Tab.Rentabilidad && (
          <RentabilidadView userId={authenticatedUserId} />
        )}

        {/* Footer with navigation */}
        <Footer activeTab={currentTab as Tab} setActiveTab={setActiveTab} showWallet={false} />
      </div>
    </div>
  );
}

