import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { FileText, RefreshCw, AlertCircle, Calendar, ToggleLeft as Toggle, Plus, Upload, Download, Save, CheckCircle } from 'lucide-react'
import { useUser } from '../context/UserContext'

interface FUC {
  id: number
  titulo: string
  descricao: string
  enabled: boolean
  created_at: string
}

interface ContactHours {
  tipo: string
  presencial: number
  assincrono: number
  sincrono: number
}

interface NewFUC {
  titulo: string
  sigla: string
  duracao: string
  horasTrabalho: number
  horasContacto: ContactHours[]
  creditos: number
  observacoes: string
  docenteResponsavel: string
  outrosDocentes: string
  objetivos: string
  conteudos: string
  coerenciaConteudos: string
  metodologias: string
  avaliacaoNormal: string
  avaliacaoEspecial: string
  coerenciaMetodologias: string
  bibliografia: string
}

const initialContactHours: ContactHours[] = [
  { tipo: 'Teórico (T)', presencial: 0, assincrono: 0, sincrono: 0 },
  { tipo: 'Teórico-prático (TP)', presencial: 0, assincrono: 0, sincrono: 0 },
  { tipo: 'Prático e laboratorial (PL)', presencial: 0, assincrono: 0, sincrono: 0 },
  { tipo: 'Trabalho de campo (TC)', presencial: 0, assincrono: 0, sincrono: 0 },
  { tipo: 'Seminário (S)', presencial: 0, assincrono: 0, sincrono: 0 },
  { tipo: 'Estágio (E)', presencial: 0, assincrono: 0, sincrono: 0 },
  { tipo: 'Orientação tutorial (OT)', presencial: 0, assincrono: 0, sincrono: 0 },
  { tipo: 'Outra (O)', presencial: 0, assincrono: 0, sincrono: 0 }
]

const initialFUC: NewFUC = {
  titulo: '',
  sigla: '',
  duracao: 'Semestral',
  horasTrabalho: 0,
  horasContacto: initialContactHours,
  creditos: 0,
  observacoes: '',
  docenteResponsavel: '',
  outrosDocentes: '',
  objetivos: '',
  conteudos: '',
  coerenciaConteudos: '',
  metodologias: '',
  avaliacaoNormal: '',
  avaliacaoEspecial: '',
  coerenciaMetodologias: '',
  bibliografia: ''
}

