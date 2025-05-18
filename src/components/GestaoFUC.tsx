import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { FileText, RefreshCw, AlertCircle, Calendar, ToggleLeft as Toggle, Plus } from 'lucide-react'
import { useUser } from '../context/UserContext'

interface FUC {
  id: number
  titulo: string
  descricao: string
  enabled: boolean
  created_at: string
}

const GestaoFUC = () => {
  const { user } = useUser()
  const [fucs, setFucs] = useState<FUC[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFUCs = async () => {
    try {
      setLoading(true)
      setError(null)
      const endpoint = user?.type === 'admin' 
        ? '/api/fucs'
        : `/api/fuc-permissions/${user?.id}`;
      
      const response = await axios.get(endpoint)
      setFucs(response.data)
    } catch (error) {
      console.error("Erro ao procurar FUCs", error)
      setError('Erro ao carregar FUCs. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const toggleFUCStatus = async (fucId: number, currentStatus: boolean) => {
    try {
      await axios.patch(`/api/fucs/${fucId}`, { enabled: !currentStatus })
      setFucs(prevFucs =>
        prevFucs.map(fuc =>
          fuc.id === fucId ? { ...fuc, enabled: !currentStatus } : fuc
        )
      )
    } catch (error) {
      console.error("Erro ao atualizar status da FUC", error)
      alert("Erro ao atualizar o status da FUC")
    }
  }

  useEffect(() => {
    fetchFUCs()
  }, [user])

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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-900">Gestão de FUCs</h1>
          {user?.type === 'gestor' && (
            <Link
              to="/gerir-template"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {fucs.length === 0 ? (
          <p className="text-center text-gray-600 py-8">Nenhuma FUC disponível no momento.</p>
        ) : (
          <div className="space-y-4">
            {fucs.map(fuc => (
              <div
                key={fuc.id}
                className="flex items-center justify-between bg-purple-50 p-4 rounded-lg border border-purple-100"
              >
                <div className="flex items-center space-x-4">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <div>
                    <h3 className="text-lg font-medium text-purple-900">{fuc.titulo}</h3>
                    <div className="flex items-center text-sm text-purple-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Criado em: {new Date(fuc.created_at).toLocaleDateString()}</span>
                    </div>
                    {fuc.descricao && (
                      <p className="text-sm text-gray-600 mt-1">{fuc.descricao}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {user?.type === 'admin' && (
                    <button
                      onClick={() => toggleFUCStatus(fuc.id, fuc.enabled)}
                      className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                        fuc.enabled
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Toggle className="w-4 h-4 mr-2" />
                      {fuc.enabled ? 'Ativo' : 'Inativo'}
                    </button>
                  )}
                  {(user?.type === 'gestor' || (user?.type === 'admin' && fuc.enabled)) && (
                    <Link
                      to={`/gerir-template/${fuc.id}`}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {user.type === 'gestor' ? 'Gerenciar Templates' : 'Ver Templates'}
                    </Link>
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

export default GestaoFUC