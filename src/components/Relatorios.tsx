import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { FileText, Filter, RefreshCw, AlertCircle, User, Clock, Eye, Trash2 } from 'lucide-react'
import { API_BASE } from '../config/api'

interface Relatorio {
    id: number
    fuc_id: number
    fuc_titulo?: string
    avaliador: string
    status: string
    data: string
    comentario: string
    respostas?: any
}

const Relatorios = () => {
    const { fucId } = useParams<{ fucId: string }>()
    const [relatorios, setRelatorios] = useState<Relatorio[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedRelatorio, setSelectedRelatorio] = useState<Relatorio | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [filtros, setFiltros] = useState({
        avaliador: '',
        status: 'Todos',
        fuc: 'Todas'
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

    const handleDeleteRelatorio = async (relatorioId: number) => {
        if (!confirm('Tem certeza que deseja excluir este relatório?')) return

        try {
            await axios.delete(`${API_BASE}/api/relatorios/${relatorioId}`)
            setRelatorios(prev => prev.filter(r => r.id !== relatorioId))
            alert('Relatório excluído com sucesso!')
        } catch (error) {
            console.error('Erro ao excluir relatório:', error)
            alert('Erro ao excluir relatório')
        }
    }

    const handleViewDetails = (relatorio: Relatorio) => {
        setSelectedRelatorio(relatorio)
        setShowModal(true)
    }

    useEffect(() => {
        fetchRelatorios()
    }, [])

    const filtrarRelatorios = () => {
        if (!Array.isArray(relatorios)) return []

        return relatorios.filter(relatorio => {
            const matchAvaliador = relatorio.avaliador.toLowerCase().includes(filtros.avaliador.toLowerCase())
            const matchStatus = filtros.status === 'Todos' || relatorio.status === filtros.status.toLowerCase()
            const matchFuc = filtros.fuc === 'Todas' || (relatorio.fuc_titulo && relatorio.fuc_titulo.toLowerCase().includes(filtros.fuc.toLowerCase()))
            return matchAvaliador && matchStatus && matchFuc
        })
    }

    const handleFiltroChange = (campo: string, valor: string) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }))
    }

    const getUniqueValues = (field: keyof Relatorio) => {
        return [...new Set(relatorios.map(r => r[field]).filter(Boolean))]
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

                {/* Enhanced Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                            <option value="gravado">Rascunho</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            FUC
                        </label>
                        <select
                            value={filtros.fuc}
                            onChange={(e) => handleFiltroChange('fuc', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="Todas">Todas</option>
                            {getUniqueValues('fuc_titulo').map((titulo) => (
                                <option key={titulo} value={titulo as string}>
                                    {titulo}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {relatoriosFiltrados.length}
                        </div>
                        <div className="text-sm text-gray-600">Total de Relatórios</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {relatoriosFiltrados.filter(r => r.status === 'submetido').length}
                        </div>
                        <div className="text-sm text-gray-600">Submetidos</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                            {relatoriosFiltrados.filter(r => r.status === 'gravado').length}
                        </div>
                        <div className="text-sm text-gray-600">Rascunhos</div>
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
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium text-gray-900">{relatorio.avaliador}</span>
                                            </div>
                                            {relatorio.fuc_titulo && (
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-600">{relatorio.fuc_titulo}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">
                                                {new Date(relatorio.data).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${relatorio.status === 'submetido'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}
                                        >
                                            {relatorio.status === 'submetido' ? 'Submetido' : 'Rascunho'}
                                        </span>
                                        <button
                                            onClick={() => handleViewDetails(relatorio)}
                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-md"
                                            title="Ver detalhes"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRelatorio(relatorio.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                                            title="Excluir relatório"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
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

            {/* Modal for viewing details */}
            {showModal && selectedRelatorio && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                Detalhes do Relatório - {selectedRelatorio.avaliador}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <strong>Status:</strong> {selectedRelatorio.status === 'submetido' ? 'Submetido' : 'Rascunho'}
                                </div>
                                <div>
                                    <strong>Data:</strong> {new Date(selectedRelatorio.data).toLocaleDateString()}
                                </div>
                            </div>
                            
                            {selectedRelatorio.respostas && (
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">Respostas:</h3>
                                    <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-x-auto">
                                        {JSON.stringify(selectedRelatorio.respostas, null, 2)}
                                    </pre>
                                </div>
                            )}
                            
                            {selectedRelatorio.comentario && (
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">Comentário:</h3>
                                    <p className="bg-gray-50 p-4 rounded-md text-sm">
                                        {selectedRelatorio.comentario}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Relatorios