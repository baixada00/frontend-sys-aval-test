import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { FileText, CheckCircle, Save, AlertCircle, Send } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { API_BASE } from '../config/api'

interface FUC {
    id: number
    titulo: string
    tipo: string
    created_at: string
    conteudo: string
}

interface Template {
    id: number
    nome: string
    conteudo: {
        campos_avaliacao: CampoAvaliacao[]
        descricao?: string
    }
}

interface CampoAvaliacao {
    campo_id: string
    titulo: string
    tipo_avaliacao: ('texto' | 'escolha_multipla')[]
    opcoes?: string[]
    display_index?: string
    ordem?: number
}

interface Campo {
    id: string
    titulo: string
    descricao: string
    tipo: string
    displayIndex?: string
}

interface AvaliacaoResposta {
    campo_id: string
    tipo: 'texto' | 'escolha_multipla'
    valor: string
    comentario?: string
}

const AvaliacaoFUC = () => {
    const { id } = useParams<{ id: string }>()
    const [searchParams] = useSearchParams()
    const templateId = searchParams.get('template')
    const { user } = useUser()

    const [fuc, setFuc] = useState<FUC | null>(null)
    const [template, setTemplate] = useState<Template | null>(null)
    const [campos, setCampos] = useState<Campo[]>([])
    const [respostas, setRespostas] = useState<Record<string, AvaliacaoResposta>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Enhanced FUC content parser (same as in GerirTemplate)
    const parseFucContent = (content: string): Campo[] => {
        if (!content) return []

        const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
        const campos: Campo[] = []
        let currentCampo: Partial<Campo> = {}
        let descriptionLines: string[] = []
        let campoCounter = 1

        const mainSectionRegex = /^(\d+)\.\s*(.+)/
        const subSectionRegex = /^(\d+\.\d+)\.\s*(.+)/
        const deepSubSectionRegex = /^(\d+\.\d+\.\d+)\.\s*(.+)/

        const processCurrentCampo = () => {
            if (currentCampo.titulo && descriptionLines.length > 0) {
                const cleanDescription = descriptionLines.join('\n').trim()

                if (cleanDescription.length > 0) {
                    campos.push({
                        id: `campo_${campoCounter}`,
                        titulo: currentCampo.titulo,
                        descricao: cleanDescription,
                        tipo: currentCampo.tipo || 'campo',
                        displayIndex: currentCampo.displayIndex
                    })
                    campoCounter++
                }
            }
        }

        lines.forEach((line) => {
            const deepSubMatch = deepSubSectionRegex.exec(line)
            if (deepSubMatch) {
                processCurrentCampo()
                currentCampo = {
                    titulo: deepSubMatch[2].trim(),
                    tipo: 'subcampo',
                    displayIndex: deepSubMatch[1]
                }
                descriptionLines = []
                return
            }

            const subMatch = subSectionRegex.exec(line)
            if (subMatch) {
                processCurrentCampo()
                currentCampo = {
                    titulo: subMatch[2].trim(),
                    tipo: 'subcampo',
                    displayIndex: subMatch[1]
                }
                descriptionLines = []
                return
            }

            const mainMatch = mainSectionRegex.exec(line)
            if (mainMatch) {
                processCurrentCampo()
                currentCampo = {
                    titulo: mainMatch[2].trim(),
                    tipo: 'campo',
                    displayIndex: mainMatch[1]
                }
                descriptionLines = []
                return
            }

            if (line && !line.match(/^\d+\./) && currentCampo.titulo) {
                descriptionLines.push(line)
            }
        })

        processCurrentCampo()

        return campos.filter(campo =>
            campo.titulo &&
            campo.titulo.length > 0 &&
            !campo.titulo.match(/^\d+\.?\s*$/) &&
            campo.descricao &&
            campo.descricao.length > 0
        )
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)

                if (!id || !templateId) {
                    setError('ID da FUC ou template não fornecido')
                    return
                }

                const [fucResponse, templateResponse] = await Promise.all([
                    axios.get(`${API_BASE}/api/fucs/${id}`),
                    axios.get(`${API_BASE}/api/templates/${templateId}`)
                ])

                const fucData = fucResponse.data
                const templateData = templateResponse.data

                setFuc({
                    id: fucData.id,
                    titulo: fucData.titulo,
                    tipo: fucData.tipo || 'FUC',
                    created_at: fucData.created_at,
                    conteudo: fucData.conteudo
                })

                // Parse template content
                const parsedTemplate = {
                    ...templateData,
                    conteudo: typeof templateData.conteudo === 'string'
                        ? { campos_avaliacao: [], descricao: templateData.conteudo }
                        : templateData.conteudo
                }
                setTemplate(parsedTemplate)

                // Parse FUC content to extract campos
                if (fucData.conteudo) {
                    const extractedCampos = parseFucContent(fucData.conteudo)
                    setCampos(extractedCampos)
                }

            } catch (err) {
                console.error('Erro ao carregar dados:', err)
                setError('Erro ao carregar dados da avaliação')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id, templateId])

    const handleRespostaChange = (campoId: string, tipo: 'texto' | 'escolha_multipla', valor: string, comentario?: string) => {
        setRespostas(prev => ({
            ...prev,
            [campoId]: {
                campo_id: campoId,
                tipo,
                valor,
                comentario: comentario || prev[campoId]?.comentario
            }
        }))
    }

    const handleComentarioChange = (campoId: string, comentario: string) => {
        setRespostas(prev => ({
            ...prev,
            [campoId]: {
                ...prev[campoId],
                comentario
            }
        }))
    }

    const handleSave = async () => {
        if (!user || !fuc) return

        try {
            setSaving(true)

            const avaliacaoData = {
                fuc_id: fuc.id,
                avaliador_id: user.id,
                respostas: {
                    template_id: template?.id,
                    campos: respostas,
                    estado: 'rascunho'
                }
            }

            await axios.post(`${API_BASE}/api/relatorios/gravar`, avaliacaoData)
            alert('Rascunho gravado com sucesso!')
        } catch (error) {
            console.error('Erro ao gravar rascunho:', error)
            alert('Erro ao gravar rascunho')
        } finally {
            setSaving(false)
        }
    }

    const handleSubmit = async () => {
        if (!user || !fuc) return

        try {
            setSubmitting(true)

            const avaliacaoData = {
                fuc_id: fuc.id,
                avaliador_id: user.id,
                respostas: {
                    template_id: template?.id,
                    campos: respostas,
                    estado: 'submetido',
                    data_submissao: new Date().toISOString()
                }
            }

            await axios.post(`${API_BASE}/api/relatorios/gravar`, avaliacaoData)
            alert('Avaliação submetida com sucesso!')
        } catch (error) {
            console.error('Erro ao submeter avaliação:', error)
            alert('Erro ao submeter avaliação')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
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

    if (!fuc || !template) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
                <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">Dados da FUC ou template não encontrados</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Avaliação: {fuc.titulo}
                </h1>
                <div className="flex gap-4 text-sm text-gray-500 mb-4">
                    <p><span className="font-medium">Tipo:</span> {fuc.tipo}</p>
                    <p><span className="font-medium">Template:</span> {template.nome}</p>
                    <p><span className="font-medium">Avaliador:</span> {user?.name}</p>
                </div>
                {template.conteudo.descricao && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <p className="text-purple-800">{template.conteudo.descricao}</p>
                    </div>
                )}
            </div>

            {/* Evaluation Fields */}
            <div className="space-y-6">
                {template.conteudo.campos_avaliacao
                    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                    .map((campoConfig) => {
                        const campo = campos.find(c => c.id === campoConfig.campo_id)
                        if (!campo) return null

                        return (
                            <div key={campoConfig.campo_id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                                <div className="flex gap-6">
                                    {/* Campo Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-mono">
                                                {campoConfig.display_index || campo.displayIndex}
                                            </span>
                                            <h4 className="text-lg font-medium text-gray-900">{campo.titulo}</h4>
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-wrap mb-4">{campo.descricao}</p>
                                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                            {campo.tipo}
                                        </span>
                                    </div>

                                    {/* Avaliacao Controls */}
                                    <div className="w-80 space-y-4">
                                        {/* Texto Aval */}
                                        {campoConfig.tipo_avaliacao.includes('texto') && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Avaliação em Texto Livre
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={respostas[campoConfig.campo_id]?.tipo === 'texto' ? respostas[campoConfig.campo_id]?.valor || '' : ''}
                                                    onChange={(e) => handleRespostaChange(campoConfig.campo_id, 'texto', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                                    placeholder="Digite sua avaliação..."
                                                />
                                            </div>
                                        )}

                                        {/* Multipla Escolha Avaliação */}
                                        {campoConfig.tipo_avaliacao.includes('escolha_multipla') && campoConfig.opcoes && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Escolha uma Opção
                                                </label>
                                                <select
                                                    value={respostas[campoConfig.campo_id]?.tipo === 'escolha_multipla' ? respostas[campoConfig.campo_id]?.valor || '' : ''}
                                                    onChange={(e) => handleRespostaChange(campoConfig.campo_id, 'escolha_multipla', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                                >
                                                    <option value="">Selecione uma opção</option>
                                                    {campoConfig.opcoes.map((opcao, index) => (
                                                        <option key={index} value={opcao}>
                                                            {opcao}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Comentários Adicionais */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Comentários Adicionais (Opcional)
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={respostas[campoConfig.campo_id]?.comentario || ''}
                                                onChange={(e) => handleComentarioChange(campoConfig.campo_id, e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="Comentários opcionais..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
            </div>

            {/* Botoes Acao */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'A gravar...' : 'Gravar Rascunho'}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || Object.keys(respostas).length === 0}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-purple-800 hover:bg-purple-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    >
                        <Send className="w-4 h-4 mr-2" />
                        {submitting ? 'A submeter...' : 'Submeter Avaliação'}
                    </button>
                </div>
            </div>

            {/*Espaçamento inferior para os botões fixos*/}
            <div className="h-20"></div>
        </div>
    )
}

export default AvaliacaoFUC