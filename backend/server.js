const cors = require('cors')
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const Budget = require('./models/Budget')
const app = express();
app.use(express.json());
app.use(cors())

const User = require('./models/User');
const bcrypt = require('bcrypt');

app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });
    res.status(201).json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


app.get('/', (req, res) => {
  res.send('Olá, Meu primeiro server com Express!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/transactions', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.create({ ...req.body, user: req.user.id });
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/transactions', authMiddleware, async (req, res) => {
  const transactions = await Transaction.find({ user: req.user.id });
  res.json(transactions);
});

app.put('/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const updated = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Transação não encontrada' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/transactions/:id', authMiddleware, async (req, res) => {
  const deleted = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!deleted) return res.status(404).json({ error: 'Transação não encontrada' });
  res.status(204).send();
});
app.post('/budgets', authMiddleware, async (req, res) => {
  try {
    const { category, limit } = req.body

    const novoBudget = new Budget({
      user: req.user.id,
      category,
      limit
    })

    await novoBudget.save()
    res.status(201).json(novoBudget)
  } catch (erro) {
    res.status(400).json({ error: 'Erro ao criar orçamento' })
  }
})
app.get('/budgets', authMiddleware, async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.userId })
    res.json(budgets)
  } catch (erro) {
    res.status(400).json({ error: 'Erro ao buscar orçamentos' })
  }
})
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch((err) => console.error('Erro ao conectar:', err));

app.listen(process.env.PORT || 4000, () => console.log('Servidor rodando'));


const jwt = require('jsonwebtoken');

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const senhaCorreta = await bcrypt.compare(password, user.passwordHash);
    if (!senhaCorreta) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  const token = authHeader.split(' ')[1]; // formato: "Bearer xxxxx"
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}