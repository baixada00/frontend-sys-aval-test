import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, BarChart2, UserPlus, LogOut, FileEdit } from 'lucide-react'
import { useUser } from '../context/UserContext'


export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, setUser } = useUser()

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-purple-700' : ''
  }

  const handleLogout = () => {
    setUser(null)
    navigate('/login')
  }

  if (!user) return null

  return (
    <nav className="bg-purple-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex space-x-4">
            <Link
              to="/dashboard"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/dashboard')}`}
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
            {(user.type === 'gestor' || user.type === 'admin') && (
              <>
                <Link
                  to="/gestao-fuc"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/gestao-fuc')}`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Gestão FUC
                </Link>
                <Link
                  to="/gerir-template"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/gerir-template')}`}
                >
                  <FileEdit className="w-4 h-4 mr-2" />
                  Template FUC
                </Link>
              </>
            )}
            {user.type === 'admin' && (
              <>
                <Link
                  to="/relatorios"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/relatorios')}`}
                >
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Relatórios
                </Link>
                <Link
                  to="/admin/add-user"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/admin/add-user')}`}
                >
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Adicionar User
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {user.name} ({user.type})
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
