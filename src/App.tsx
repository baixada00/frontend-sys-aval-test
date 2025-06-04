import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import GestaoFUC from './components/GestaoFUC'
import AvaliacaoFUC from './components/AvaliacaoFUC'
import Relatorios from './components/Relatorios'
import AdminAddUser from './components/AdminAddUser'
import GerirTemplate from './components/GerirTemplate'
import CriarFUC from './components/CriarFUC'
import Login from './components/Login'
import { UserProvider, useUser } from './context/UserContext'
import ProtectedRoute from './components/ProtectedRoute'

function AppContent() {
  const { user } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      const redirectPath = sessionStorage.getItem('redirectPath')
      if (redirectPath && (window.location.pathname === '/login' || window.location.pathname === '/')) {
        sessionStorage.removeItem('redirectPath')
        navigate(redirectPath)
      }
    }
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard\" replace /> : <Login />} />
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route path="/gestao-fuc" element={<ProtectedRoute element={<GestaoFUC />} allowedRoles={['admin']} />} />
          <Route path="/criar-fuc" element={<ProtectedRoute element={<CriarFUC />} allowedRoles={['admin']} />} />
          <Route path="/gerir-template" element={<ProtectedRoute element={<GerirTemplate />} allowedRoles={['gestor']} />} />
          <Route path="/avaliacao-fuc/:id" element={<ProtectedRoute element={<AvaliacaoFUC />} allowedRoles={['avaliador']} />} />
          <Route path="/relatorios" element={<ProtectedRoute element={<Relatorios />} allowedRoles={['admin']} />} />
          <Route path="/admin/add-user" element={<ProtectedRoute element={<AdminAddUser />} allowedRoles={['admin']} />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  )
}

export default App