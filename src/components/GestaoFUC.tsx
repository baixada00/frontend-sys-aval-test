import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { FileText, RefreshCw, AlertCircle, Calendar, ToggleLeft as Toggle, Plus, Upload } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { API_BASE } from '../config/api'

interface FUC {
    id: number
    titulo: string
    descricao: string
    enabled: boolean
    created_at: string
}

const GestaoFUC = () => {
    const { user } = useUser()
    const [fucs, setFucs] = useState<FUC[]>([])
    const [unloadedFucs, setUnloadedFucs] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchFUCs = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await axios.get(`${API_BASE}/api/fucs`)
            setFucs(Array.isArray(response.data) ? response.data : [])
        } catch (error) {
            console.error("Erro ao procurar FUCs", error)
            setError('Erro ao carregar FUCs. Por favor, tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    const fetchUnloadedFUCs = async () => {
        try {
            const response = await axios.get(`${API_BASE}/api/fucs/files/unloaded`)
            setUnloadedFucs(Array.isArray(response.data) ? response.data : [])
        } catch (error) {
            console.error('Erro ao buscar FUCs não carregadas:', error)
            setError('Erro ao carregar lista de FUCs disponíveis.')
        }
    }

    const handleLoadFUC = async (filename: string) => {
        try {
            await axios.post(`${API_BASE}/api/fucs/from-file`, { filename })
            await fetchFUCs()
            await fetchUnloadedFucs()
        } catch (error) {
            console.error('Erro ao carregar FUC:', error)
            alert('Erro ao carregar a FUC')
        }
    }

    const toggleFUCStatus = async (fucId: number, currentStatus: boolean) => {
        try {
            await axios.patch(`${API_BASE}/api/fucs/${fucId}`, { enabled: !currentStatus })
            setFucs(prevFucs =>
                prevFucs.map(fuc =>
                    fuc.id === fucId ? { ...fuc, enabled: !currentStatus } : fuc
                )
            )
        } catch (error) {
            console.error("Erro ao atualizar status da FUC", error)
            alert("Erro ao atualizar o status da FUC")
        }
    }

    useEffect(() => {
        fetchFUCs()
        // Only admin can see unloaded FUCs
        if (user?.activeRole === 'admin') {
            fetchUnloadedFucs()
        }
    }, [user])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <p className="ml-3 text-red-700">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-purple-900">
                        {user?.activeRole === 'admin' ? 'Gestão de FUCs' : 'FUCs Disponíveis'}
                    </h1>
                    <div className="flex gap-4">
                        {/* Only admin can create new FUCs */}
                        {user?.activeRole === 'admin' && (
                            <Link
                                to="/criar-fuc"
                                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Criar Nova FUC
                            </Link>
                        )}
                        <button
                            onClick={() => {
                                fetchFUCs();
                                if (user?.activeRole === 'admin') fetchUnloadedFucs();
                            }}
                            className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Atualizar Lista
                        </button>
                    </div>
                </div>

                {/* Only admin can see and load unloaded FUCs */}
                {user?.activeRole === 'admin' && unloadedFucs.length > 0 && (
                    <div className="mt-6 bg-gray-50 rounded-lg p-4">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">FUCs Disponíveis para Carregar</h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {unloadedFucs.map(filename => (
                                <div key={filename} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">{filename}</span>
                                        <button
                                            onClick={() => handleLoadFUC(filename)}
                                            className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Carregar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    {user?.activeRole === 'admin' ? 'FUCs Carregadas' : 'FUCs Habilitadas'}
                </h2>
                {!Array.isArray(fucs) || fucs.length === 0 ? (
                    <p className="text-center text-gray-600 py-8">Nenhuma FUC disponível no momento.</p>
                ) : (
                    <div className="space-y-4">
                        {fucs
                            .filter(fuc => user?.activeRole === 'admin' || fuc.enabled) // Gestor only sees enabled FUCs
                            .map(fuc => (
                            <div
                                key={fuc.id}
                                className="flex items-center justify-between bg-purple-50 p-4 rounded-lg border border-purple-100"
                            >
                                <div className="flex items-center space-x-4">
                                    <FileText className="w-6 h-6 text-purple-600" />
                                    <div>
                                        <h3 className="text-lg font-medium text-purple-900">{fuc.titulo}</h3>
                                        <div className="flex items-center text-sm text-purple-600">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            <span>Criado em: {new Date(fuc.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {fuc.descricao && (
                                            <p className="text-sm text-gray-600 mt-1">{fuc.descricao}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* Only admin can toggle FUC status */}
                                    {user?.activeRole === 'admin' && (
                                        <button
                                            onClick={() => toggleFUCStatus(fuc.id, fuc.enabled)}
                                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                                                fuc.enabled
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            <Toggle className="w-4 h-4 mr-2" />
                                            {fuc.enabled ? 'Ativa' : 'Inativa'}
                                        </button>
                                    )}
                                    
                                    {/* Admin can view templates, but cannot manage them */}
                                    {user?.activeRole === 'admin' && (
                                        <Link
                                            to={`/gerir-template/${fuc.id}`}
                                            className={`inline-flex items-center px-4 py-2 rounded-md ${
                                                fuc.enabled
                                                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                            }`}
                                            onClick={(e) => !fuc.enabled && e.preventDefault()}
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            Ver Templates
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default GestaoFUC