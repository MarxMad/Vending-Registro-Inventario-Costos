"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SignIn, SignUp } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";

interface LoginScreenProps {
  onLogin: (userId: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, isLoaded } = useUser();

  // Si el usuario ya está autenticado, llamar onLogin
  if (isLoaded && user) {
    onLogin(user.id);
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 50%, #E5E7EB 100%)",
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="rounded-3xl p-6 bg-white shadow-2xl border-4 border-blue-500">
            <img 
              src="/VendingLogo3D.png" 
              alt="Vending Logo" 
              className="w-32 h-32 object-contain"
            />
          </div>
        </motion.div>

        {/* Formulario */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-8 shadow-xl border-2 border-blue-200 bg-white"
          style={{
            boxShadow: "0 10px 40px rgba(59, 130, 246, 0.15)",
          }}
        >
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isSignUp ? "Crear Cuenta" : "Iniciar Sesión"}
            </h1>
            <p className="text-gray-600">
              {isSignUp 
                ? "Regístrate para gestionar tus máquinas vending" 
                : "Bienvenido de vuelta"}
            </p>
          </div>

          <div className="flex justify-center">
            {isSignUp ? (
              <SignUp 
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: "mx-auto",
                    card: "shadow-none border-0 bg-transparent",
                  },
                }}
                afterSignUpUrl="/"
                afterSignInUrl="/"
              />
            ) : (
              <SignIn 
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: "mx-auto",
                    card: "shadow-none border-0 bg-transparent",
                  },
                }}
                afterSignInUrl="/"
              />
            )}
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              {isSignUp 
                ? "¿Ya tienes cuenta? Inicia sesión" 
                : "¿No tienes cuenta? Regístrate"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

