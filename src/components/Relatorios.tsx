import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { FileText, Filter, RefreshCw, AlertCircle, User, Clock } from 'lucide-react'
import { API_BASE } from '../config/api'

interface Relatorio {
    fuc: string
    avaliador: string
    status: string
    data: string
    comentario: string
}

const Relatorios = () => {
    const [relatorios, setRelatorios] = useState<Relatorio[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filtros, setFiltros] = useState({
        avaliador: '',
        status: 'Todos',
        nomeFuc: ''
    })

    const fetchRelatorios = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await axios.get(`${API_BASE}/api/relatorios`)
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
            const matchFuc = relatorio.fuc.toLowerCase().includes(filtros.nomeFuc.toLowerCase())
            return matchAvaliador && matchStatus && matchFuc
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
                        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
                    </div>
                    <button
                        onClick={fetchRelatorios}
                        className="flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar
                    </button>
                </div>

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
                            <option value="gravado">Gravado</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome FUC
                        </label>
                        <input
                            type="text"
                            value={filtros.nomeFuc}
                            onChange={(e) => handleFiltroChange('nomeFuc', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Filtrar por nome da FUC..."
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    FUC
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Avaliador
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Data
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Comentário
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!Array.isArray(relatoriosFiltrados) || relatoriosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Nenhum relatório encontrado com os filtros selecionados.
                                    </td>
                                </tr>
                            ) : (
                                relatoriosFiltrados.map((relatorio, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {relatorio.fuc}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center">
                                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                                {relatorio.avaliador}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${relatorio.status === 'submetido'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {relatorio.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center">
                                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                                {new Date(relatorio.data).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                                            {relatorio.comentario}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default Relatorios