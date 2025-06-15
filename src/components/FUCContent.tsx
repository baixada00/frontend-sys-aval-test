import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FileText, Edit, Save, X, AlertCircle, ArrowLeft } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { API_BASE } from '../config/api'

interface FUC {
    id: number
    titulo: string
    tipo: string
    conteudo: string
    enabled: boolean
    created_at: string
}

const FUCContent = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useUser()
    const [fuc, setFuc] = useState<FUC | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editing, setEditing] = useState(false)
    const [editedContent, setEditedContent] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchFUC = async () => {
            if (!id) return

            try {
                setLoading(true)
                setError(null)
                const response = await axios.get(`${API_BASE}/api/fucs/${id}`)
                setFuc(response.data)
                setEditedContent(response.data.conteudo || '')
            } catch (error) {
                console.error('Erro ao carregar FUC:', error)
                setError('Não foi possível carregar o conteúdo da FUC.')
            } finally {
                setLoading(false)
            }
        }

        fetchFUC()
    }, [id])

    const handleSave = async () => {
        if (!fuc || !user) return

        try {
            setSaving(true)
            await axios.put(`${API_BASE}/api/fucs/${fuc.id}`, {
                conteudo: editedContent
            })
            
            setFuc(prev => prev ? { ...prev, conteudo: editedContent } : null)
            setEditing(false)
            alert('Conteúdo da FUC atualizado com sucesso!')
        } catch (error) {
            console.error('Erro ao salvar FUC:', error)
            alert('Erro ao salvar alterações.')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setEditedContent(fuc?.conteudo || '')
        setEditing(false)
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

    if (!fuc) {
        return (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
                <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">FUC não encontrada.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <FileText className="h-6 w-6 text-purple-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{fuc.titulo}</h1>
                            <p className="text-sm text-gray-600">
                                Tipo: {fuc.tipo} | Status: {fuc.enabled ? 'Ativa' : 'Inativa'}
                            </p>
                        </div>
                    </div>
                    
                    {user?.activeRole === 'admin' && (
                        <div className="flex gap-2">
                            {editing ? (
                                <>
                                    <button
                                        onClick={handleCancel}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {saving ? 'A guardar...' : 'Guardar'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar Conteúdo
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                            <strong>Criada em:</strong> {new Date(fuc.created_at).toLocaleDateString()}
                        </div>
                        <div>
                            <strong>ID:</strong> {fuc.id}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-3">Conteúdo da FUC</h2>
                        
                        {editing ? (
                            <div className="space-y-4">
                                <textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                                    placeholder="Digite o conteúdo da FUC..."
                                />
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-medium text-blue-900 mb-2">Dicas de Formatação:</h3>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• Use numeração como "1.", "1.1.", "1.1.1." para criar seções</li>
                                        <li>• Cada seção deve ter um título descritivo</li>
                                        <li>• Adicione descrições detalhadas após cada título</li>
                                        <li>• Mantenha uma linha em branco entre seções</li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-lg p-6">
                                {fuc.conteudo ? (
                                    <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                                        {fuc.conteudo}
                                    </pre>
                                ) : (
                                    <p className="text-gray-500 italic">Nenhum conteúdo disponível.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FUCContent