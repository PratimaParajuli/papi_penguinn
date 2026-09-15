import { useEffect, useMemo, useState } from 'react'

const routineSeed = [
  { id: 'morning', title: 'Review yesterday notes', time: '07:00', minutes: 30, category: 'Study', done: false },
  { id: 'focus', title: 'Deep-focus study session', time: '10:00', minutes: 90, category: 'Study', done: false },
  { id: 'practice', title: 'Practice questions', time: '16:00', minutes: 60, category: 'Study', done: false },
  { id: 'recap', title: 'Daily recap and plan tomorrow', time: '20:00', minutes: 20, category: 'Planning', done: false }
]

const defaultTasks = [
  { id: 'task-1', text: 'Finish chemistry recap', priority: 'High', category: 'Study', dueDate: '', completed: false },
  { id: 'task-2', text: 'Reply to mentor message', priority: 'Medium', category: 'Work', dueDate: '', completed: false },
  { id: 'task-3', text: 'Stretch and hydrate', priority: 'Low', category: 'Wellness', dueDate: '', completed: true }
]

const taskCategories = ['Study', 'Work', 'Personal', 'Wellness', 'Planning']
const priorityOrder = { High: 3, Medium: 2, Low: 1 }
const celebrationMessages = [
  'Amazing work! You earned a happy penguin dance.',
  'Task complete! Papi is proud of your momentum.',
  'You did it! Your penguin is celebrating with confetti.',
  'Nice job! Small wins are building big success.',
  'That was a strong finish. Your focus is shining.',
  'Power move! You just turned effort into progress.',
  'You kept your promise to yourself. That matters.',
  'Excellent! Papi sees your consistency and loves it.',
  'Way to go! One more win for your future self.',
  'Beautiful work. Your discipline is getting stronger.',
  'That task is done, and your momentum is still growing.',
  'You are doing awesome. Keep that energy rolling.',
  'Victory unlocked! Your calm focus is paying off.',
  'Brilliant finish. Progress like this creates magic.',
  'So proud of you. You handled that with real focus.'
]
const pad = (v) => String(v).padStart(2, '0')
const clock = (seconds) => `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`
const formatDateKey = (date) => {
  const current = new Date(date)
  return `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`
}
const formatMonthKey = (date) => {
  const current = new Date(date)
  return `${current.getFullYear()}-${pad(current.getMonth() + 1)}`
}
const formatYearKey = (date) => String(new Date(date).getFullYear())

// Analytics history is intentionally local to this browser. Account tasks and routines are stored by the API.
function readAnalyticsHistory() {
  try {
    const raw = localStorage.getItem('papi-productivity-history')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function SelectMenu({ value, onChange, options, className = '', ariaLabel }) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => String(option.value) === String(value)) || options[0]

  useEffect(() => {
    function closeMenu(event) {
      if (!event.target.closest('.select-menu')) setOpen(false)
    }

    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [])

  return (
    <div className={`select-menu ${open ? 'select-menu--open' : ''} ${className}`}>
      <button
        type="button"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label}</span>
        <span className="select-chevron" aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="select-options" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={String(option.value) === String(value)}
              className={String(option.value) === String(value) ? 'select-option active' : 'select-option'}
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              <span>{option.label}</span>
              {String(option.value) === String(value) && <span aria-hidden="true">🐧</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Shared calendar used by Progress filters and task due dates.
function CalendarMenu({ value, view, onChange, className = '', emptyLabel = 'Choose a date' }) {
  const [open, setOpen] = useState(false)
  const hasValue = Boolean(value)
  const selectedDate = hasValue ? new Date(`${value}T00:00:00`) : new Date()
  const todayKey = formatDateKey(new Date())
  const [displayMonth, setDisplayMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  const monthLabel = selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const monthNames = Array.from({ length: 12 }, (_, index) => new Date(2000, index, 1).toLocaleDateString(undefined, { month: 'short' }))
  const firstDay = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1).getDay()
  const daysInMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate()
  const calendarDays = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]

  useEffect(() => {
    function closeCalendar(event) {
      if (!event.target.closest('.calendar-menu')) setOpen(false)
    }

    document.addEventListener('click', closeCalendar)
    return () => document.removeEventListener('click', closeCalendar)
  }, [])

  function selectDay(day) {
    const next = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day)
    onChange(formatDateKey(next))
    setOpen(false)
  }

  function selectMonth(month) {
    const next = new Date(selectedDate.getFullYear(), month, 1)
    onChange(formatDateKey(next))
    setOpen(false)
  }

  return (
    <div className={`calendar-menu ${className} ${open ? 'calendar-menu--open' : ''}`}>
      <button type="button" className="calendar-trigger" onClick={() => setOpen((current) => !current)} aria-haspopup="dialog" aria-expanded={open}>
        <span>🗓️ {hasValue ? (view === 'month' ? monthLabel : selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })) : emptyLabel}</span>
        <span className="select-chevron" aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="calendar-popover" role="dialog" aria-label="Choose progress date">
          {view === 'month' ? (
            <div className="month-picker">
              <strong>{selectedDate.getFullYear()}</strong>
              <div className="month-grid">
                {monthNames.map((month, index) => (
                  <button type="button" className={index === selectedDate.getMonth() ? 'calendar-choice active' : 'calendar-choice'} key={month} onClick={() => selectMonth(index)}>{month}</button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="calendar-heading">
                <button type="button" className="calendar-nav" onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))} aria-label="Previous month">‹</button>
                <strong>{displayMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong>
                <button type="button" className="calendar-nav" onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))} aria-label="Next month">›</button>
              </div>
              <div className="calendar-weekdays">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
              <div className="calendar-grid">
                {calendarDays.map((day, index) => day ? (
                  <button type="button" key={day} className={formatDateKey(new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day)) === todayKey ? 'calendar-day today' : hasValue && day === selectedDate.getDate() && displayMonth.getMonth() === selectedDate.getMonth() && displayMonth.getFullYear() === selectedDate.getFullYear() ? 'calendar-day active' : 'calendar-day'} onClick={() => selectDay(day)}>{day}</button>
                ) : <span key={`empty-${index}`} />)}
              </div>
            </>
          )}
          {hasValue && <button type="button" className="calendar-clear" onClick={() => { onChange(''); setOpen(false) }}>Clear date</button>}
        </div>
      )}
    </div>
  )
}

