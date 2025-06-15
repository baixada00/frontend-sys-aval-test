import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FileText, CheckCircle, RefreshCw, AlertCircle, Settings, Play, Eye } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { API_BASE } from '../config/api'

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

interface DraftEvaluation {
  id: number
  fuc_id: number
  template_id: number
  template_nome: string
  fuc_nome: string
  created_at: string
}

const Dashboard = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [draftEvaluations, setDraftEvaluations] = useState<DraftEvaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Vai buscar os dados da dashboard ao servidor
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${API_BASE}/api/dashboard`)

      const rawFucs: FUC[] = Array.isArray(response.data.fucs) ? response.data.fucs : []

      if (user?.activeRole === 'avaliador') {
        // Avaliador: Só vê FUCs ativas com templates
        const fucsWithTemplates = await Promise.all(
          rawFucs
            .filter((fuc: FUC) => fuc.enabled)
            .map(async (fuc: FUC) => {
              try {
                const templatesResponse = await axios.get(`${API_BASE}/api/templates?fuc_id=${fuc.id}`)
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

        // Fetch draft evaluations for avaliador
        await fetchDraftEvaluations()
      } else if (user?.activeRole === 'gestor') {
        // Gestor: Só vê FUCs ativas para gestão de templates
        const enabledFucs = rawFucs.filter((fuc: FUC) => fuc.enabled)
        setDashboardData({ fucs: enabledFucs })
      } else {
        // Admin: Vê todas as FUCs
        setDashboardData({ fucs: rawFucs })
      }
    } catch (error) {
      console.error('Erro ao pesquisar dados para dashboard:', error)
      setError('Erro ao carregar dados. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const fetchDraftEvaluations = async () => {
    if (!user || user.activeRole !== 'avaliador') return

    try {
      const response = await axios.get(`${API_BASE}/api/avaliacoes/rascunhos/${user.id}`)
      setDraftEvaluations(response.data)
    } catch (error) {
      console.error('Erro ao buscar rascunhos:', error)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  // Navega para a página de avaliação com o ID da template
  const handleTemplateSelect = (templateId: number, fucId: string) => {
    navigate(`/avaliacao-fuc/${fucId}?template=${templateId}`)
  }

  const handleContinueDraft = (draft: DraftEvaluation) => {
    navigate(`/avaliacao-fuc/${draft.fuc_id}?template=${draft.template_id}&draft=${draft.id}`)
  }

  const handleViewFUCContent = (fucId: string) => {
    navigate(`/fuc-content/${fucId}`)
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-purple-900 mb-2">Sistema de Avaliação de FUCs</h1>
            <p className="text-gray-600">
              {user?.activeRole === 'admin' && 'Gerencie FUCs, utilizadores e visualize relatórios.'}
              {user?.activeRole === 'gestor' && 'Gerencie templates para FUCs habilitadas.'}
              {user?.activeRole === 'avaliador' && 'Avalie FUCs usando os templates disponíveis.'}
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Draft Evaluations Section for Avaliador */}
      {user?.activeRole === 'avaliador' && draftEvaluations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Rascunhos de Avaliação</h2>
            <div className="space-y-3">
              {draftEvaluations.map(draft => (
                <div key={draft.id} className="flex items-center justify-between bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div>
                    <h3 className="font-medium text-gray-900">{draft.fuc_nome}</h3>
                    <p className="text-sm text-gray-600">Template: {draft.template_nome}</p>
                    <p className="text-xs text-gray-500">
                      Gravado em: {new Date(draft.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleContinueDraft(draft)}
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Continuar Avaliação
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {user?.activeRole === 'admin' && 'Todas as FUCs'}
            {user?.activeRole === 'gestor' && 'FUCs Habilitadas'}
            {user?.activeRole === 'avaliador' && 'FUCs Disponíveis para Avaliação'}
          </h2>

          {!Array.isArray(dashboardData?.fucs) || dashboardData.fucs.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              {user?.activeRole === 'avaliador'
                ? 'Nenhuma FUC com templates disponível para avaliação.'
                : 'Nenhuma FUC disponível de momento.'
              }
            </p>
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
                        {!fuc.enabled && user?.activeRole === 'admin' && (
                          <div className="flex items-center text-sm text-red-600">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            <span>FUC Desabilitada</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>

                  <div className="mt-4 space-y-2">
                    {user?.activeRole === 'avaliador' ? (
                      fuc.templates && fuc.templates.length > 0 ? (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Selecione uma template:
                          </label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500"
                            onChange={(e) => {
                              const templateId = parseInt(e.target.value)
                              if (templateId) {
                                handleTemplateSelect(templateId, fuc.id)
                              }
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>Escolha uma template</option>
                            {fuc.templates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Nenhuma template disponível</p>
                      )
                    ) : user?.activeRole === 'gestor' ? (
                      <Link
                        to={`/gerir-template/${fuc.id}`}
                        className="inline-flex items-center justify-center w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Gerir Templates
                      </Link>
                    ) : (
                      <div className="space-y-2">
                        <Link
                          to={`/gestao-fuc`}
                          className="inline-flex items-center justify-center w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                          Ver Detalhes
                        </Link>
                        <button
                          onClick={() => handleViewFUCContent(fuc.id)}
                          className="inline-flex items-center justify-center w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Conteúdo
                        </button>
                      </div>
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