const GestaoFUC = () => {
  const { user } = useUser()
  const [fucs, setFucs] = useState<FUC[]>([])
  const [unloadedFucs, setUnloadedFucs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newFUC, setNewFUC] = useState<NewFUC>(initialFUC)
  const [currentStep, setCurrentStep] = useState(1)

  const fetchFUCs = async () => {
    try {
      setLoading(true)
      setError(null)
      const endpoint = user?.type === 'admin' 
        ? '/api/fucs'
        : `/api/fuc-permissions/${user?.id}`
      
      const response = await axios.get(endpoint)
      setFucs(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error("Erro ao procurar FUCs", error)
      setError('Erro ao carregar FUCs. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnloadedFUCs = async () => {
    try {
      const response = await axios.get('/api/fucs/files/unloaded')
      setUnloadedFucs(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Erro ao buscar FUCs não carregadas:', error)
      setError('Erro ao carregar lista de FUCs disponíveis.')
    }
  }

  const handleLoadFUC = async (filename: string) => {
    try {
      await axios.post('/api/fucs/from-file', { filename })
      await fetchFUCs()
      await fetchUnloadedFUCs()
    } catch (error) {
      console.error('Erro ao carregar FUC:', error)
      alert('Erro ao carregar a FUC')
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

  const handleInputChange = (field: keyof NewFUC, value: string | number | ContactHours[]) => {
    setNewFUC(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleContactHoursChange = (index: number, field: keyof ContactHours, value: number) => {
    const updatedHours = [...newFUC.horasContacto]
    updatedHours[index] = {
      ...updatedHours[index],
      [field]: value
    }
    handleInputChange('horasContacto', updatedHours)
  }

  const calculateTotals = () => {
    const totals = {
      presencial: 0,
      assincrono: 0,
      sincrono: 0
    }

    newFUC.horasContacto.forEach(hour => {
      totals.presencial += hour.presencial
      totals.assincrono += hour.assincrono
      totals.sincrono += hour.sincrono
    })

    return totals
  }

  const exportToText = () => {
    const totals = calculateTotals()
    let content = `Modelo de Ficha de Unidade Curricular\n\n`
    content += `1. Caracterização da Unidade Curricular\n\n`
    content += `1.1. Designação da unidade curricular\n${newFUC.titulo}\n\n`
    content += `1.2. Sigla da área científica\n${newFUC.sigla}\n\n`
    content += `1.3. Duração\n${newFUC.duracao}\n\n`
    content += `1.4. Horas de trabalho\n${newFUC.horasTrabalho}\n\n`
    content += `1.5. Horas de contacto\n`
    content += `Tipologia do Ensino\tPresencial\tAssíncrono\tSíncrono\n`
    newFUC.horasContacto.forEach(hour => {
      content += `${hour.tipo}\t${hour.presencial}\t${hour.assincrono}\t${hour.sincrono}\n`
    })
    content += `Total\t${totals.presencial}\t${totals.assincrono}\t${totals.sincrono}\n\n`
    // Add remaining sections...

    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${newFUC.titulo.replace(/\s+/g, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const saveFUC = async (final: boolean) => {
    try {
      const response = await axios.post('/api/fucs', {
        ...newFUC,
        final
      })
      
      if (response.status === 201) {
        alert(final ? 'FUC finalizada com sucesso!' : 'FUC salva como rascunho!')
        setIsCreating(false)
        setNewFUC(initialFUC)
        fetchFUCs()
      }
    } catch (error) {
      console.error('Erro ao salvar FUC:', error)
      alert('Erro ao salvar FUC')
    }
  }

  useEffect(() => {
    fetchFUCs()
    if (user?.type === 'admin') {
      fetchUnloadedFUCs()
    }
  }, [user])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Título</label>
              <input
                type="text"
                value={newFUC.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sigla</label>
              <input
                type="text"
                value={newFUC.sigla}
                onChange={(e) => handleInputChange('sigla', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duração</label>
              <select
                value={newFUC.duracao}
                onChange={(e) => handleInputChange('duracao', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="Semestral">Semestral</option>
                <option value="Anual">Anual</option>
              </select>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Horas de Trabalho</label>
              <input
                type="number"
                value={newFUC.horasTrabalho}
                onChange={(e) => handleInputChange('horasTrabalho', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Horas de Contacto</label>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Tipo</th>
                      <th className="px-4 py-2">Presencial</th>
                      <th className="px-4 py-2">Assíncrono</th>
                      <th className="px-4 py-2">Síncrono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newFUC.horasContacto.map((hour, index) => (
                      <tr key={hour.tipo}>
                        <td className="px-4 py-2">{hour.tipo}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={hour.presencial}
                            onChange={(e) => handleContactHoursChange(index, 'presencial', parseInt(e.target.value))}
                            className="w-20 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={hour.assincrono}
                            onChange={(e) => handleContactHoursChange(index, 'assincrono', parseInt(e.target.value))}
                            className="w-20 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={hour.sincrono}
                            onChange={(e) => handleContactHoursChange(index, 'sincrono', parseInt(e.target.value))}
                            className="w-20 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                          />
                        </td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="px-4 py-2">Total</td>
                      <td className="px-4 py-2">{calculateTotals().presencial}</td>
                      <td className="px-4 py-2">{calculateTotals().assincrono}</td>
                      <td className="px-4 py-2">{calculateTotals().sincrono}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Docente Responsável</label>
              <input
                type="text"
                value={newFUC.docenteResponsavel}
                onChange={(e) => handleInputChange('docenteResponsavel', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Outros Docentes</label>
              <textarea
                value={newFUC.outrosDocentes}
                onChange={(e) => handleInputChange('outrosDocentes', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                rows={3}
              />
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Objetivos</label>
              <textarea
                value={newFUC.objetivos}
                onChange={(e) => handleInputChange('objetivos', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Conteúdos Programáticos</label>
              <textarea
                value={newFUC.conteudos}
                onChange={(e) => handleInputChange('conteudos', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                rows={4}
              />
            </div>
          </div>
        )
      default:
        return null
    }
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

  if (isCreating) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Criar Nova FUC</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={exportToText}
                className="flex items-center px-4 py-2 text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
              <button
                onClick={() => saveFUC(false)}
                className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Rascunho
              </button>
              <button
                onClick={() => saveFUC(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Finalizar
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map((step) => (
                  <button
                    key={step}
                    onClick={() => setCurrentStep(step)}
                    className={`px-4 py-2 rounded-md ${
                      currentStep === step
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Passo {step}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                )}
                {currentStep < 4 && (
                  <button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Próximo
                  </button>
                )}
              </div>
            </div>
          </div>

          {renderStep()}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-900">Gestão de FUCs</h1>
          <div className="flex gap-2">
            <button
              onClick={fetchUnloadedFUCs}
              className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar Lista
            </button>
            {user?.type === 'admin' && (
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Nova FUC
              </button>
            )}
          </div>
        </div>

        {user?.type === 'admin' && unloadedFucs.length > 0 && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">FUCs Disponíveis para Carregar</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {unloadedFucs.map(filename => (
                <div key={filename} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{filename}</span>
                    <button
                      onClick={() => handleLoadFUC(filename)}
                      className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Carregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">FUCs Carregadas</h2>
        {!Array.isArray(fucs) || fucs.length === 0 ? (
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