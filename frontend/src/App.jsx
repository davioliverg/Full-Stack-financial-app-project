import { useState, useEffect } from 'react'
import './App.css'
const API_URL = import.meta.env.VITE_API_URL

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(valor)
}

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          onLoginSuccess(data.token)
        } else {
          console.log('Erro no login:', data)
        }
      })
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" />
      <button type="submit">Entrar</button>
    </form>
  )
}

function Cadastro({ onCadastroSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })
      .then(res => {
        if (res.ok) {
          onCadastroSuccess()
        } else {
          return res.json().then(data => setErro(data.error || 'Erro ao criar conta'))
        }
      })
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" />
      <button type="submit">Criar conta</button>
      {erro && <p className="erro">{erro}</p>}
    </form>
  )
}

function ListaDeTransacoes({ token, transacoes, setTransacoes }) {
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    if (!token) return
    setCarregando(true)
    fetch(`${API_URL}/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTransacoes(data)
        else console.log('Erro ao buscar transações:', data)
      })
      .finally(() => setCarregando(false))
  }, [token])

  function handleDelete(id) {
    fetch(`${API_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      setTransacoes(anteriores => anteriores.filter(t => t._id !== id))
    })
  }

  function handleUpdate(id, dadosAtualizados) {
    fetch(`${API_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(dadosAtualizados)
    })
      .then(res => res.json())
      .then(atualizada => {
        setTransacoes(anteriores =>
          anteriores.map(t => (t._id === id ? atualizada : t))
        )
      })
  }

  if (carregando) return <p className="mensagem-carregando">Carregando transações...</p>
  if (transacoes.length === 0) return <p className="mensagem-vazia">Nenhuma transação encontrada.</p>

  return (
    <ul className="lista-transacoes">
      {transacoes.map(t => (
        <ItemTransacao
          key={t._id}
          transacao={t}
          onDelete={() => handleDelete(t._id)}
          onUpdate={(dados) => handleUpdate(t._id, dados)}
        />
      ))}
    </ul>
  )
}

function ItemTransacao({ transacao, onDelete, onUpdate }) {
  const [editando, setEditando] = useState(false)
  const [categoria, setCategoria] = useState(transacao.category)
  const [valor, setValor] = useState(transacao.amount)

  function handleSalvar() {
    onUpdate({ category: categoria, amount: Number(valor) })
    setEditando(false)
  }

  if (editando) {
    return (
      <li className="transacao-item editando">
        <input value={categoria} onChange={(e) => setCategoria(e.target.value)} />
        <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
        <div className="acoes">
          <button className="btn-salvar" onClick={handleSalvar}>Salvar</button>
          <button className="btn-cancelar" onClick={() => setEditando(false)}>Cancelar</button>
        </div>
      </li>
    )
  }

  return (
    <li className={`transacao-item ${transacao.type}`}>
      <div className="transacao-info">
        <span className="transacao-categoria">{transacao.category}</span>
        <span className="transacao-valor">
          {transacao.type === 'expense' ? '-' : '+'}{formatarMoeda(Math.abs(transacao.amount))}
        </span>
      </div>
      <div className="acoes">
        <button className="btn-editar" onClick={() => setEditando(true)}>Editar</button>
        <button className="btn-excluir" onClick={onDelete}>Excluir</button>
      </div>
    </li>
  )
}

function NovaTransacao({ token, setTransacoes }) {
  const [tipo, setTipo] = useState('expense')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        type: tipo,
        amount: Number(valor),
        category: categoria,
        date: new Date()
      })
    })
      .then(res => res.json())
      .then(nova => {
        setTransacoes(anteriores => [...anteriores, nova])
        setValor('')
        setCategoria('')
      })
  }

  return (
    <form className="form-inline" onSubmit={handleSubmit}>
      <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
        <option value="expense">Despesa</option>
        <option value="income">Receita</option>
      </select>
      <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor" />
      <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoria" />
      <button type="submit">Adicionar</button>
    </form>
  )
}

function ListaDeOrcamentos({ token, orcamentos, setOrcamentos, transacoes }) {
  useEffect(() => {
    if (!token) return
    fetch(`${API_URL}/budgets`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setOrcamentos(data)
        else console.log('Erro ao buscar orçamentos:', data)
      })
  }, [token])

  if (orcamentos.length === 0) return <p className="mensagem-vazia">Nenhum orçamento definido.</p>

  return (
    <ul className="lista-orcamentos">
      {orcamentos.map(o => {
        const gastos = transacoes.filter(t => t.category === o.category && t.type === 'expense')
        const totalGasto = gastos.reduce((acc, t) => acc + t.amount, 0)
        const percentual = o.limit > 0 ? (totalGasto / o.limit) * 100 : 0
        const estourou = percentual > 100

        return (
          <li key={o._id} className="orcamento-item">
            <div className="orcamento-header">
              <span className="orcamento-categoria">{o.category}</span>
              <span className="orcamento-valores">
                {formatarMoeda(totalGasto)} / {formatarMoeda(o.limit)}
              </span>
            </div>
            <div className="barra-progresso">
              <div
                className={`barra-preenchida ${estourou ? 'estourado' : ''}`}
                style={{ width: `${Math.min(percentual, 100)}%` }}
              ></div>
            </div>
            <span className="orcamento-percentual">{percentual.toFixed(0)}%</span>
          </li>
        )
      })}
    </ul>
  )
}

function NovoOrcamento({ token, setOrcamentos }) {
  const [categoria, setCategoria] = useState('')
  const [limite, setLimite] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    fetch(`${API_URL}/budgets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        category: categoria,
        limit: Number(limite)
      })
    })
      .then(res => res.json())
      .then(novo => {
        setOrcamentos(anteriores => [...anteriores, novo])
        setCategoria('')
        setLimite('')
      })
  }

  return (
    <form className="form-inline" onSubmit={handleSubmit}>
      <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoria" />
      <input type="number" value={limite} onChange={(e) => setLimite(e.target.value)} placeholder="Limite" />
      <button type="submit">Definir orçamento</button>
    </form>
  )
}

