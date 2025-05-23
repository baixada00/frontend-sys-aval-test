import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { FileText, CheckCircle, Save, AlertCircle } from 'lucide-react'

interface FUC {
    title: string
    tipo: string
    created_at: Date
    conteudo: string
}

interface Avaliacao {
    status?: string
    comentario?: string
}

interface Bloco {
    id: string
    titulo: string
    conteudo: string
    tipo: string
    subcampos?: Bloco[]
}

const AvaliacaoFUC = () => {
    const { id } = useParams<{ id: string }>()
    const [fuc, setFuc] = useState<FUC | null>(null)
    const [blocos, setBlocos] = useState<Bloco[]>([])
    const [avaliacoes, setAvaliacoes] = useState<Record<string, Avaliacao>>({})
    const [comentariosVisiveis, setComentariosVisiveis] = useState<Record<string, boolean>>({})
    const [relatoriosSubmetidos, setRelatoriosSubmetidos] = useState<any[]>([])
    const [resumo, setResumo] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [fucResponse, relatoriosResponse] = await Promise.all([
                    axios.get(`https://projeto-estagio-sys-fuc-aval.onrender.com/api/fucs/${id}`),
                    axios.get(`https://projeto-estagio-sys-fuc-aval.onrender.com/api/relatorios/${id}`)
                ])

                const fucEncontrada = fucResponse.data
                if (!fucEncontrada) throw new Error('FUC não encontrada')

                setFuc({
                    title: `FUC ${id}`,
                    tipo: 'Texto',
                    created_at: new Date(),
                    conteudo: fucEncontrada.conteudo,
                })

                const blocosSeparados = dividirBlocos(fucEncontrada.conteudo)
                const blocosAgrupados = agruparBlocos(blocosSeparados)
                setBlocos(blocosAgrupados)
                setRelatoriosSubmetidos(relatoriosResponse.data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id])

    const dividirBlocos = (texto: string): Bloco[] => {
        const linhas = texto.split("\n")
        const blocos: Bloco[] = []
        let tituloAtual = "Introdução"
        let conteudoAtual: string[] = []
        let tipoAtual = 'titulo'

        const regexPrincipal = /^\d+\.(?!\d)/
        const regexSubcampo = /^\d+\.\d+\./

        linhas.forEach((linha) => {
            const matchSub = regexSubcampo.test(linha)
            const matchPrincipal = regexPrincipal.test(linha) && !matchSub

            if (matchPrincipal || matchSub) {
                if (conteudoAtual.length > 0) {
                    blocos.push({
                        id: tituloAtual,
                        titulo: tituloAtual,
                        conteudo: conteudoAtual.join("\n").trim(),
                        tipo: tipoAtual
                    })
                }
                tituloAtual = linha.trim()
                conteudoAtual = []
                tipoAtual = matchSub ? 'campo' : 'possivelmente_titulo'
            } else {
                conteudoAtual.push(linha)
            }
        })

        if (conteudoAtual.length > 0) {
            blocos.push({
                id: tituloAtual,
                titulo: tituloAtual,
                conteudo: conteudoAtual.join("\n").trim(),
                tipo: tipoAtual
            })
        }

        return blocos.map(bloco => {
            if (bloco.tipo === 'possivelmente_titulo') {
                const prefixo = bloco.titulo.match(/^(\d+)\./)?.['1']
                const haSubcampos = blocos.some(b =>
                    b.titulo.startsWith(prefixo + ".") && /^\d+\.\d+\./.test(b.titulo)
                )
                return { ...bloco, tipo: haSubcampos ? 'titulo' : 'campo' }
            }
            return bloco
        })
    }

    const agruparBlocos = (blocos: Bloco[]): Bloco[] => {
        const agrupados: Bloco[] = []
        let grupoAtual: Bloco | null = null

        blocos.forEach((bloco) => {
            if (bloco.tipo === 'titulo') {
                if (grupoAtual) agrupados.push(grupoAtual)
                grupoAtual = { ...bloco, subcampos: [] }
            } else if (grupoAtual) {
                grupoAtual.subcampos?.push(bloco)
            } else {
                agrupados.push(bloco)
            }
        })

        if (grupoAtual) agrupados.push(grupoAtual)
        return agrupados
    }

    const handleChange = (campo: string, tipo: 'status' | 'comentario', valor: string) => {
        setAvaliacoes(prev => ({
            ...prev,
            [campo]: {
                ...prev[campo],
                [tipo]: valor
            }
        }))
    }

    const toggleComentario = (campo: string) => {
        setComentariosVisiveis(prev => ({
            ...prev,
            [campo]: !prev[campo]
        }))
    }

    const handleGravar = async () => {
        const avaliador = prompt("Insira o nome do avaliador:")
        if (!avaliador) return

        try {
            await axios.post('https://projeto-estagio-sys-fuc-aval.onrender.com/api/relatorios', {
                fuc: id,
                avaliador,
                status: "gravado",
                comentario: JSON.stringify(avaliacoes, null, 2),
            })
            alert("Rascunho gravado com sucesso!")
        } catch (error) {
            alert("Erro ao gravar rascunho")
            console.error("Erro ao gravar rascunho:", error)
        }
    }

    const handleSubmit = async () => {
        const avaliador = prompt("Insira o nome do avaliador:")
        if (!avaliador) return

        try {
            await axios.post('https://projeto-estagio-sys-fuc-aval.onrender.com/api/relatorios', {
                fuc: id,
                avaliador,
                status: "submetido",
                comentario: JSON.stringify(avaliacoes, null, 2),
            })
            alert("Avaliação submetida com sucesso!")
        } catch (error) {
            alert("Erro ao submeter avaliação")
            console.error("Erro ao submeter avaliação:", error)
        }
    }

    const handleResumo = () => {
        const avaliacoesArray = Object.entries(avaliacoes).map(([campo, dados]) => ({
            campo,
            ...dados
        }))
        setResumo(avaliacoesArray)
    }

    const renderCampo = (item: Bloco) => (
        <div key={item.id} className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <div className="flex gap-6">
                <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">{item.titulo}</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{item.conteudo}</p>
                </div>

                <div className="w-80 flex flex-col gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={avaliacoes[item.id]?.status || ""}
                            onChange={(e) => handleChange(item.id, "status", e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        >
                            <option value="">Selecione um status</option>
                            <option value="adequado">Adequado</option>
                            <option value="nao_adequado">Não Adequado</option>
                            <option value="incerteza">Incerteza</option>
                        </select>
                    </div>

                    <button
                        onClick={() => toggleComentario(item.id)}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                        {comentariosVisiveis[item.id] ? (
                            <>
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Ocultar Comentário
                            </>
                        ) : (
                            <>
                                <FileText className="w-4 h-4 mr-2" />
                                Adicionar Comentário
                            </>
                        )}
                    </button>

                    {comentariosVisiveis[item.id] && (
                        <textarea
                            rows={3}
                            value={avaliacoes[item.id]?.comentario || ""}
                            onChange={(e) => handleChange(item.id, "comentario", e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                            placeholder="Digite seu comentário aqui..."
                        />
                    )}
                </div>
            </div>
        </div>
    )

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
        </div>
    )

    if (error) return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
            <div className="flex">
                <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            </div>
        </div>
    )

    if (!fuc) return null

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Avaliação da {fuc.title}
                </h1>
                <div className="flex gap-4 text-sm text-gray-500">
                    <p><span className="font-medium">Tipo:</span> {fuc.tipo}</p>
                    <p><span className="font-medium">Data de Criação:</span> {new Date(fuc.created_at).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="space-y-8">
                {blocos.map((bloco, index) => (
                    bloco.tipo === "titulo" ? (
                        <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">{bloco.titulo}</h3>
                            <p className="text-gray-700 whitespace-pre-wrap mb-6">{bloco.conteudo}</p>
                            <div className="space-y-4">
                                {bloco.subcampos?.map(renderCampo)}
                            </div>
                        </div>
                    ) : renderCampo(bloco)
                ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end gap-4">
                    <button
                        onClick={handleResumo}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Gerar Resumo
                    </button>
                    <button
                        onClick={handleGravar}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Gravar Rascunho
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-800 hover:bg-purple-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Submeter Avaliação
                    </button>
                </div>
            </div>

            {resumo.length > 0 && (
                <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Resumo das Avaliações</h2>
                    <div className="space-y-4">
                        {resumo.map((item, idx) => (
                            <div key={idx} className="border-l-4 border-purple-500 pl-4 py-2">
                                <p className="font-medium text-gray-900">{item.campo}</p>
                                <p className="text-gray-700">Status: {item.status || 'Não definido'}</p>
                                {item.comentario && (
                                    <p className="text-gray-600 mt-1">{item.comentario}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default AvaliacaoFUC