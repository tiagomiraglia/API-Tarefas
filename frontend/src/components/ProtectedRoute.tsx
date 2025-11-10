import React from 'react';
import { Navigate } from 'react-router-dom';

function isAuthenticated() {
  return localStorage.getItem('token') !== null;
}

function getNivel() {
  return localStorage.getItem('nivel') || 'user';
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  nivel?: string; // 'superuser', 'admin', 'user'
}

export default function ProtectedRoute({ children, nivel }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (nivel && getNivel() !== nivel) {
    // Se a rota exige um nível específico e o usuário não tem, redireciona
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
