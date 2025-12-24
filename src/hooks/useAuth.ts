"use client";

import { useState, useEffect } from "react";

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si hay un token guardado
    const token = localStorage.getItem("auth_token");
    const storedUserId = localStorage.getItem("user_id");
    const storedUserName = localStorage.getItem("user_name");

    if (token && storedUserId) {
      // Verificar que el token sea válido
      verifyToken(token).then((isValid) => {
        if (isValid) {
          setUserId(storedUserId);
          setUserName(storedUserName);
        } else {
          // Token inválido, limpiar
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_id");
          localStorage.removeItem("user_name");
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    setUserId(null);
    setUserName(null);
  };

  return { userId, userName, loading, logout };
}

