import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { FileText, CheckCircle, Save, RefreshCw, AlertCircle } from 'lucide-react'
import { useUser } from '../context/UserContext'


//TODO: METEr as paginas em algo do genero do comentario a seguir para a persistencia de dados e correta comunicaçao com o "service holder"
/* 
const API_BASE = 'https://projeto-estagio-sys-fuc-aval.onrender.com';
axios.get(`${API_BASE}/api/fucs/files/unloaded`)
*/

interface Template {
    id: number
    nome: string
    fuc_id: number
}

interface FUC {
    id: string
    nome: string
    submetidos: number
    gravados: number
    link: string
    enabled: boolean
    templates?: Template[]
}

interface DashboardData {
    fucs: FUC[]
}

const Dashboard = () => {
    const { user } = useUser()
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedFUC, setSelectedFUC] = useState<FUC | null>(null)
    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await axios.get("/api/dashboard")

            const rawFucs: FUC[] = Array.isArray(response.data.fucs) ? response.data.fucs : []

            if (user?.type === 'avaliador') {
                const fucsWithTemplates = await Promise.all(
                    rawFucs
                        .filter((fuc: FUC) => fuc.enabled)
                        .map(async (fuc: FUC) => {
                            try {
                                const templatesResponse = await axios.get(`/api/templates?fuc_id=${fuc.id}`)
                                return {
                                    ...fuc,
                                    templates: templatesResponse.data
                                }
                            } catch (err) {
                                console.warn(`Erro ao buscar templates da FUC ${fuc.id}`, err)
                                return { ...fuc, templates: [] }
                            }
                        })
                )
                setDashboardData({ fucs: fucsWithTemplates })
            } else {
                setDashboardData({ fucs: rawFucs })
            }
        } catch (error) {
            console.error('Erro ao pesquisar dados para dashboard:', error)
            setError('Erro ao carregar dados. Por favor, tente novamente.')
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        fetchDashboardData()
    }, [user])

    const handleTemplateSelect = (template: Template) => {
        setSelectedTemplate(template.id)
        window.location.href = `/avaliacao-fuc/${selectedFUC?.id}?template=${template.id}`
    }

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
                <h1 className="text-2xl font-bold text-purple-900 mb-2">Sistema de Avaliação de FUCs</h1>
                <p className="text-gray-600">Bem-vindo ao sistema de avaliação de Fichas de Unidade Curricular.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">FUCs Disponíveis</h2>

                    {!Array.isArray(dashboardData?.fucs) || dashboardData.fucs.length === 0 ? (
                        <p className="text-gray-600 text-center py-8">Nenhuma FUC disponível de momento.</p>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {dashboardData.fucs.map(fuc => (
                                <div key={fuc.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">{fuc.nome}</h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                                    <span>Relatórios Submetidos: {fuc.submetidos}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <FileText className="w-6 h-6 text-purple-600" />
                                    </div>

                                    <div className="mt-4">
                                        {user?.type === 'avaliador' ? (
                                            fuc.templates && fuc.templates.length > 0 ? (
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Selecione uma template:
                                                    </label>
                                                    <select
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500"
                                                        onChange={(e) => handleTemplateSelect(fuc.templates![parseInt(e.target.value)])}
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>Escolha uma template</option>
                                                        {fuc.templates.map((template, index) => (
                                                            <option key={template.id} value={index}>
                                                                {template.nome}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">Nenhuma template disponível</p>
                                            )
                                        ) : (
                                            <Link
                                                to={fuc.link}
                                                className="inline-flex items-center justify-center w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                                            >
                                                Ver Detalhes
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Dashboard