import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, BarChart2, UserPlus, LogOut, UserCog, RefreshCw } from 'lucide-react'
import { useUser } from '../context/UserContext'

const roleLabels = {
  admin: 'Administrador',
  gestor: 'Gestor',
  avaliador: 'Avaliador'
}

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, setUser, setActiveRole } = useUser()

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-purple-700' : ''
  }

  const handleLogout = () => {
    setUser(null)
    navigate('/login')
  }

  const handleRoleChange = (role: 'admin' | 'gestor' | 'avaliador') => {
    setActiveRole(role)
    navigate('/dashboard')
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
            {(user.activeRole === 'gestor' || user.activeRole === 'admin') && (
              <>
                <Link
                  to="/gestao-fuc"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/gestao-fuc')}`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Gestão FUC
                </Link>
              </>
            )}
            {user.activeRole === 'admin' && (
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
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar User
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700">
                <UserCog className="w-4 h-4" />
                {user.name} ({roleLabels[user.activeRole]})
                <RefreshCw className="w-4 h-4" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-50">
                {user.roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      role === user.activeRole 
                        ? 'bg-purple-50 text-purple-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Mudar para {roleLabels[role]}
                  </button>
                ))}
              </div>
            </div>
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