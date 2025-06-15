import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, Save, AlertCircle, Plus, Trash2, Check, X, Star, ArrowUp, ArrowDown, Edit3 } from 'lucide-react'
import axios from 'axios'
import { useUser } from '../context/UserContext'
import { API_BASE } from '../config/api'

interface FUC {
    id: number
    titulo: string
    enabled: boolean
    conteudo: string
}

interface Campo {
    id: string
    titulo: string
    descricao: string
    tipo: string
    originalIndex?: string
    displayIndex?: string
}

interface CampoAvaliacao {
    campo_id: string
    titulo: string
    tipo_avaliacao: ('texto' | 'escolha_multipla')[]
    opcoes?: string[]
    display_index?: string
    ordem?: number
}

interface Template {
    id: number
    nome: string
    conteudo: {
        campos_avaliacao: CampoAvaliacao[]
        descricao?: string
    }
    fuc_id: number
    criado_por: number
    created_at: string
}

const GerirTemplate = () => {
    const { id } = useParams<{ id?: string }>()
    const navigate = useNavigate()
    const { user } = useUser()
    const [fucs, setFucs] = useState<FUC[]>([])
    const [selectedFucId, setSelectedFucId] = useState<number | null>(id ? parseInt(id) : null)
    const [templates, setTemplates] = useState<Template[]>([])
    const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null)
    const [campos, setCampos] = useState<Campo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [editingIndex, setEditingIndex] = useState<string | null>(null)

    // Parser de conteúdo da FUC melhorado com melhor gestão de índices
    const parseFucContent = (content: string): Campo[] => {
        if (!content) return []

        const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
        const campos: Campo[] = []
        let currentCampo: Partial<Campo> = {}
        let descriptionLines: string[] = []
        let campoCounter = 1

        // Padrões regex melhorados para melhor deteção de secções
        const mainSectionRegex = /^(\d+)\.\s*(.+)/
        const subSectionRegex = /^(\d+\.\d+)\.\s*(.+)/
        const deepSubSectionRegex = /^(\d+\.\d+\.\d+)\.\s*(.+)/

        const processCurrentCampo = () => {
            if (currentCampo.titulo && descriptionLines.length > 0) {
                const cleanDescription = descriptionLines.join('\n').trim()

                // Só adiciona se houver conteúdo relevante
                if (cleanDescription.length > 0) {
                    campos.push({
                        id: `campo_${campoCounter}`,
                        titulo: currentCampo.titulo,
                        descricao: cleanDescription,
                        tipo: currentCampo.tipo || 'campo',
                        originalIndex: currentCampo.originalIndex,
                        displayIndex: currentCampo.displayIndex
                    })
                    campoCounter++
                }
            }
        }

        lines.forEach((line) => {
            // Verifica primeiro subsecção profunda (mais específica)
            const deepSubMatch = deepSubSectionRegex.exec(line)
            if (deepSubMatch) {
                processCurrentCampo()
                currentCampo = {
                    titulo: deepSubMatch[2].trim(),
                    tipo: 'subcampo',
                    originalIndex: deepSubMatch[1],
                    displayIndex: deepSubMatch[1]
                }
                descriptionLines = []
                return
            }

            // Verifica subsecção
            const subMatch = subSectionRegex.exec(line)
            if (subMatch) {
                processCurrentCampo()
                currentCampo = {
                    titulo: subMatch[2].trim(),
                    tipo: 'subcampo',
                    originalIndex: subMatch[1],
                    displayIndex: subMatch[1]
                }
                descriptionLines = []
                return
            }

            // Verifica secção principal
            const mainMatch = mainSectionRegex.exec(line)
            if (mainMatch) {
                processCurrentCampo()
                currentCampo = {
                    titulo: mainMatch[2].trim(),
                    tipo: 'campo',
                    originalIndex: mainMatch[1],
                    displayIndex: mainMatch[1]
                }
                descriptionLines = []
                return
            }

            // Adiciona à descrição se não for cabeçalho de secção
            if (line && !line.match(/^\d+\./) && currentCampo.titulo) {
                descriptionLines.push(line)
            }
        })

        // Processa o último campo
        processCurrentCampo()

        // Filtra campos que só têm índice e não têm título relevante
        return campos.filter(campo =>
            campo.titulo &&
            campo.titulo.length > 0 &&
            !campo.titulo.match(/^\d+\.?\s*$/) && // Não apenas números
            campo.descricao &&
            campo.descricao.length > 0
        )
    }

    useEffect(() => {
        const fetchEnabledFUCs = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await axios.get(`${API_BASE}/api/fucs`)
                const enabledFucs = response.data.filter((fuc: FUC) => fuc.enabled)
                setFucs(enabledFucs)

                if (selectedFucId) {
                    const selectedFuc = enabledFucs.find((fuc: FUC) => fuc.id === selectedFucId)
                    if (!selectedFuc) {
                        setError('FUC não encontrada ou não está habilitada')
                        return
                    }
                    await loadFucData(selectedFucId)
                }
            } catch (error) {
                console.error('Erro ao carregar FUCs:', error)
                setError('Não foi possível carregar as FUCs habilitadas.')
            } finally {
                setLoading(false)
            }
        }

        fetchEnabledFUCs()
    }, [selectedFucId])

    const loadFucData = async (fucId: number) => {
        try {
            const [templatesRes, fucRes] = await Promise.all([
                axios.get(`${API_BASE}/api/templates?fuc_id=${fucId}`),
                axios.get(`${API_BASE}/api/fucs/${fucId}`)
            ])

            // Parse templates com estrutura mais solida
            const parsedTemplates = templatesRes.data.map((template: any) => ({
                ...template,
                conteudo: typeof template.conteudo === 'string'
                    ? { campos_avaliacao: [], descricao: template.conteudo }
                    : {
                        campos_avaliacao: template.conteudo.campos_avaliacao || [],
                        descricao: template.conteudo.descricao || ''
                    }
            }))
            setTemplates(parsedTemplates)

            // Parse FUC conteudo para extreair campos
            const fucData = fucRes.data
            if (fucData.conteudo) {
                const extractedCampos = parseFucContent(fucData.conteudo)
                setCampos(extractedCampos)
            } else {
                setCampos([])
            }
        } catch (error) {
            console.error('Erro ao carregar dados da FUC:', error)
            setError('Não foi possível carregar os dados da FUC.')
        }
    }

    const handleFucSelect = (fucId: number) => {
        setSelectedFucId(fucId)
        setCurrentTemplate(null)
        setTemplates([])
        setCampos([])
        navigate(`/gerir-template/${fucId}`)
    }

    const handleSave = async () => {
        if (!currentTemplate || !selectedFucId) return

        try {
            setSaving(true)

            // Ensure proper JSON structure for template content
            const templateData = {
                nome: currentTemplate.nome,
                conteudo: {
                    campos_avaliacao: currentTemplate.conteudo.campos_avaliacao.map((campo, index) => ({
                        ...campo,
                        ordem: index + 1
                    })),
                    descricao: currentTemplate.conteudo.descricao || ''
                },
                fuc_id: selectedFucId,
                criado_por: user?.id
            }

            if (currentTemplate.id && currentTemplate.id > 0) {
                await axios.put(`${API_BASE}/api/templates/${currentTemplate.id}`, templateData)
            } else {
                await axios.post(`${API_BASE}/api/templates`, templateData)
            }

            await loadFucData(selectedFucId)
            setCurrentTemplate(null)
            alert('Template guardada com sucesso!')
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
        if (!selectedFucId) return

        setCurrentTemplate({
            id: 0,
            nome: '',
            conteudo: {
                campos_avaliacao: [],
                descricao: ''
            },
            fuc_id: selectedFucId,
            criado_por: user?.id || 0,
            created_at: new Date().toISOString()
        })
    }

    const createUniversalTemplate = () => {
        if (!selectedFucId) return

        // Create a universal template with all evaluation options for all campos
        const universalCamposAvaliacao: CampoAvaliacao[] = campos.map((campo, index) => ({
            campo_id: campo.id,
            titulo: campo.titulo,
            tipo_avaliacao: ['texto', 'escolha_multipla'],
            opcoes: ['Adequado', 'Não Adequado', 'Incerteza', 'Necessita Revisão', 'Excelente'],
            display_index: campo.displayIndex || `${index + 1}`,
            ordem: index + 1
        }))

        setCurrentTemplate({
            id: 0,
            nome: 'Template Universal - Avaliação Completa',
            conteudo: {
                campos_avaliacao: universalCamposAvaliacao,
                descricao: 'Template universal com todas as opções de avaliação disponíveis para todos os campos da FUC.'
            },
            fuc_id: selectedFucId,
            criado_por: user?.id || 0,
            created_at: new Date().toISOString()
        })
    }

    const toggleAvaliacaoTipo = (campoId: string, tipo: 'texto' | 'escolha_multipla') => {
        if (!currentTemplate) return

        setCurrentTemplate(prev => {
            if (!prev) return prev

            const camposAtualizados = [...prev.conteudo.campos_avaliacao]
            const campoIndex = camposAtualizados.findIndex(c => c.campo_id === campoId)
            const originalCampo = campos.find(c => c.id === campoId)

            if (campoIndex === -1) {
                camposAtualizados.push({
                    campo_id: campoId,
                    titulo: originalCampo?.titulo || '',
                    tipo_avaliacao: [tipo],
                    opcoes: tipo === 'escolha_multipla' ? ['Adequado', 'Não Adequado', 'Incerteza'] : undefined,
                    display_index: originalCampo?.displayIndex || '',
                    ordem: camposAtualizados.length + 1
                })
            } else {
                const tipos = [...camposAtualizados[campoIndex].tipo_avaliacao]
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
                conteudo: {
                    ...prev.conteudo,
                    campos_avaliacao: camposAtualizados
                }
            } as Template
        })
    }

    const updateOpcoes = (campoId: string, opcoes: string[]) => {
        if (!currentTemplate) return

        setCurrentTemplate(prev => {
            if (!prev) return prev

            const camposAtualizados = prev.conteudo.campos_avaliacao.map(campo => {
                if (campo.campo_id === campoId) {
                    return { ...campo, opcoes }
                }
                return campo
            })

            return {
                ...prev,
                conteudo: {
                    ...prev.conteudo,
                    campos_avaliacao: camposAtualizados
                }
            }
        })
    }

    const addOpcao = (campoId: string) => {
        if (!currentTemplate) return

        setCurrentTemplate(prev => {
            if (!prev) return prev

            const camposAtualizados = prev.conteudo.campos_avaliacao.map(campo => {
                if (campo.campo_id === campoId && campo.opcoes) {
                    return { ...campo, opcoes: [...campo.opcoes, ''] }
                }
                return campo
            })

            return {
                ...prev,
                conteudo: {
                    ...prev.conteudo,
                    campos_avaliacao: camposAtualizados
                }
            }
        })
    }

    const removeOpcao = (campoId: string, opcaoIndex: number) => {
        if (!currentTemplate) return

        setCurrentTemplate(prev => {
            if (!prev) return prev

            const camposAtualizados = prev.conteudo.campos_avaliacao.map(campo => {
                if (campo.campo_id === campoId && campo.opcoes) {
                    const novasOpcoes = [...campo.opcoes]
                    novasOpcoes.splice(opcaoIndex, 1)
                    return { ...campo, opcoes: novasOpcoes }
                }
                return campo
            })

            return {
                ...prev,
                conteudo: {
                    ...prev.conteudo,
                    campos_avaliacao: camposAtualizados
                }
            }
        })
    }

    const updateDisplayIndex = (campoId: string, newIndex: string) => {
        if (!currentTemplate) return

        setCurrentTemplate(prev => {
            if (!prev) return prev

            const camposAtualizados = prev.conteudo.campos_avaliacao.map(campo => {
                if (campo.campo_id === campoId) {
                    return { ...campo, display_index: newIndex }
                }
                return campo
            })

            return {
                ...prev,
                conteudo: {
                    ...prev.conteudo,
                    campos_avaliacao: camposAtualizados
                }
            }
        })
    }

    const moveCampo = (campoId: string, direction: 'up' | 'down') => {
        if (!currentTemplate) return

        setCurrentTemplate(prev => {
            if (!prev) return prev

            const campos = [...prev.conteudo.campos_avaliacao]
            const currentIndex = campos.findIndex(c => c.campo_id === campoId)

            if (currentIndex === -1) return prev

            const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

            if (newIndex < 0 || newIndex >= campos.length) return prev

            // Swap manual
            const temp = campos[currentIndex];
            campos[currentIndex] = campos[newIndex];
            campos[newIndex] = temp;

            // Atualizar ordem
            const updatedCampos = campos.map((campo, index) => ({
                ...campo,
                ordem: index + 1
            }));

            return {
                ...prev,
                conteudo: {
                    ...prev.conteudo,
                    campos_avaliacao: updatedCampos
                }
            }
        })
    }

    const removeCampoFromTemplate = (campoId: string) => {
        if (!currentTemplate) return

        setCurrentTemplate(prev => {
            if (!prev) return prev

            const camposAtualizados = prev.conteudo.campos_avaliacao.filter(c => c.campo_id !== campoId)

            return {
                ...prev,
                conteudo: {
                    ...prev.conteudo,
                    campos_avaliacao: camposAtualizados
                }
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
            {/* Seleção de FUC */}
            {!selectedFucId && (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Selecionar FUC para Gerir Templates</h1>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {fucs.map(fuc => (
                            <button
                                key={fuc.id}
                                onClick={() => handleFucSelect(fuc.id)}
                                className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
                            >
                                <h3 className="font-medium text-gray-900">{fuc.titulo}</h3>
                                <p className="text-sm text-gray-600 mt-1">Clique para gerir templates</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Gestão de Template */}
            {selectedFucId && (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <FileText className="h-6 w-6 text-purple-600" />
                            <h1 className="text-2xl font-bold text-gray-900">
                                Templates da FUC {fucs.find(f => f.id === selectedFucId)?.titulo}
                            </h1>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setSelectedFucId(null)
                                    navigate('/gerir-template')
                                }}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={createUniversalTemplate}
                                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                                disabled={campos.length === 0}
                            >
                                <Star className="w-4 h-4 mr-2" />
                                Template Universal
                            </button>
                            <button
                                onClick={createNewTemplate}
                                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Template
                            </button>
                        </div>
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descrição da Template
                                </label>
                                <textarea
                                    value={currentTemplate.conteudo.descricao || ''}
                                    onChange={(e) => setCurrentTemplate(prev => ({
                                        ...prev!,
                                        conteudo: {
                                            ...prev!.conteudo,
                                            descricao: e.target.value
                                        }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500"
                                    rows={3}
                                    placeholder="Descrição opcional da template..."
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Campos para Avaliação ({campos.length} campos encontrados)
                                </h3>

                                {campos.length === 0 ? (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <p className="text-yellow-800">
                                            Nenhum campo foi encontrado nesta FUC. Verifique se o conteúdo da FUC está formatado corretamente.
                                        </p>
                                    </div>
                                ) : (
                                    currentTemplate.conteudo.campos_avaliacao.map((avaliacaoConfig, templateIndex) => {
                                        const campo = campos.find(c => c.id === avaliacaoConfig.campo_id)
                                        if (!campo) return null

                                        return (
                                            <div key={avaliacaoConfig.campo_id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {/* Gestão de Index Avançada */}
                                                            <div className="flex items-center gap-2">
                                                                {editingIndex === avaliacaoConfig.campo_id ? (
                                                                    <input
                                                                        type="text"
                                                                        value={avaliacaoConfig.display_index || ''}
                                                                        onChange={(e) => updateDisplayIndex(avaliacaoConfig.campo_id, e.target.value)}
                                                                        onBlur={() => setEditingIndex(null)}
                                                                        onKeyPress={(e) => e.key === 'Enter' && setEditingIndex(null)}
                                                                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                                                                        autoFocus
                                                                    />
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setEditingIndex(avaliacaoConfig.campo_id)}
                                                                        className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                                                                    >
                                                                        <span className="font-mono">{avaliacaoConfig.display_index || 'N/A'}</span>
                                                                        <Edit3 className="w-3 h-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <h4 className="font-medium text-gray-800">{campo.titulo}</h4>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">{campo.descricao}</p>
                                                        <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                                            {campo.tipo}
                                                        </span>
                                                    </div>

                                                    {/* Campo Controlos */}
                                                    <div className="flex flex-col gap-1 ml-4">
                                                        <button
                                                            onClick={() => moveCampo(avaliacaoConfig.campo_id, 'up')}
                                                            disabled={templateIndex === 0}
                                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                        >
                                                            <ArrowUp className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => moveCampo(avaliacaoConfig.campo_id, 'down')}
                                                            disabled={templateIndex === currentTemplate.conteudo.campos_avaliacao.length - 1}
                                                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                        >
                                                            <ArrowDown className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => removeCampoFromTemplate(avaliacaoConfig.campo_id)}
                                                            className="p-1 text-red-400 hover:text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => toggleAvaliacaoTipo(avaliacaoConfig.campo_id, 'texto')}
                                                        className={`flex items-center px-3 py-2 rounded-md ${avaliacaoConfig.tipo_avaliacao.includes('texto')
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                            }`}
                                                    >
                                                        {avaliacaoConfig.tipo_avaliacao.includes('texto') ? (
                                                            <Check className="w-4 h-4 mr-2" />
                                                        ) : (
                                                            <X className="w-4 h-4 mr-2" />
                                                        )}
                                                        Texto Livre
                                                    </button>

                                                    <button
                                                        onClick={() => toggleAvaliacaoTipo(avaliacaoConfig.campo_id, 'escolha_multipla')}
                                                        className={`flex items-center px-3 py-2 rounded-md ${avaliacaoConfig.tipo_avaliacao.includes('escolha_multipla')
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                            }`}
                                                    >
                                                        {avaliacaoConfig.tipo_avaliacao.includes('escolha_multipla') ? (
                                                            <Check className="w-4 h-4 mr-2" />
                                                        ) : (
                                                            <X className="w-4 h-4 mr-2" />
                                                        )}
                                                        Escolha Múltipla
                                                    </button>
                                                </div>

                                                {avaliacaoConfig.tipo_avaliacao.includes('escolha_multipla') && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Opções de Escolha
                                                        </label>
                                                        <div className="space-y-2">
                                                            {avaliacaoConfig.opcoes?.map((opcao, index) => (
                                                                <div key={index} className="flex gap-2 items-center">
                                                                    <input
                                                                        type="text"
                                                                        value={opcao}
                                                                        onChange={(e) => {
                                                                            const novasOpcoes = [...(avaliacaoConfig.opcoes || [])]
                                                                            novasOpcoes[index] = e.target.value
                                                                            updateOpcoes(avaliacaoConfig.campo_id, novasOpcoes)
                                                                        }}
                                                                        className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm"
                                                                    />
                                                                    <button
                                                                        onClick={() => removeOpcao(avaliacaoConfig.campo_id, index)}
                                                                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-md"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                onClick={() => addOpcao(avaliacaoConfig.campo_id)}
                                                                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-sm hover:bg-purple-200"
                                                            >
                                                                + Adicionar Opção
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                )}

                                {/* Add campos restantes */}
                                {campos.length > 0 && (
                                    <div className="border-t pt-4">
                                        <h4 className="text-md font-medium text-gray-700 mb-3">Adicionar Campos à Template</h4>
                                        <div className="grid gap-2 md:grid-cols-2">
                                            {campos
                                                .filter(campo => !currentTemplate.conteudo.campos_avaliacao.some(c => c.campo_id === campo.id))
                                                .map(campo => (
                                                    <button
                                                        key={campo.id}
                                                        onClick={() => toggleAvaliacaoTipo(campo.id, 'texto')}
                                                        className="p-3 text-left border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-mono">
                                                                {campo.displayIndex}
                                                            </span>
                                                            <span className="font-medium text-sm">{campo.titulo}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                )}
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
                                    disabled={saving || !currentTemplate.nome}
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
                                            <p className="text-sm text-gray-600">
                                                Campos configurados: {template.conteudo.campos_avaliacao?.length || 0}
                                            </p>
                                            {template.conteudo.descricao && (
                                                <p className="text-sm text-gray-500 mt-1">{template.conteudo.descricao}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentTemplate(template)}
                                                className="px-4 py-2 text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleDelete(template.id)}
                                                className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default GerirTemplate