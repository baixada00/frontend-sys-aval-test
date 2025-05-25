import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, Save, AlertCircle, Plus, Trash2, Check, X } from 'lucide-react'
import axios from 'axios'
import { useUser } from '../context/UserContext'
import { API_BASE } from '../config/api'

interface Campo {
    id: string
    titulo: string
    descricao: string
    tipo: string
}

interface CampoAvaliacao {
    campo_id: string
    titulo: string
    tipo_avaliacao: ('texto' | 'escolha_multipla')[]
    opcoes?: string[]
}

interface Template {
    id: number
    nome: string
    conteudo: string
    fuc_id: number
    criado_por: number
    created_at: string
    campos_avaliacao: CampoAvaliacao[]
}

const GerirTemplate = () => {
    const { id } = useParams<{ id?: string }>()
    const navigate = useNavigate()
    const { user } = useUser()
    const [templates, setTemplates] = useState<Template[]>([])
    const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null)
    const [campos, setCampos] = useState<Campo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)

                // If no id provided, show empty state
                if (!id) {
                    setError('Selecione uma FUC para gerenciar templates')
                    setLoading(false)
                    return
                }

                const [templatesRes, fucRes] = await Promise.all([
                    axios.get(`${API_BASE}/api/templates?fuc_id=${id}`),
                    axios.get(`${API_BASE}/api/fucs/${id}`)
                ])

                setTemplates(templatesRes.data)
                if (fucRes.data.estrutura?.campos) {
                    setCampos(fucRes.data.estrutura.campos)
                }
            } catch (error) {
                console.error('Erro ao carregar dados:', error)
                setError('Não foi possível carregar os dados. Verifique se a FUC está ativa.')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id])

    const handleSave = async () => {
        if (!currentTemplate || !id) return

        try {
            setSaving(true)
            const templateData = {
                nome: currentTemplate.nome,
                conteudo: currentTemplate.conteudo,
                fuc_id: parseInt(id),
                criado_por: user?.id,
                campos_avaliacao: currentTemplate.campos_avaliacao
            }

            if (currentTemplate.id) {
                await axios.put(`${API_BASE}/api/templates/${currentTemplate.id}`, templateData)
            } else {
                await axios.post(`${API_BASE}/api/templates`, templateData)
            }

            navigate('/gestao-fuc')
        } catch (error) {
            console.error('Erro ao guardar template:', error)
            alert('Erro ao guardar template.')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (templateId: number) => {
        if (!confirm('Tem certeza que deseja excluir esta template?')) return

        try {
            await axios.delete(`${API_BASE}/api/templates/${templateId}`)
            setTemplates(prev => prev.filter(t => t.id !== templateId))
        } catch (error) {
            console.error('Erro ao excluir template:', error)
            alert('Erro ao excluir o template.')
        }
    }

    const createNewTemplate = () => {
        if (!id) return

        setCurrentTemplate({
            id: 0,
            nome: '',
            conteudo: '',
            fuc_id: parseInt(id),
            criado_por: user?.id || 0,
            created_at: new Date().toISOString(),
            campos_avaliacao: []
        })
    }

    const toggleAvaliacaoTipo = (campoId: string, tipo: 'texto' | 'escolha_multipla') => {
        if (!currentTemplate) return

        setCurrentTemplate(prev => {
            if (!prev) return prev

            const camposAtualizados = [...prev.campos_avaliacao]
            const campoIndex = camposAtualizados.findIndex(c => c.campo_id === campoId)

            if (campoIndex === -1) {
                camposAtualizados.push({
                    campo_id: campoId,
                    titulo: campos.find(c => c.id === campoId)?.titulo || '',
                    tipo_avaliacao: [tipo],
                    opcoes: tipo === 'escolha_multipla' ? ['Adequado', 'Não Adequado', 'Incerteza'] : undefined
                })
            } else {
                const tipos = camposAtualizados[campoIndex].tipo_avaliacao
                const tipoIndex = tipos.indexOf(tipo)

                if (tipoIndex === -1) {
                    tipos.push(tipo)
                } else {
                    tipos.splice(tipoIndex, 1)
                }

                if (tipos.length === 0) {
                    camposAtualizados.splice(campoIndex, 1)
                } else {
                    camposAtualizados[campoIndex] = {
                        ...camposAtualizados[campoIndex],
                        tipo_avaliacao: tipos,
                        opcoes: tipos.includes('escolha_multipla') ?
                            camposAtualizados[campoIndex].opcoes || ['Adequado', 'Não Adequado', 'Incerteza'] :
                            undefined
                    }
                }
            }

            return {
                ...prev,
                campos_avaliacao: camposAtualizados
            }
        })
    }

    const updateOpcoes = (campoId: string, opcoes: string[]) => {
        if (!currentTemplate) return

        setCurrentTemplate(prev => {
            if (!prev) return prev

            const camposAtualizados = prev.campos_avaliacao.map(campo => {
                if (campo.campo_id === campoId) {
                    return { ...campo, opcoes }
                }
                return campo
            })

            return {
                ...prev,
                campos_avaliacao: camposAtualizados
            }
        })
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
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-purple-600" />
                        <h1 className="text-2xl font-bold text-gray-900">
                            Templates da FUC
                        </h1>
                    </div>
                    {user?.type === 'gestor' && (
                        <button
                            onClick={createNewTemplate}
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Template
                        </button>
                    )}
                </div>

                {currentTemplate ? (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome da Template
                            </label>
                            <input
                                type="text"
                                value={currentTemplate.nome}
                                onChange={(e) => setCurrentTemplate(prev => ({ ...prev!, nome: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500"
                                placeholder="Escreva o nome da template..."
                            />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Campos para Avaliação</h3>
                            {campos.map((campo) => {
                                const avaliacaoConfig = currentTemplate.campos_avaliacao.find(c => c.campo_id === campo.id)
                                return (
                                    <div key={campo.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                        <h4 className="font-medium text-gray-800">{campo.titulo}</h4>
                                        <p className="text-sm text-gray-600">{campo.descricao}</p>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => toggleAvaliacaoTipo(campo.id, 'texto')}
                                                className={`flex items-center px-3 py-2 rounded-md ${avaliacaoConfig?.tipo_avaliacao.includes('texto')
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {avaliacaoConfig?.tipo_avaliacao.includes('texto') ? (
                                                    <Check className="w-4 h-4 mr-2" />
                                                ) : (
                                                    <X className="w-4 h-4 mr-2" />
                                                )}
                                                Texto Livre
                                            </button>

                                            <button
                                                onClick={() => toggleAvaliacaoTipo(campo.id, 'escolha_multipla')}
                                                className={`flex items-center px-3 py-2 rounded-md ${avaliacaoConfig?.tipo_avaliacao.includes('escolha_multipla')
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {avaliacaoConfig?.tipo_avaliacao.includes('escolha_multipla') ? (
                                                    <Check className="w-4 h-4 mr-2" />
                                                ) : (
                                                    <X className="w-4 h-4 mr-2" />
                                                )}
                                                Escolha Múltipla
                                            </button>
                                        </div>

                                        {avaliacaoConfig?.tipo_avaliacao.includes('escolha_multipla') && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Opções de Escolha
                                                </label>
                                                <div className="flex gap-2 flex-wrap">
                                                    {avaliacaoConfig.opcoes?.map((opcao, index) => (
                                                        <input
                                                            key={index}
                                                            type="text"
                                                            value={opcao}
                                                            onChange={(e) => {
                                                                const novasOpcoes = [...(avaliacaoConfig.opcoes || [])]
                                                                novasOpcoes[index] = e.target.value
                                                                updateOpcoes(campo.id, novasOpcoes)
                                                            }}
                                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                                                        />
                                                    ))}
                                                    <button
                                                        onClick={() => {
                                                            const novasOpcoes = [...(avaliacaoConfig.opcoes || []), '']
                                                            updateOpcoes(campo.id, novasOpcoes)
                                                        }}
                                                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-sm"
                                                    >
                                                        + Adicionar Opção
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setCurrentTemplate(null)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? 'A guardar...' : 'Guardar Template'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {templates.length === 0 ? (
                            <p className="text-center text-gray-600 py-8">Nenhum template disponível.</p>
                        ) : (
                            templates.map(template => (
                                <div
                                    key={template.id}
                                    className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100"
                                >
                                    <div>
                                        <h3 className="text-lg font-medium text-purple-900">{template.nome}</h3>
                                        <p className="text-sm text-gray-600">
                                            Criada em: {new Date(template.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentTemplate(template)}
                                            className="px-4 py-2 text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50"
                                        >
                                            Editar
                                        </button>
                                        {user?.type === 'gestor' && (
                                            <button
                                                onClick={() => handleDelete(template.id)}
                                                className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default GerirTemplate