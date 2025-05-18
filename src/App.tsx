import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import GestaoFUC from './components/GestaoFUC'
import AvaliacaoFUC from './components/AvaliacaoFUC'
import Relatorios from './components/Relatorios'
import AddUser from './components/AdminAddUser'
import GerirTemplate from './components/GerirTemplate'
import Login from './components/Login'
import { UserProvider } from './context/UserContext'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
              <Route path="/gestao-fuc" element={<ProtectedRoute element={<GestaoFUC />} allowedRoles={['gestor', 'admin']} />} />
              <Route path="/gerir-template" element={<ProtectedRoute element={<GerirTemplate />} allowedRoles={['gestor', 'admin']} />} />
              <Route path="/avaliacao-fuc/:id" element={<ProtectedRoute element={<AvaliacaoFUC />} />} />
              <Route path="/relatorios" element={<ProtectedRoute element={<Relatorios />} allowedRoles={['admin']} />} />
              <Route path="/admin/add-user" element={<ProtectedRoute element={<AddUser />} allowedRoles={['admin']} />} />
            </Routes>
          </main>
        </div>
      </Router>
    </UserProvider>
  )
}