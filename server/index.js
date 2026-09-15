import 'dotenv/config'
import bcrypt from 'bcryptjs'
import express from 'express'
import jwt from 'jsonwebtoken'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const port = process.env.PORT || 3001
const secret = process.env.JWT_SECRET || 'development-secret-change-before-deployment'
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production.')
}
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDirectory = join(root, 'data')
const storePath = join(dataDirectory, 'store.json')

// Deployments may not include the ignored JSON store, so create its directory on startup.
mkdirSync(dataDirectory, { recursive: true })

app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// The JSON store keeps this small app easy to run locally. Use a database for production scale.
function readStore() {
  if (!existsSync(storePath)) return { users: [] }
  try {
    return JSON.parse(readFileSync(storePath, 'utf8'))
  } catch {
    return { users: [] }
  }
}
function saveStore(store) { writeFileSync(storePath, JSON.stringify(store, null, 2)) }
function publicUser(user) { return { id: user.id, name: user.name, email: user.email } }
function makeToken(user) { return jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' }) }
function readCookie(req, name) {
  const cookies = req.headers.cookie?.split(';').map((item) => item.trim()) || []
  const cookie = cookies.find((item) => item.startsWith(`${name}=`))
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null
}
function setSessionCookie(res, token, rememberMe) {
  const attributes = ['papi_session=' + encodeURIComponent(token), 'HttpOnly', 'SameSite=Lax', 'Path=/']
  if (rememberMe) attributes.push('Max-Age=604800')
  if (process.env.NODE_ENV === 'production') attributes.push('Secure')
  res.setHeader('Set-Cookie', attributes.join('; '))
}
function clearSessionCookie(res) {
  const attributes = ['papi_session=', 'Max-Age=0', 'HttpOnly', 'SameSite=Lax', 'Path=/']
  if (process.env.NODE_ENV === 'production') attributes.push('Secure')
  res.setHeader('Set-Cookie', attributes.join('; '))
}

// Authentication middleware attaches the verified account id to protected requests.
function requireAuth(req, res, next) {
  const token = readCookie(req, 'papi_session')
  try { req.userId = jwt.verify(token, secret).userId; next() } catch { res.status(401).json({ message: 'Please log in again.' }) }
}

function findUser(store, userId) {
  return store.users.find((item) => item.id === userId)
}

function cleanTask(input, fallback = {}) {
  return {
    id: input.id || fallback.id || crypto.randomUUID(),
    text: String(input.text || '').trim(),
    priority: ['High', 'Medium', 'Low'].includes(input.priority) ? input.priority : 'Medium',
    category: String(input.category || 'Personal').trim() || 'Personal',
    dueDate: typeof input.dueDate === 'string' ? input.dueDate : '',
    completed: Boolean(input.completed)
  }
}

// Public account creation and login endpoints.
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, rememberMe } = req.body
  const cleanName = name?.trim() || 'Penguin pal'
  const cleanEmail = email?.trim().toLowerCase()
  if (!cleanEmail || !password || password.length < 6) return res.status(400).json({ message: 'Enter a valid email and password of at least 6 characters.' })

  const store = readStore()
  const existingUser = store.users.find((item) => item.email === cleanEmail)

  if (existingUser) {
    return res.status(409).json({ message: 'This email already has an account. Try logging in instead.' })
  }

  const user = {
    id: crypto.randomUUID(),
    name: cleanName,
    email: cleanEmail,
    passwordHash: await bcrypt.hash(password, 12),
    tasks: [],
    routine: []
  }

  store.users.push(user)
  saveStore(store)
  setSessionCookie(res, makeToken(user), rememberMe)
  res.status(201).json({ user: publicUser(user) })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password, rememberMe } = req.body
  const cleanEmail = email?.trim().toLowerCase()
  if (!cleanEmail || !password || password.length < 6) return res.status(400).json({ message: 'Enter a valid email and password of at least 6 characters.' })

  const store = readStore()
  const user = store.users.find((item) => item.email === cleanEmail)

  if (!user) return res.status(401).json({ message: 'Email or password is incorrect.' })
  if (!(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect.' })

  setSessionCookie(res, makeToken(user), rememberMe)
  res.json({ user: publicUser(user) })
})

app.post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res)
  res.status(204).end()
})

// REST task resources. Every route is scoped to the authenticated account.
app.get('/api/tasks', requireAuth, (req, res) => {
  const user = findUser(readStore(), req.userId)
  if (!user) return res.status(404).json({ message: 'Account not found.' })
  res.json({ tasks: user.tasks || [] })
})

app.post('/api/tasks', requireAuth, (req, res) => {
  const store = readStore()
  const user = findUser(store, req.userId)
  if (!user) return res.status(404).json({ message: 'Account not found.' })

  const task = cleanTask(req.body)
  if (!task.text) return res.status(400).json({ message: 'Task text is required.' })
  user.tasks = [...(user.tasks || []), task]
  saveStore(store)
  res.status(201).json({ task })
})

app.put('/api/tasks/:taskId', requireAuth, (req, res) => {
  const store = readStore()
  const user = findUser(store, req.userId)
  if (!user) return res.status(404).json({ message: 'Account not found.' })

  const taskIndex = (user.tasks || []).findIndex((item) => item.id === req.params.taskId)
  if (taskIndex === -1) return res.status(404).json({ message: 'Task not found.' })

  const task = cleanTask({ ...user.tasks[taskIndex], ...req.body, id: req.params.taskId })
  if (!task.text) return res.status(400).json({ message: 'Task text is required.' })
  user.tasks[taskIndex] = task
  saveStore(store)
  res.json({ task })
})

app.delete('/api/tasks/:taskId', requireAuth, (req, res) => {
  const store = readStore()
  const user = findUser(store, req.userId)
  if (!user) return res.status(404).json({ message: 'Account not found.' })

  const previousLength = (user.tasks || []).length
  user.tasks = (user.tasks || []).filter((item) => item.id !== req.params.taskId)
  if (user.tasks.length === previousLength) return res.status(404).json({ message: 'Task not found.' })
  saveStore(store)
  res.status(204).end()
})

// Return the current account snapshot used to hydrate the React app.
app.get('/api/me', requireAuth, (req, res) => {
  const user = findUser(readStore(), req.userId)
  if (!user) return res.status(404).json({ message: 'Account not found.' })
  res.json({ user: publicUser(user), tasks: user.tasks, routine: user.routine })
})

// Persist task and routine changes for the authenticated user.
app.put('/api/data', requireAuth, (req, res) => {
  const store = readStore(); const user = findUser(store, req.userId)
  if (!user) return res.status(404).json({ message: 'Account not found.' })
  user.tasks = Array.isArray(req.body.tasks) ? req.body.tasks : user.tasks
  user.routine = Array.isArray(req.body.routine) ? req.body.routine : user.routine
  saveStore(store); res.json({ tasks: user.tasks, routine: user.routine })
})

app.use(express.static(join(root, 'dist')))
app.get(/.*/, (_req, res) => res.sendFile(join(root, 'dist', 'index.html')))
app.listen(port, () => console.log(`Papi Penguin is running on http://localhost:${port}`))
