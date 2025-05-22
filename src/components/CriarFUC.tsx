import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, FileDown, CheckCircle, Plus, Trash2, Upload } from 'lucide-react'

interface Campo {
  id: string
  titulo: string
  descricao: string
  tipo: 'texto' | 'numerico' | 'tabela'
  maxCaracteres?: number
}

const CriarFUC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('')
  const [campos, setCampos] = useState<Campo[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      // Parse the content and populate the form
      const lines = content.split('\n')
      let currentTitle = ''
      let currentDescription = ''
      let currentFields: Campo[] = []

      lines.forEach((line) => {
        if (line.match(/^\d+\./)) {
          // This is a title line
          if (currentTitle && currentDescription) {
            currentFields.push({
              id: `campo_${Date.now()}_${currentFields.length}`,
              titulo: currentTitle,
              descricao: currentDescription,
              tipo: 'texto',
              maxCaracteres: 1000
            })
          }
          currentTitle = line.trim()
          currentDescription = ''
        } else {
          // This is part of the description
          currentDescription += line + '\n'
        }
      })

      // Add the last field
      if (currentTitle && currentDescription) {
        currentFields.push({
          id: `campo_${Date.now()}_${currentFields.length}`,
          titulo: currentTitle,
          descricao: currentDescription.trim(),
          tipo: 'texto',
          maxCaracteres: 1000
        })
      }

      // Set the form state
      setTitulo(file.name.replace('.txt', ''))
      setCampos(currentFields)
    }
    reader.readAsText(file)
  }

  const adicionarCampo = () => {
    const novoCampo: Campo = {
      id: `campo_${Date.now()}`,
      titulo: '',
      descricao: '',
      tipo: 'texto',
      maxCaracteres: 1000
    }
    setCampos([...campos, novoCampo])
  }

  const atualizarCampo = (index: number, campo: Partial<Campo>) => {
    const novosCampos = [...campos]
    novosCampos[index] = { ...novosCampos[index], ...campo }
    setCampos(novosCampos)
  }

  const removerCampo = (index: number) => {
    setCampos(campos.filter((_, i) => i !== index))
  }

  const gerarPreviewFUC = () => {
    let preview = `${titulo}\n\n`
    campos.forEach((campo, index) => {
      preview += `${index + 1}. ${campo.titulo}\n`
      preview += `${campo.descricao}\n\n`
    })
    return preview
  }

  const exportarParaTXT = () => {
    const conteudo = gerarPreviewFUC()
    const blob = new Blob([conteudo], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${titulo.replace(/\s+/g, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const salvarRascunho = async () => {
    try {
      const response = await fetch('/api/fucs/rascunho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          tipo,
          campos,
          conteudo: gerarPreviewFUC()
        })
      })

      if (!response.ok) throw new Error('Erro ao salvar rascunho')
      alert('Rascunho salvo com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error)
      alert('Erro ao salvar rascunho')
    }
  }

  const finalizarFUC = async () => {
    try {
      const response = await fetch('/api/fucs/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          tipo,
          campos,
          conteudo: gerarPreviewFUC()
        })
      })

      if (!response.ok) throw new Error('Erro ao finalizar FUC')
      alert('FUC finalizada com sucesso!')
      navigate('/gestao-fuc')
    } catch (error) {
      console.error('Erro ao finalizar FUC:', error)
      alert('Erro ao finalizar FUC')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Criar Nova FUC</h1>

        <div className="mb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar de arquivo .txt
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt"
            className="hidden"
          />
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título da FUC
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Digite o título da FUC"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo da FUC
            </label>
            <input
              type="text"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Digite o tipo da FUC"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Campos</h2>
              <button
                onClick={adicionarCampo}
                className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Campo
              </button>
            </div>

            {campos.map((campo, index) => (
              <div key={campo.id} className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="flex justify-between">
                  <h3 className="font-medium text-gray-700">Campo {index + 1}</h3>
                  <button
                    onClick={() => removerCampo(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título do Campo
                    </label>
                    <input
                      type="text"
                      value={campo.titulo}
                      onChange={(e) => atualizarCampo(index, { titulo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo do Campo
                    </label>
                    <select
                      value={campo.tipo}
                      onChange={(e) => atualizarCampo(index, { tipo: e.target.value as 'texto' | 'numerico' | 'tabela' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="texto">Texto</option>
                      <option value="numerico">Numérico</option>
                      <option value="tabela">Tabela</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={campo.descricao}
                    onChange={(e) => atualizarCampo(index, { descricao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                  />
                </div>

                {campo.tipo === 'texto' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Máximo de Caracteres
                    </label>
                    <input
                      type="number"
                      value={campo.maxCaracteres}
                      onChange={(e) => atualizarCampo(index, { maxCaracteres: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showPreview && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Preview da FUC</h2>
          <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg font-mono text-sm">
            {gerarPreviewFUC()}
          </pre>
        </div>
      )}

      <div className="flex justify-between items-center bg-white rounded-lg shadow p-4">
        <div className="space-x-4">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50"
          >
            {showPreview ? 'Ocultar Preview' : 'Mostrar Preview'}
          </button>
          <button
            onClick={exportarParaTXT}
            className="flex items-center px-4 py-2 text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exportar para TXT
          </button>
        </div>
        <div className="space-x-4">
          <button
            onClick={salvarRascunho}
            className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Rascunho
          </button>
          <button
            onClick={finalizarFUC}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Finalizar FUC
          </button>
        </div>
      </div>
    </div>
  )
}

export default CriarFUC