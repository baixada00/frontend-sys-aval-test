import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { FileText, RefreshCw, AlertCircle, Calendar, Plus, Upload } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { API_BASE } from '../config/api'

interface FUC {
    id: number
    titulo: string
    descricao: string
    enabled: boolean
    created_at: string
    templates_count?: number
}

const GestaoFUC = () => {
    const { user } = useUser()
    const [fucs, setFucs] = useState<FUC[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchFUCs = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await axios.get(`${API_BASE}/api/fucs`)
            // For gestor, only show enabled FUCs
            const filteredFucs = user?.activeRole === 'gestor' 
                ? response.data.filter((fuc: FUC) => fuc.enabled)
                : response.data
            setFucs(Array.isArray(filteredFucs) ? filteredFucs : [])
        } catch (error) {
            console.error("Erro ao procurar FUCs", error)
            setError('Erro ao carregar FUCs. Por favor, tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFUCs()
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
                            onClick={fetchFUCs}
                            className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Atualizar Lista
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    {user?.activeRole === 'admin' ? 'FUCs Carregadas' : 'FUCs para Criação de Templates'}
                </h2>
                {!Array.isArray(fucs) || fucs.length === 0 ? (
                    <p className="text-center text-gray-600 py-8">Nenhuma FUC disponível no momento.</p>
                ) : (
                    <div className="space-y-4">
                        {fucs.map(fuc => (
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
                                        <div className="mt-2 text-sm text-gray-600">
                                            Templates: {fuc.templates_count || 0}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {user?.activeRole === 'admin' ? (
                                        <button
                                            onClick={() => {
                                                // Toggle FUC status logic here
                                            }}
                                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                                                fuc.enabled
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {fuc.enabled ? 'Ativa' : 'Inativa'}
                                        </button>
                                    ) : null}
                                    <Link
                                        to={`/gerir-template/${fuc.id}`}
                                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        {fuc.templates_count ? 'Ver Templates' : 'Criar Template'}
                                    </Link>
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