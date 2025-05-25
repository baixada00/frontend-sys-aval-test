import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { FileText, Filter, RefreshCw, AlertCircle, User, Clock } from 'lucide-react'
import { API_BASE } from '../config/api'

interface Relatorio {
    id: number
    fuc_id: number
    avaliador: string
    status: string
    data: string
    comentario: string
}

const Relatorios = () => {
    const { fucId } = useParams<{ fucId: string }>()
    const [relatorios, setRelatorios] = useState<Relatorio[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filtros, setFiltros] = useState({
        avaliador: '',
        status: 'Todos'
    })

    const fetchRelatorios = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await axios.get(`${API_BASE}/api/relatorios${fucId ? `/${fucId}` : ''}`)
            setRelatorios(Array.isArray(response.data) ? response.data : [])
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error)
            setError('Não foi possível carregar os relatórios. Por favor, tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRelatorios()
    }, [])

    const filtrarRelatorios = () => {
        if (!Array.isArray(relatorios)) return []

        return relatorios.filter(relatorio => {
            const matchAvaliador = relatorio.avaliador.toLowerCase().includes(filtros.avaliador.toLowerCase())
            const matchStatus = filtros.status === 'Todos' || relatorio.status === filtros.status.toLowerCase()
            return matchAvaliador && matchStatus
        })
    }

    const handleFiltroChange = (campo: string, valor: string) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }))
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
                <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    const relatoriosFiltrados = filtrarRelatorios()

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-purple-600" />
                        <h1 className="text-2xl font-bold text-gray-900">
                            {fucId ? 'Relatórios da FUC' : 'Todos os Relatórios'}
                        </h1>
                    </div>
                    <button
                        onClick={fetchRelatorios}
                        className="flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Avaliador
                        </label>
                        <input
                            type="text"
                            value={filtros.avaliador}
                            onChange={(e) => handleFiltroChange('avaliador', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Filtrar por avaliador..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={filtros.status}
                            onChange={(e) => handleFiltroChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="Todos">Todos</option>
                            <option value="submetido">Submetido</option>
                            <option value="gravado">Gravado</option>
                        </select>
                    </div>
                </div>

                {relatoriosFiltrados.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Nenhum relatório encontrado.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {relatoriosFiltrados.map((relatorio) => (
                            <div
                                key={relatorio.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium text-gray-900">{relatorio.avaliador}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">
                                                {new Date(relatorio.data).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${relatorio.status === 'submetido'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                    >
                                        {relatorio.status === 'submetido' ? 'Submetido' : 'Rascunho'}
                                    </span>
                                </div>
                                {relatorio.comentario && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {relatorio.comentario}

                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Relatorios

