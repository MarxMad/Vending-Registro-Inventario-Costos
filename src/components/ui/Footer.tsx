"use client";

import React from "react";
import { motion } from "framer-motion";
import { Tab } from "~/components/App";
import { LayoutDashboard, Package, DollarSign, TrendingUp, Receipt } from "lucide-react";

interface FooterProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  showWallet?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: Tab.Dashboard, label: "Dashboard", icon: LayoutDashboard },
    { id: Tab.Maquinas, label: "Máquinas", icon: Package },
    { id: Tab.Recolecciones, label: "Recolecciones", icon: DollarSign },
    { id: Tab.Costos, label: "Costos", icon: Receipt },
    { id: Tab.Rentabilidad, label: "Rentabilidad", icon: TrendingUp },
  ];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #F3F4F6 100%)",
        boxShadow: "0 -4px 20px rgba(59, 130, 246, 0.15)",
        borderTop: "2px solid #3B82F6",
      }}
    >
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex justify-around items-center h-14">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center justify-center flex-1 h-full"
              >
                <Icon 
                  className={`w-6 h-6 transition-all ${
                    isActive 
                      ? 'text-blue-600 scale-110' 
                      : 'text-gray-400'
                  }`} 
                />
                <span 
                  className={`text-xs mt-1 transition-all ${
                    isActive 
                      ? 'text-blue-600 font-bold' 
                      : 'text-gray-400'
                  }`}
                >
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