function App() {
  const [token, setToken] = useState(null)
  const [mostrarCadastro, setMostrarCadastro] = useState(false)
  const [mensagemCadastro, setMensagemCadastro] = useState('')
  const [transacoes, setTransacoes] = useState([])
  const [orcamentos, setOrcamentos] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [filtroCategoria, setCategoriaFiltro] = useState('')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')

  const receitas = transacoes.filter(t => t.type === 'income')
  const despesas = transacoes.filter(t => t.type === 'expense')
  const totalReceitas = receitas.reduce((acc, t) => acc + t.amount, 0)
  const totalDespesas = despesas.reduce((acc, t) => acc + t.amount, 0)
  const saldo = totalReceitas - totalDespesas

  const transacoesFiltradas = transacoes.filter(t => {
    if (filtro !== 'todos' && t.type !== filtro) return false
    if (filtroCategoria && !t.category.toLowerCase().includes(filtroCategoria.toLowerCase())) return false
    if (filtroDataInicio && new Date(t.date) < new Date(filtroDataInicio)) return false
    if (filtroDataFim && new Date(t.date) > new Date(filtroDataFim)) return false
    return true
  })

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Controle Financeiro</h1>
      </header>

      {!token && (
        <div className="auth-box">
          {mensagemCadastro && <p className="mensagem-sucesso">{mensagemCadastro}</p>}

          {mostrarCadastro ? (
            <>
              <Cadastro
                onCadastroSuccess={() => {
                  setMostrarCadastro(false)
                  setMensagemCadastro('Conta criada! Agora faça login.')
                }}
              />
              <p className="auth-toggle">
                Já tem conta?{' '}
                <button type="button" className="link" onClick={() => setMostrarCadastro(false)}>
                  Entrar
                </button>
              </p>
            </>
          ) : (
            <>
              <Login onLoginSuccess={(t) => setToken(t)} />
              <p className="auth-toggle">
                Não tem conta?{' '}
                <button type="button" className="link" onClick={() => setMostrarCadastro(true)}>
                  Cadastre-se
                </button>
              </p>
            </>
          )}
        </div>
      )}

      {token && (
        <main className="dashboard">
          <section className="resumo-cards">
            <div className="card receita">
              <span className="card-label">Receitas</span>
              <span className="card-valor">{formatarMoeda(totalReceitas)}</span>
            </div>
            <div className="card despesa">
              <span className="card-label">Despesas</span>
              <span className="card-valor">{formatarMoeda(totalDespesas)}</span>
            </div>
            <div className={`card saldo ${saldo >= 0 ? 'positivo' : 'negativo'}`}>
              <span className="card-label">Saldo</span>
              <span className="card-valor">{formatarMoeda(saldo)}</span>
            </div>
          </section>

          <section className="filtros">
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
            </select>
            <input
              type="text"
              value={filtroCategoria}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              placeholder="Filtrar por categoria"
            />
            <input type="date" value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} />
            <input type="date" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} />
          </section>

          <div className="grid-principal">
            <section className="painel">
              <h2>Transações</h2>
              <NovaTransacao token={token} setTransacoes={setTransacoes} />
              <ListaDeTransacoes token={token} transacoes={transacoesFiltradas} setTransacoes={setTransacoes} />
            </section>

            <section className="painel">
              <h2>Orçamentos</h2>
              <NovoOrcamento token={token} setOrcamentos={setOrcamentos} />
              <ListaDeOrcamentos token={token} orcamentos={orcamentos} setOrcamentos={setOrcamentos} transacoes={transacoes} />
            </section>
          </div>
        </main>
      )}
    </div>
  )
}

export default App