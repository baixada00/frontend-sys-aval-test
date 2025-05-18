import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, Save, AlertCircle, Plus, Trash2 } from 'lucide-react'
import axios from 'axios'
import { useUser } from '../context/UserContext'

interface Template {
    id: number
    nome: string
    conteudo: string
    fuc_id: number
    criado_por: number
    created_at: string
}

const GerirTemplate = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useUser()
    const [templates, setTemplates] = useState<Template[]>([])
    const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                setLoading(true)
                const response = await axios.get(`/api/templates?fuc_id=${id}`)
                setTemplates(response.data)
            } catch (error) {
                console.error('Erro ao carregar templates:', error)
                setError('Não foi possível carregar os templates.')
            } finally {
                setLoading(false)
            }
        }

        fetchTemplates()
    }, [id])

    const handleSave = async () => {
        if (!currentTemplate) return

        try {
            setSaving(true)
            const templateData = {
                nome: currentTemplate.nome,
                conteudo: currentTemplate.conteudo,
                fuc_id: parseInt(id || '0'),
                criado_por: user?.id
            }

            if (currentTemplate.id) {
                await axios.put(`/api/templates/${currentTemplate.id}`, templateData)
            } else {
                await axios.post('/api/templates', templateData)
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
            await axios.delete(`/api/templates/${templateId}`)
            setTemplates(prev => prev.filter(t => t.id !== templateId))
        } catch (error) {
            console.error('Erro ao excluir template:', error)
            alert('Erro ao excluir o template.')
        }
    }

    const createNewTemplate = () => {
        setCurrentTemplate({
            id: 0,
            nome: '',
            conteudo: '',
            fuc_id: parseInt(id || '0'),
            criado_por: user?.id || 0,
            created_at: new Date().toISOString()
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Conteúdo da Template
                            </label>
                            <textarea
                                value={currentTemplate.conteudo}
                                onChange={(e) => setCurrentTemplate(prev => ({ ...prev!, conteudo: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 font-mono"
                                rows={15}
                                placeholder="Digite o conteúdo da template..."
                            />
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
                        {templates.map(template => (
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
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default GerirTemplate