function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: '',
    email: localStorage.getItem('papi-remembered-email') || '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [rememberMe, setRememberMe] = useState(Boolean(localStorage.getItem('papi-remembered-email')))

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register' && form.password !== form.confirmPassword) {
        throw new Error('Passwords do not match. Please retype them to continue.')
      }

      const payload = mode === 'login'
        ? { email: form.email, password: form.password, rememberMe }
        : { name: form.name, email: form.email, password: form.password, rememberMe }

      const res = await fetch(`/api/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const friendly = {
          401: 'That email or password does not match. Please try again.',
          409: 'This email already has an account. Try logging in instead.',
          400: 'Please fill in every box. Your password needs at least 6 characters.'
        }
        throw new Error(friendly[res.status] || data.message || 'Something went wrong. Please try again.')
      }

      if (rememberMe) {
        localStorage.setItem('papi-remembered-email', form.email)
      } else {
        localStorage.removeItem('papi-remembered-email')
      }

      onLogin(data, rememberMe)
    } catch (err) {
      setError(err instanceof TypeError ? 'Papi cannot reach the account server right now. Please restart the API server and try again.' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="stars">✦ · ✧ · ✦</div>

      <div className="landing-shell">
        <section className="landing-copy">
          <div className="brand-pill">
            <span>🐧</span>
            Papi Penguin
          </div>

          <p className="eyebrow">Built for calmer, smarter days</p>
          <h2>Turn your goals into gentle daily wins.</h2>
          <p className="landing-text">
            Plan tasks, protect focus time, build routines, and celebrate every small step with a productivity system that feels personal and encouraging.
          </p>

          <div className="trust-row">
            <span>✔ Daily planning</span>
            <span>✔ Focus timer</span>
            <span>✔ Habit tracking</span>
          </div>

          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-icon">📝</span>
              <div>
                <strong>Smart task flow</strong>
                <small>Organize work, study, and personal goals in one place.</small>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⏱️</span>
              <div>
                <strong>Deep focus mode</strong>
                <small>Use a clean timer that helps you stay in the zone.</small>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🌱</span>
              <div>
                <strong>Habit momentum</strong>
                <small>Build routines you can actually keep and feel proud of.</small>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="mascot"><span>💗</span>🐧</div>
          <p className="eyebrow">Your cozy productivity buddy</p>
          <h1>Papi Penguin</h1>
          <p className="auth-intro">Plan softly. Focus deeply. Celebrate every little win.</p>

          <div className="auth-tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Log in</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'register' && (
              <input
                required
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            )}

            <input
              required
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <div className="password-field">
              <input
                required
                minLength="6"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password (6+ characters)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {mode === 'register' && (
              <div className="password-field">
                <input
                  required
                  minLength="6"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirm((visible) => !visible)}
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? 'Hide' : 'Show'}
                </button>
              </div>
            )}

            <label className="remember-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe((value) => !value)}
              />
              <span>Remember me</span>
            </label>

            {error && <p className="form-error">{error}</p>}

            <button className="primary-button" disabled={loading}>
              {loading ? 'Just a moment...' : mode === 'login' ? 'Enter my nest' : 'Meet Papi'}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? 'New here?' : 'Already have an account?'}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Create one' : 'Log in'}
            </button>
          </p>
        </section>
      </div>
    </main>
  )
}

function readStoredSession() {
  const localSession = localStorage.getItem('papi-session')
  const browserSession = sessionStorage.getItem('papi-session')

  try {
    if (localSession) return JSON.parse(localSession)
    if (browserSession) return JSON.parse(browserSession)
  } catch {
    return null
  }

  return null
}

function clearStoredSession() {
  localStorage.removeItem('papi-session')
  sessionStorage.removeItem('papi-session')
}

export default function App() {
  const [session, setSession] = useState(readStoredSession)

  const [tasks, setTasks] = useState(defaultTasks)
  const [routine, setRoutine] = useState(routineSeed)
  const [page, setPage] = useState('home')
  const [theme, setTheme] = useState(() => localStorage.getItem('papi-theme') || 'light')

  // Task and routine state mirrors the authenticated user's data from the API.
  const [taskForm, setTaskForm] = useState({ text: '', category: 'Study', priority: 'Medium', dueDate: '' })
  const [taskFilter, setTaskFilter] = useState('All')
  const [taskSearch, setTaskSearch] = useState('')
  const [taskEditId, setTaskEditId] = useState(null)

  const [routineForm, setRoutineForm] = useState({ title: '', time: '09:00', minutes: 30, category: 'Study' })
  const [routineEditId, setRoutineEditId] = useState(null)

  // Focus timer state is session-local; completed focus sessions are added to analytics history.
  const [focusPreset, setFocusPreset] = useState(25)
  const [breakPreset, setBreakPreset] = useState(5)
  const [timerMode, setTimerMode] = useState('focus')
  const [timer, setTimer] = useState(25 * 60)
  const [timerOn, setTimerOn] = useState(false)
  const [watch, setWatch] = useState(0)
  const [watchOn, setWatchOn] = useState(false)
  const [focusTotal, setFocusTotal] = useState(() => Number(localStorage.getItem('papi-focus-total') || '0'))
  const [celebration, setCelebration] = useState(null)
  const [progressView, setProgressView] = useState('day')
  const [selectedProgressDate, setSelectedProgressDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [history, setHistory] = useState(() => readAnalyticsHistory())

  const today = useMemo(() => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }), [])

  function recordProgress(type, label, sourceId, value = 1) {
    const now = new Date()
    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      type,
      label,
      sourceId,
      value,
      createdAt: now.toISOString(),
      dateKey: formatDateKey(now),
      monthKey: formatMonthKey(now),
      yearKey: formatYearKey(now)
    }

    setHistory((current) => [...current, entry])
  }

  function removeProgress(type, sourceId) {
    setHistory((current) => current.filter((entry) => !(entry.type === type && entry.sourceId === sourceId)))
  }

  useEffect(() => {
    localStorage.setItem('papi-productivity-history', JSON.stringify(history))
  }, [history])

  function triggerCelebration(taskText) {
    const randomMessage = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]
    setCelebration({
      text: taskText,
      message: randomMessage,
      burst: Array.from({ length: 12 }, (_, index) => ({
        left: `${(index * 9 + 10) % 100}%`,
        delay: `${(index % 4) * 0.18}s`,
        color: ['#ffd166', '#f7a8c8', '#7ad7ff', '#7ae0b3', '#d4a7ff'][index % 5]
      }))
    })
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('papi-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!session) return

    fetch('/api/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const nextTasks = Array.isArray(data.tasks) && data.tasks.length ? data.tasks : defaultTasks
        const nextRoutine = Array.isArray(data.routine) && data.routine.length ? data.routine : routineSeed
        setTasks(nextTasks)
        setRoutine(nextRoutine)
      })
      .catch(() => {
        clearStoredSession()
        setSession(null)
      })
  }, [session])

  useEffect(() => {
    localStorage.setItem('papi-focus-total', String(focusTotal))
  }, [focusTotal])

  useEffect(() => {
    if (!timerOn) return

    const id = setInterval(() => {
      setTimer((value) => {
        if (value <= 1) {
          setTimerOn(false)

          if (timerMode === 'focus') {
            const nextTotal = focusTotal + focusPreset
            setFocusTotal(nextTotal)
            recordProgress('focus', 'Focus sprint', `focus-${Date.now()}`, focusPreset)
            triggerCelebration(`${focusPreset}-minute focus sprint`)
            setTimerMode('break')
            return breakPreset * 60
          }

          triggerCelebration('Beautiful break complete')
          setTimerMode('focus')
          return focusPreset * 60
        }

        return value - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [timerOn, timerMode, focusPreset, breakPreset, focusTotal])

  useEffect(() => {
    if (!timerOn) {
      setTimer(timerMode === 'focus' ? focusPreset * 60 : breakPreset * 60)
    }
  }, [focusPreset, breakPreset, timerMode, timerOn])

  useEffect(() => {
    if (!watchOn) return
    const id = setInterval(() => setWatch((v) => v + 1), 1000)
    return () => clearInterval(id)
  }, [watchOn])

  // Keep the UI responsive and then persist the same snapshot to the logged-in account.
  function persist(nextTasks, nextRoutine) {
    setTasks(nextTasks)
    setRoutine(nextRoutine)

    if (session?.token) {
      fetch('/api/data', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ tasks: nextTasks, routine: nextRoutine })
      })
    }
  }

  function taskRequest(path, method, body) {
    return fetch(`/api/tasks${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined
    })
  }

  function toggleTaskComplete(task) {
    const nextTaskState = !task.completed
    const nextTasks = tasks.map((item) => item.id === task.id ? { ...item, completed: nextTaskState } : item)
    setTasks(nextTasks)
    taskRequest(`/${task.id}`, 'PUT', { completed: nextTaskState }).catch(() => setTasks(tasks))

    if (nextTaskState) {
      recordProgress('task', task.text, task.id, 1)
      triggerCelebration(task.text)
    } else {
      removeProgress('task', task.id)
    }
  }

  function toggleRoutineComplete(item) {
    const nextDoneState = !item.done
    const nextRoutine = routine.map((entry) => entry.id === item.id ? { ...entry, done: nextDoneState } : entry)
    persist(tasks, nextRoutine)

    if (nextDoneState) {
      recordProgress('routine', item.title, item.id, item.minutes || 1)
      triggerCelebration(item.title)
    } else {
      removeProgress('routine', item.id)
    }
  }

  function handleTaskSubmit(e) {
    e.preventDefault()
    const text = taskForm.text.trim()
    if (!text) return

    if (taskEditId) {
      const updated = tasks.map((task) =>
        task.id === taskEditId
          ? { ...task, text, category: taskForm.category, priority: taskForm.priority, dueDate: taskForm.dueDate }
          : task
      )
      setTasks(updated)
      taskRequest(`/${taskEditId}`, 'PUT', updated.find((task) => task.id === taskEditId)).catch(() => setTasks(tasks))
      setTaskEditId(null)
    } else {
      const nextTask = {
        id: crypto.randomUUID(),
        text,
        category: taskForm.category,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate,
        completed: false
      }
      setTasks([...tasks, nextTask])
      taskRequest('', 'POST', nextTask).catch(() => setTasks(tasks))
    }

    setTaskForm({ text: '', category: 'Study', priority: 'Medium', dueDate: '' })
  }

  function handleRoutineSubmit(e) {
    e.preventDefault()
    const title = routineForm.title.trim()
    if (!title) return

    if (routineEditId) {
      const updated = routine.map((item) =>
        item.id === routineEditId
          ? { ...item, title, time: routineForm.time, minutes: Number(routineForm.minutes) || 30, category: routineForm.category }
          : item
      )
      persist(tasks, updated)
      setRoutineEditId(null)
    } else {
      const item = {
        id: crypto.randomUUID(),
        title,
        time: routineForm.time,
        minutes: Number(routineForm.minutes) || 30,
        category: routineForm.category,
        done: false
      }
      persist(tasks, [...routine, item])
    }

    setRoutineForm({ title: '', time: '09:00', minutes: 30, category: 'Study' })
  }

  function startTaskEdit(task) {
    setTaskEditId(task.id)
    setTaskForm({
      text: task.text,
      category: task.category || 'Study',
      priority: task.priority || 'Medium',
      dueDate: task.dueDate || ''
    })
    setPage('tasks')
  }

  function startRoutineEdit(item) {
    setRoutineEditId(item.id)
    setRoutineForm({
      title: item.title,
      time: item.time || '09:00',
      minutes: item.minutes || 30,
      category: item.category || 'Study'
    })
    setPage('routine')
  }

  const filteredTasks = [...tasks]
    .filter((task) => {
      const matchesFilter = taskFilter === 'All' || task.priority === taskFilter
      const matchesSearch = !taskSearch || task.text.toLowerCase().includes(taskSearch.toLowerCase())
      return matchesFilter && matchesSearch
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed)
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
      if (priorityDiff) return priorityDiff
      return (a.dueDate || '').localeCompare(b.dueDate || '')
    })

  const completedTasks = tasks.filter((task) => task.completed).length
  const routineDone = routine.filter((item) => item.done).length
  const routineProgress = routine.length ? Math.round((routineDone / routine.length) * 100) : 0
  const upcomingTasks = [...tasks].filter((task) => !task.completed).sort((a, b) => {
    const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    return aDate - bDate
  })

  const nextRoutine = routine.find((item) => !item.done) || routine[0] || null

  const selectedViewDate = useMemo(() => new Date(`${selectedProgressDate}T00:00:00`), [selectedProgressDate])

  const rangeEntries = useMemo(() => {
    const selected = selectedViewDate

    return history.filter((entry) => {
      if (progressView === 'day') {
        return entry.dateKey === formatDateKey(selected)
      }

      if (progressView === 'month') {
        return entry.monthKey === formatMonthKey(selected)
      }

      return entry.yearKey === formatYearKey(selected)
    })
  }, [history, progressView, selectedViewDate])

  const rangeSummary = useMemo(() => {
    const tasksCompleted = rangeEntries.filter((entry) => entry.type === 'task').length
    const routinesCompleted = rangeEntries.filter((entry) => entry.type === 'routine').length
    const focusMinutes = rangeEntries.filter((entry) => entry.type === 'focus').reduce((sum, entry) => sum + Number(entry.value || 0), 0)
    const totalScore = tasksCompleted * 15 + routinesCompleted * 20 + focusMinutes

    return {
      tasksCompleted,
      routinesCompleted,
      focusMinutes,
      totalScore
    }
  }, [rangeEntries])

  const progressTrend = useMemo(() => {
    if (progressView === 'day') {
      const start = new Date(selectedViewDate)
      start.setDate(start.getDate() - 6)

      return Array.from({ length: 7 }, (_, index) => {
        const day = new Date(start)
        day.setDate(start.getDate() + index)
        const key = formatDateKey(day)
        const value = history
          .filter((entry) => entry.dateKey === key)
          .reduce((sum, entry) => sum + Number(entry.value || 0), 0)

        return {
          label: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          value,
          key
        }
      })
    }

    if (progressView === 'month') {
      const start = new Date(selectedViewDate.getFullYear(), selectedViewDate.getMonth() - 5, 1)

      return Array.from({ length: 6 }, (_, index) => {
        const month = new Date(start.getFullYear(), start.getMonth() + index, 1)
        const key = formatMonthKey(month)
        const value = history
          .filter((entry) => entry.monthKey === key)
          .reduce((sum, entry) => sum + Number(entry.value || 0), 0)

        return {
          label: month.toLocaleDateString(undefined, { month: 'short' }),
          value,
          key
        }
      })
    }

    const startYear = selectedViewDate.getFullYear() - 4
    return Array.from({ length: 5 }, (_, index) => {
      const year = startYear + index
      const value = history
        .filter((entry) => entry.yearKey === String(year))
        .reduce((sum, entry) => sum + Number(entry.value || 0), 0)

      return {
        label: String(year),
        value,
        key: String(year)
      }
    })
  }, [history, progressView, selectedViewDate])

  const maxTrendValue = Math.max(...progressTrend.map((item) => item.value), 1)

  const recentProgress = [...rangeEntries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)

  if (!session) {
    return <Login onLogin={(data, rememberMe) => {
      const payload = JSON.stringify(data)

      if (rememberMe) {
        localStorage.setItem('papi-session', payload)
        sessionStorage.removeItem('papi-session')
      } else {
        sessionStorage.setItem('papi-session', payload)
        localStorage.removeItem('papi-session')
      }

      setSession(data)
    }} />
  }

  return (
    <main className="app-shell">
      {celebration && (
        <div className="celebration-overlay" aria-live="polite">
          <div className="celebration-burst" aria-hidden="true">
            {celebration.burst.map((item, index) => (
              <span
                key={index}
                className="confetti"
                style={{ left: item.left, animationDelay: item.delay, background: item.color }}
              />
            ))}
          </div>
          <div className="celebration-card">
            <button type="button" className="celebration-close" onClick={() => setCelebration(null)} aria-label="Close motivation pop-up">×</button>
            <div className="celebration-penguin">🐧</div>
            <div className="celebration-badge">Task complete</div>
            <p className="celebration-task">“{celebration.text}”</p>
            <strong>{celebration.message}</strong>
          </div>
        </div>
      )}

      <div className="floating-penguin" aria-label="Papi Penguin mascot">🐧</div>

      <header className="topbar">
        <div className="brand">
          <span className="brand-penguin">🐧</span>
          <div>
            <h1>Papi Penguin</h1>
            <p>your cozy focus companion</p>
          </div>
        </div>

        <nav aria-label="Main navigation">
          <button className={page === 'home' ? 'nav-button active' : 'nav-button'} onClick={() => setPage('home')}>Home</button>
          <button className={page === 'progress' ? 'nav-button active' : 'nav-button'} onClick={() => setPage('progress')}>Progress</button>
          <button className={page === 'tasks' ? 'nav-button active' : 'nav-button'} onClick={() => setPage('tasks')}>Tasks</button>
          <button className={page === 'focus' ? 'nav-button active' : 'nav-button'} onClick={() => setPage('focus')}>Focus</button>
          <button className={page === 'routine' ? 'nav-button active' : 'nav-button'} onClick={() => setPage('routine')}>Routine</button>
        </nav>

        <div className="profile">
          <span>Hi, {session.user.name}</span>
          <button className="theme-toggle" onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
            clearStoredSession()
            setSession(null)
          }}>Log out</button>
        </div>
      </header>

      <div className="page-shell">
        {page === 'home' && (
          <>
            <section className="hero" id="dashboard">
              <div>
                <p className="eyebrow">{today}</p>
                <h2>Small steps make <em>big</em> days.</h2>
                <p>Papi is here to help you keep your tasks, focus time, and study routine in one happy place.</p>
              </div>
              <div className="hero-penguin"><span>💗</span>🐧</div>
            </section>

            <section className="stats">
              <div><span>Tasks complete</span><strong>{completedTasks}<small> / {tasks.length}</small></strong></div>
              <div><span>Routine progress</span><strong>{routineProgress}<small>%</small></strong></div>
              <div><span>Focus time</span><strong>{Math.floor(focusTotal / 60)}<small> min</small></strong></div>
            </section>

            <section className="home-grid">
              <article className="panel home-panel">
                <div className="panel-title">
                  <div>
                    <p className="eyebrow">Your priorities</p>
                    <h2>Today's top tasks</h2>
                  </div>
                </div>
                <ul className="mini-list">
                  {upcomingTasks.length === 0 ? (
                    <li className="mini-empty">No tasks left. Nice work.</li>
                  ) : (
                    upcomingTasks.slice(0, 4).map((task) => (
                      <li key={task.id} className="mini-item">
                        <span className={`priority priority--${task.priority.toLowerCase()}`}>{task.priority}</span>
                        <div>
                          <strong>{task.text}</strong>
                          <small>{task.category}{task.dueDate ? ` • ${task.dueDate}` : ''}</small>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </article>

              <article className="panel home-panel">
                <div className="panel-title">
                  <div>
                    <p className="eyebrow">Momentum</p>
                    <h2>Routine spotlight</h2>
                  </div>
                </div>
                <div className="spotlight-box">
                  {nextRoutine ? (
                    <>
                      <strong>{nextRoutine.title}</strong>
                      <span>{nextRoutine.time} • {nextRoutine.minutes} min</span>
                      <em>{nextRoutine.category}</em>
                    </>
                  ) : (
                    <p className="mini-empty">Your routine is all clear today.</p>
                  )}
                </div>
              </article>
            </section>
          </>
        )}

        {page === 'progress' && (
          <section className="page-panel progress-layout">
            <article className="panel progress-panel">
              <div className="panel-title">
                <div className="title-with-penguin">
                  <span className="mini-penguin" aria-hidden="true">🐧</span>
                  <div>
                    <p className="eyebrow">Progress tracker</p>
                    <h2>Productivity overview</h2>
                  </div>
                </div>
                <div className="progress-view-wrap">
                  <SelectMenu
                    value={progressView}
                    onChange={setProgressView}
                    ariaLabel="Progress view"
                    options={[{ value: 'day', label: 'Day view' }, { value: 'month', label: 'Month view' }, { value: 'year', label: 'Year view' }]}
                  />
                  {progressView === 'year' ? (
                    <input
                      type="number"
                      value={selectedViewDate.getFullYear()}
                      onChange={(e) => {
                        const nextYear = Number(e.target.value) || new Date().getFullYear()
                        const nextDate = new Date(selectedViewDate)
                        nextDate.setFullYear(nextYear)
                        setSelectedProgressDate(formatDateKey(nextDate))
                      }}
                      min="2020"
                      max="2100"
                    />
                  ) : (
                    <CalendarMenu value={selectedProgressDate} view={progressView} onChange={setSelectedProgressDate} />
                  )}
                </div>
              </div>

              <div className="stats progress-stats">
                <div>
                  <span>Completed tasks</span>
                  <strong>{rangeSummary.tasksCompleted}</strong>
                </div>
                <div>
                  <span>Routine wins</span>
                  <strong>{rangeSummary.routinesCompleted}</strong>
                </div>
                <div>
                  <span>Focus minutes</span>
                  <strong>{rangeSummary.focusMinutes}</strong>
                </div>
              </div>

              <div className="productivity-meter">
                <div className="productivity-meter__track">
                  <div className="productivity-meter__fill" style={{ width: `${Math.min(100, (rangeSummary.totalScore / 200) * 100)}%` }} />
                </div>
                <strong>{Math.min(100, Math.round((rangeSummary.totalScore / 200) * 100))}% productive</strong>
              </div>

              <div className="trend-chart" aria-label="Productivity trend chart">
                {progressTrend.map((item) => (
                  <div className="trend-bar-group" key={item.key}>
                    <div className="trend-bar-wrap">
                      <div
                        className="trend-bar"
                        style={{ height: `${Math.max(10, (item.value / maxTrendValue) * 100)}%` }}
                        title={`${item.label}: ${item.value}`}
                      />
                    </div>
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>

              <div className="progress-detail">
                <div className="progress-detail__box">
                  <h3>Recent wins</h3>
                  {recentProgress.length === 0 ? (
                    <p className="mini-empty">No tracked progress yet. Complete a task or focus sprint to start building your streak.</p>
                  ) : (
                    <ul>
                      {recentProgress.map((entry) => (
                        <li key={entry.id}>
                          <span className={`label label--${entry.type}`}>{entry.type}</span>
                          <div>
                            <strong>{entry.label}</strong>
                            <small>{new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</small>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="progress-detail__box">
                  <h3>Focus insight</h3>
                  <p>
                    {rangeSummary.focusMinutes > 0
                      ? `You logged ${rangeSummary.focusMinutes} minutes of deep work in this view, which is a strong sign of consistent momentum.`
                      : 'No focus time has been logged in this period yet. Start a focused sprint to add data here.'}
                  </p>
                  <p>
                    {rangeSummary.tasksCompleted + rangeSummary.routinesCompleted > 0
                      ? `You completed ${rangeSummary.tasksCompleted + rangeSummary.routinesCompleted} productive actions in this selection.`
                      : 'This period is still quiet. A few wins will quickly build your pattern.'}
                  </p>
                </div>
              </div>
            </article>
          </section>
        )}

        {page === 'tasks' && (
          <section className="page-panel tasks-layout">
            <article className="panel tasks-panel">
              <div className="panel-title">
                <div className="title-with-penguin">
                  <span className="mini-penguin" aria-hidden="true">🐧</span>
                  <div>
                    <p className="eyebrow">Plan with Papi</p>
                    <h2>My sweet tasks</h2>
                  </div>
                </div>
                <span className="count-badge">{tasks.length}</span>
              </div>

              <div className="task-toolbar">
                <input
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Search tasks"
                />
                <SelectMenu
                  value={taskFilter}
                  onChange={setTaskFilter}
                  ariaLabel="Task priority filter"
                  options={[{ value: 'All', label: 'All priorities' }, { value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]}
                />
              </div>

              <form className="task-form" onSubmit={handleTaskSubmit}>
                <input
                  value={taskForm.text}
                  onChange={(e) => setTaskForm({ ...taskForm, text: e.target.value })}
                  placeholder="What shall we do?"
                />
                <SelectMenu
                  value={taskForm.category}
                  onChange={(category) => setTaskForm({ ...taskForm, category })}
                  ariaLabel="Task category"
                  options={taskCategories.map((category) => ({ value: category, label: category }))}
                />
                <SelectMenu
                  value={taskForm.priority}
                  onChange={(priority) => setTaskForm({ ...taskForm, priority })}
                  ariaLabel="Task priority"
                  options={['High', 'Medium', 'Low'].map((priority) => ({ value: priority, label: priority }))}
                />
                <CalendarMenu
                  value={taskForm.dueDate}
                  view="day"
                  className="calendar-menu--task"
                  emptyLabel="Due date"
                  onChange={(dueDate) => setTaskForm({ ...taskForm, dueDate })}
                />
                <div className="task-form-actions">
                  <button type="submit">{taskEditId ? 'Update task' : 'Add task'}</button>
                  {taskEditId && (
                    <button type="button" className="secondary-button" onClick={() => { setTaskEditId(null); setTaskForm({ text: '', category: 'Study', priority: 'Medium', dueDate: '' }) }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <ul className="task-list">
                {filteredTasks.length === 0 ? (
                  <li className="empty-state">No tasks match this view right now.</li>
                ) : (
                  filteredTasks.map((task) => (
                    <li key={task.id} className={task.completed ? 'task task--done' : 'task'}>
                      <button className="check-button" onClick={() => toggleTaskComplete(task)} aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}>{task.completed ? '🐧' : ''}</button>
                      <div className="task-main">
                        <span className="task-text">{task.text}</span>
                        <div className="task-meta">
                          <span className={`priority priority--${task.priority.toLowerCase()}`}>{task.priority}</span>
                          <span className="task-tag">{task.category}</span>
                          {task.dueDate && <span className="task-date">{task.dueDate}</span>}
                        </div>
                      </div>
                      <div className="task-actions">
                        <button className="icon-button" onClick={() => startTaskEdit(task)}>✎</button>
                        <button className="icon-button" onClick={() => {
                          setTasks(tasks.filter((item) => item.id !== task.id))
                          taskRequest(`/${task.id}`, 'DELETE').catch(() => setTasks(tasks))
                        }}>×</button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </article>
          </section>
        )}

        {page === 'focus' && (
          <section className="page-panel focus-layout">
            <article className="panel focus-panel">
              <div className="panel-title">
                <div className="title-with-penguin">
                  <span className="mini-penguin" aria-hidden="true">🐧</span>
                  <div>
                    <p className="eyebrow">Focus with Papi</p>
                    <h2>Pomodoro timer</h2>
                  </div>
                </div>
                <span className={timerOn ? 'status status--active' : 'status'}>{timerOn ? 'Flying!' : 'Ready'}</span>
              </div>

              <div className="timer-settings">
                <label>
                  <span>Focus</span>
                  <SelectMenu
                    value={focusPreset}
                    onChange={(value) => setFocusPreset(Number(value))}
                    ariaLabel="Focus duration"
                    options={[15, 25, 50, 90].map((minutes) => ({ value: minutes, label: `${minutes} min` }))}
                  />
                </label>

                <label>
                  <span>Break</span>
                  <SelectMenu
                    value={breakPreset}
                    onChange={(value) => setBreakPreset(Number(value))}
                    ariaLabel="Break duration"
                    options={[5, 10, 15].map((minutes) => ({ value: minutes, label: `${minutes} min` }))}
                  />
                </label>
              </div>

              <div className="timer-display">{clock(timer)}</div>
              <p className="timer-note">{timerMode === 'focus' ? 'Deep work mode' : 'Rest and reset'} </p>

              <div className="button-row">
                <button className="primary-button" onClick={() => setTimerOn((v) => !v)}>{timerOn ? 'Pause' : 'Start'} </button>
                <button className="secondary-button" onClick={() => { setTimerOn(false); setTimerMode('focus'); setTimer(focusPreset * 60) }}>Reset</button>
              </div>

              <div className="stopwatch">
                <div>
                  <span>Stopwatch</span>
                  <strong>{clock(watch)}</strong>
                </div>
                <div className="button-row">
                  <button className="small-button" onClick={() => setWatchOn((v) => !v)}>{watchOn ? 'Pause' : 'Start'}</button>
                  <button className="small-button" onClick={() => { setWatchOn(false); setWatch(0) }}>Clear</button>
                </div>
              </div>
            </article>
          </section>
        )}

        {page === 'routine' && (
          <section className="page-panel routine-layout">
            <article className="panel routine-panel">
              <div className="panel-title">
                <div className="title-with-penguin">
                  <span className="mini-penguin" aria-hidden="true">🐧</span>
                  <div>
                    <p className="eyebrow">Grow your habit</p>
                    <h2>Study routine</h2>
                  </div>
                </div>
                <strong>{routineProgress}%</strong>
              </div>

              <form className="routine-form" onSubmit={handleRoutineSubmit}>
                <input
                  value={routineForm.title}
                  onChange={(e) => setRoutineForm({ ...routineForm, title: e.target.value })}
                  placeholder="Habit name"
                />
                <div className="routine-form-grid">
                  <input type="time" value={routineForm.time} onChange={(e) => setRoutineForm({ ...routineForm, time: e.target.value })} />
                  <input type="number" min="5" step="5" value={routineForm.minutes} onChange={(e) => setRoutineForm({ ...routineForm, minutes: Number(e.target.value) || 0 })} />
                  <SelectMenu
                    value={routineForm.category}
                    onChange={(category) => setRoutineForm({ ...routineForm, category })}
                    ariaLabel="Routine category"
                    options={taskCategories.map((category) => ({ value: category, label: category }))}
                  />
                </div>
                <div className="routine-form-actions">
                  <button type="submit">{routineEditId ? 'Update habit' : 'Add habit'}</button>
                  {routineEditId && (
                    <button type="button" className="secondary-button" onClick={() => { setRoutineEditId(null); setRoutineForm({ title: '', time: '09:00', minutes: 30, category: 'Study' }) }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="progress-track"><div style={{ width: `${routineProgress}%` }} /></div>
              <p className="routine-summary">{routineDone} of {routine.length} gentle study sessions done today</p>

              <ul className="routine-list">
                {routine.map((item) => (
                  <li className={item.done ? 'routine-item routine-item--done' : 'routine-item'} key={item.id}>
                    <button className="check-button" onClick={() => toggleRoutineComplete(item)} aria-label={item.done ? 'Mark routine incomplete' : 'Mark routine complete'}>{item.done ? '🐧' : ''}</button>
                    <time>{item.time}</time>
                    <div className="routine-text-wrap">
                      <strong>{item.title}</strong>
                      <span>{item.minutes} min • {item.category}</span>
                    </div>
                    <div className="routine-actions">
                      <button className="icon-button" onClick={() => startRoutineEdit(item)}>✎</button>
                      <button className="icon-button" onClick={() => persist(tasks, routine.filter((entry) => entry.id !== item.id))}>×</button>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        )}
      </div>
    </main>
  )
}
