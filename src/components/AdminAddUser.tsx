import React, { useState, useEffect } from 'react'
import { UserPlus, ShieldAlert, Users, UserCog, FileText, Trash2, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

interface UserTypeConfig {
    icon: React.ReactNode
    label: string
}

interface User {
    id: number
    username: string
    role: string
    created_at: string
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

const AdminAddUser = () => {
    const navigate = useNavigate()
    const { user, setUser } = useUser()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'type' | 'details'>('type')
    const [selectedType, setSelectedType] = useState<string | null>(null)
    const [name, setName] = useState('')

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await fetch('https://projeto-estagio-sys-fuc-aval.onrender.com/api/users')
            if (!response.ok) throw new Error('Failed to fetch users')
            const data = await response.json()
            setUsers(data)
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleTypeSelect = (type: string) => {
        setSelectedType(type)
        setStep('details')
    }

    const handleBack = () => {
        setStep('type')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedType && name) {
            try {
                const response = await fetch('https://projeto-estagio-sys-fuc-aval.onrender.com/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: name,
                        role: selectedType
                    })
                })

                if (!response.ok) {
                    const err = await response.json()
                    throw new Error(err.error || 'Erro ao criar utilizador')
                }

                const newUser = await response.json()
                await fetchUsers()
                setName('')
                setSelectedType(null)
                setStep('type')
            } catch (error) {
                console.error('Error to criate user:', error)
                alert((error as Error).message)
            }
        }
    }

    const handleUpdateRole = async (userId: number, newRole: string) => {
        try {
            const response = await fetch(`https://projeto-estagio-sys-fuc-aval.onrender.com/api/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
            })

            if (!response.ok) throw new Error('Falha ao atualizar cargo do user')
            await fetchUsers()
        } catch (error) {
            console.error('Error updating user role:', error)
            alert('Failed to update user role')
        }
    }

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Tem a certeza que quer apagar este user?')) return

        try {
            const response = await fetch(`https://projeto-estagio-sys-fuc-aval.onrender.com/api/users/${userId}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Falha ao apagar user')
            await fetchUsers()
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('Failed to delete user')
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <UserPlus className="h-6 w-6 text-purple-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar
                    </button>
                </div>

                {/* User List */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nome de Usuário
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cargo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Criado a
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {user.username}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                            className="text-sm text-gray-900 border border-gray-300 rounded-md px-2 py-1"
                                        >
                                            <option value="admin">Administrador</option>
                                            <option value="gestor">Gestor</option>
                                            <option value="avaliador">Avaliador</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add New User Form */}
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                    <UserPlus className="h-6 w-6 text-purple-600" />
                    <h2 className="text-xl font-bold text-gray-900">
                        Adic. Novo User
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Nome de Usuário
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cargo
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                            {Object.entries(userTypes).map(([type, config]) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => handleTypeSelect(type)}
                                    className={`flex items-center gap-2 p-3 rounded-lg border ${selectedType === type
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-gray-200 hover:border-purple-500'
                                        }`}
                                >
                                    {config.icon}
                                    <span className="text-sm font-medium">{config.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-200"
                            disabled={!selectedType || !name}
                        >
                            Adicionar Usuário
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AdminAddUser