import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import TestPage from './pages/TestPage'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Root from './pages/Root'
import Perfil from './pages/Perfil'
import Logout from './pages/Logout'
import Dashboard from './pages/Dashboard'
import DashboardUser from './pages/DashboardUser'
import KanbanPage from './pages/Kanban'
import KanbanConversasPage from './pages/KanbanConversas'
import GerenciarTags from './components/GerenciarTags'
import ProtectedRoute from './components/ProtectedRoute'
import Recuperacao from './pages/Recuperacao'
import RecuperacaoCodigo from './pages/RecuperacaoCodigo'
import ResetarSenhaTemporaria from './pages/ResetarSenhaTemporaria'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Rotas principais do sistema
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperacao" element={<Recuperacao />} />
  <Route path="/recuperacao-codigo" element={<RecuperacaoCodigo />} />
  <Route path="/root" element={<ProtectedRoute nivel="superuser"><Root /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardUser /></ProtectedRoute>} />
  <Route path="/dashboard-admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/admin/tags" element={<ProtectedRoute nivel="admin"><GerenciarTags /></ProtectedRoute>} />
  <Route path="/kanban-admin" element={<ProtectedRoute><KanbanPage /></ProtectedRoute>} />
  <Route path="/kanban-conversas" element={<ProtectedRoute><KanbanConversasPage /></ProtectedRoute>} />
  <Route path="/kanban" element={<ProtectedRoute><KanbanConversasPage /></ProtectedRoute>} />
  <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
  <Route path="/logout" element={<Logout />} />
  <Route path="/resetar-senha-temporaria" element={<ResetarSenhaTemporaria />} />
      </Routes>
  <ToastContainer aria-label="Notificações" />
    </BrowserRouter>
  )
}
