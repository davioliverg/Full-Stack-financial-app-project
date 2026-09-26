import { useState, useEffect } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function Transacao({ tipo, valor, categoria }) {
  return (
    <p>{tipo} - {valor} - {categoria}</p>
  )
}
function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(valor)
}

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    fetch('http://localhost:4000/login', {
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
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Entrar</button>
    </form>
  )
}

function ListaDeTransacoes({ token, transacoes, setTransacoes }) {
  const [carregando, setCarregando] = useState(false)
  useEffect(() => {
    if (!token) return
    setCarregando(true)
    fetch('http://localhost:4000/transactions', {
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
    fetch(`http://localhost:4000/transactions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      setTransacoes(anteriores => anteriores.filter(t => t._id !== id))
    })
  }

  function handleUpdate(id, dadosAtualizados) {
    fetch(`http://localhost:4000/transactions/${id}`, {
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

  return (
    <>
      {carregando && <p>Carregando...</p>}
      <ul>
        {transacoes.map(t => (
          <ItemTransacao
            key={t._id}
            transacao={t}
            onDelete={() => handleDelete(t._id)}
            onUpdate={(dados) => handleUpdate(t._id, dados)}
          />
        ))}
      </ul>
    </>
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
      <li>
        <input value={categoria} onChange={(e) => setCategoria(e.target.value)} />
        <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
        <button onClick={handleSalvar}>salvar</button>
      </li>
    )
  }

  return (
    <li>
      {transacao.category} - {transacao.amount}
      <button onClick={() => setEditando(true)}>editar</button>
      <button onClick={onDelete}>excluir</button>
    </li>
  )
}
function NovaTransacao({ token, setTransacoes }) {
  const [tipo, setTipo] = useState('expense')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    fetch('http://localhost:4000/transactions', {
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
    <form onSubmit={handleSubmit}>
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
    fetch('http://localhost:4000/budgets', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setOrcamentos(data)
        else console.log('Erro ao buscar orçamentos:', data)
      })
  }, [token])

  return (
    <ul>
      {orcamentos.map(o => {
        const gastos = transacoes.filter(t => t.category === o.category && t.type === 'expense')
        const totalGasto = gastos.reduce((acc, t) => acc + t.amount, 0)
        const percentual = (totalGasto / o.limit) * 100

        return (
          <li key={o._id}>
            {o.category}: {formatarMoeda(totalGasto)} / {formatarMoeda(o.limit)} ({percentual.toFixed(0)}%)
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
    fetch('http://localhost:4000/budgets', {
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
    <form onSubmit={handleSubmit}>
      <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoria" />
      <input type="number" value={limite} onChange={(e) => setLimite(e.target.value)} placeholder="Limite" />
      <button type="submit">Criar orçamento</button>
    </form>
  )
}

function App() {
  const [token, setToken] = useState(null)
  const [transacoes, setTransacoes] = useState([])
  const [orcamentos, setOrcamentos] = useState([])
  const [count, setCount] = useState(0)
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
    <>
      <Login onLoginSuccess={(t) => setToken(t)} />
      <div>
        <p>Receitas: {formatarMoeda(totalReceitas)}</p>
        <p>Despesas: {formatarMoeda(totalDespesas)}</p>
        <p>Saldo: {formatarMoeda(saldo)}</p>

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
      </div>
      <section id="center">
        <div className="hero">
          {token && <NovaTransacao token={token} setTransacoes={setTransacoes} />}
          {token && <NovoOrcamento token={token} setOrcamentos={setOrcamentos} />}
          <ListaDeTransacoes token={token} transacoes={transacoesFiltradas} setTransacoes={setTransacoes} />
          <ListaDeOrcamentos token={token} orcamentos={orcamentos} setOrcamentos={setOrcamentos} transacoes={transacoes} />

          <Transacao tipo="expense" valor="-30" categoria="transporte" />
          <Transacao tipo="income" valor="1000" categoria="salário" />
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
        <button onClick={() => setCount(count - 1)}>
          decrementar
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App