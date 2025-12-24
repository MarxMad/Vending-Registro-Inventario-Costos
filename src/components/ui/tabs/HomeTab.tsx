"use client";

import { Dashboard } from "~/components/vending/Dashboard";

interface HomeTabProps {
  userId: string;
}

/**
 * HomeTab component displays the main landing content for the mini app.
 * 
 * This is the default tab that users see when they first open the mini app.
 * It provides a simple welcome message and placeholder content that can be
 * customized for specific use cases.
 * 
 * @example
 * ```tsx
 * <HomeTab userId="user-123" />
 * ```
 */
export function HomeTab({ userId }: HomeTabProps) {
  return <Dashboard userId={userId} />;
} 