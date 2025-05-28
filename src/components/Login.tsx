import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCheck, ShieldAlert, Users, UserCog, FileText } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { API_BASE } from '../config/api'

interface UserTypeConfig {
    icon: React.ReactNode
    label: string
}

const userTypes: Record<string, UserTypeConfig> = {
    avaliador: {
        icon: <FileText className="h-6 w-6" />,
        label: 'Avaliador'
    },
    gestor: {
        icon: <UserCog className="h-6 w-6" />,
        label: 'Gestor'
    },
    admin: {
        icon: <ShieldAlert className="h-6 w-6" />,
        label: 'Administrator'
    }
}

const Login = () => {
    const navigate = useNavigate()
    const { setUser } = useUser()
    const [selectedRole, setSelectedRole] = useState<string | null>(null)
    const [username, setUsername] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [availableRoles, setAvailableRoles] = useState<string[]>([])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedRole || !username) return

        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_BASE}/api/users/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username
                })
            })

            if (!response.ok) {
                throw new Error('Nome de usuário invalido')
            }

            const userData = await response.json()
            
            // Now userData.roles contains all roles for the user
            setUser({
                id: userData.id,
                name: userData.username,
                roles: userData.roles,
                activeRole: selectedRole as 'admin' | 'gestor' | 'avaliador',
                username: userData.username
            })

            navigate('/dashboard')
        } catch (err) {
            setError('Usuário não encontrado')
        } finally {
            setLoading(false)
        }
    }

    const handleUsernameCheck = async (username: string) => {
        if (!username) return
        
        try {
            const response = await fetch(`${API_BASE}/api/users/roles/${username}`)
            if (response.ok) {
                const data = await response.json()
                setAvailableRoles(data.roles)
                setError(null)
            } else {
                setAvailableRoles([])
                setError('Usuário não encontrado')
            }
        } catch (err) {
            setAvailableRoles([])
            setError('Erro ao verificar usuário')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-xl p-8">
                    <div className="flex items-center justify-center mb-8">
                        <UserCheck className="h-12 w-12 text-purple-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
                        Bem-vindo
                    </h1>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                Nome de Usuário
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value)
                                    handleUsernameCheck(e.target.value)
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Digite o seu nome de usuário"
                            />
                        </div>

                        {availableRoles.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Selecione seu Cargo
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {availableRoles.map((role) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setSelectedRole(role)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all ${
                                                selectedRole === role
                                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                    : 'border-gray-200 hover:border-purple-300 text-gray-600 hover:text-purple-600'
                                            }`}
                                        >
                                            {userTypes[role].icon}
                                            <span className="mt-2 text-xs font-medium">{userTypes[role].label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!selectedRole || !username || loading || availableRoles.length === 0}
                            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'A entrar...' : 'Entrar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}