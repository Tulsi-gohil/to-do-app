import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Filter,
  LogOut,
  Plus,
  Search,
  Trash2,
  Flag,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const priorities = [
  { value: 'low', label: 'Low', tone: 'text-mist border-white/10 bg-white/5' },
  { value: 'medium', label: 'Medium', tone: 'text-gold border-gold/30 bg-gold/10' },
  { value: 'high', label: 'High', tone: 'text-ember border-ember/30 bg-ember/10' },
];

function priorityTone(priority) {
  return priorities.find((p) => p.value === priority)?.tone || priorities[1].tone;
}

export default function Todos() {
  const { user, logout } = useAuth();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
  });

  const loadTodos = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (status !== 'all') params.status = status;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (query.trim()) params.q = query.trim();
      const { data } = await api.get('/todos', { params });
      setTodos(data.todos);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load todos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, priorityFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadTodos();
    }, 280);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const stats = useMemo(() => {
    const total = todos.length;
    const done = todos.filter((t) => t.completed).length;
    const active = total - done;
    const high = todos.filter((t) => t.priority === 'high' && !t.completed).length;
    return { total, done, active, high };
  }, [todos]);

  const createTodo = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Task title is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/todos', {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        dueDate: form.dueDate || null,
      });
      setTodos((prev) => [data.todo, ...prev]);
      setForm({ title: '', description: '', priority: 'medium', dueDate: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create task.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTodo = async (id) => {
    try {
      const { data } = await api.patch(`/todos/${id}/toggle`);
      setTodos((prev) => prev.map((t) => (t._id === id ? data.todo : t)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update task.');
    }
  };

  const deleteTodo = async (id) => {
    try {
      await api.delete(`/todos/${id}`);
      setTodos((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete task.');
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="auth-grid relative min-h-screen overflow-hidden">
      <div className="auth-noise pointer-events-none absolute inset-0 opacity-35" />
      <div className="pointer-events-none absolute left-1/3 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-mint/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
        <header className="mb-8 flex flex-col gap-4 animate-fade-up sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-mint">
              TaskFlow
            </p>
            <h1 className="mt-2 font-display text-3xl text-foam md:text-4xl">
              {greeting}, {user?.fullName?.split(' ')[0] || 'there'}
            </h1>
            <p className="mt-2 text-sm text-mist">
              @{user?.username} · keep momentum without the clutter
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="btn-ghost inline-flex w-fit items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </header>

        <section className="mb-8 grid gap-3 animate-fade-up-delay sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total', value: stats.total, icon: Sparkles },
            { label: 'Active', value: stats.active, icon: Circle },
            { label: 'Done', value: stats.done, icon: CheckCircle2 },
            { label: 'High priority', value: stats.high, icon: Flag },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-white/10 bg-moss/50 px-4 py-4 backdrop-blur-md"
            >
              <div className="mb-3 flex items-center justify-between text-mist">
                <span className="text-xs uppercase tracking-[0.16em]">{card.label}</span>
                <card.icon className="h-4 w-4 text-mint" />
              </div>
              <p className="font-display text-3xl text-foam">{card.value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <form
            onSubmit={createTodo}
            className="h-fit rounded-[28px] border border-white/10 bg-moss/55 p-5 backdrop-blur-xl animate-fade-up"
          >
            <h2 className="font-display text-2xl text-foam">New task</h2>
            <p className="mt-1 text-sm text-mist">Capture it once. Refine later.</p>

            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-sm text-mist">Title</span>
                <input
                  className="input-field"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Ship onboarding polish"
                  maxLength={200}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-mist">Notes</span>
                <textarea
                  className="input-field min-h-[96px] resize-y"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Optional details…"
                  maxLength={1000}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-mist">Priority</span>
                  <select
                    className="input-field"
                    value={form.priority}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, priority: e.target.value }))
                    }
                  >
                    {priorities.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-mist">Due</span>
                  <input
                    type="date"
                    className="input-field"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, dueDate: e.target.value }))
                    }
                  />
                </label>
              </div>
            </div>

            <button type="submit" className="btn-primary mt-5" disabled={saving}>
              <Plus className="h-4 w-4" />
              {saving ? 'Adding…' : 'Add task'}
            </button>
          </form>

          <section className="rounded-[28px] border border-white/10 bg-moss/40 p-5 backdrop-blur-xl animate-fade-up-delay">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-display text-2xl text-foam">Your list</h2>
                <p className="text-sm text-mist">Filter, search, finish.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-[180px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist" />
                  <input
                    className="input-field pl-9"
                    placeholder="Search tasks"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-mist" />
                  <select
                    className="input-field w-auto"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="completed">Done</option>
                  </select>
                  <select
                    className="input-field w-auto"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <option value="all">Any priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {error ? (
              <p className="mb-4 rounded-xl border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
                {error}
              </p>
            ) : null}

            {loading ? (
              <p className="py-16 text-center text-mist">Loading your tasks…</p>
            ) : todos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center">
                <p className="font-display text-2xl text-foam">Clear runway</p>
                <p className="mt-2 text-sm text-mist">
                  Add your first task on the left to begin the day.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {todos.map((todo, index) => (
                  <li
                    key={todo._id}
                    className="group rounded-2xl border border-white/10 bg-ink/35 p-4 transition hover:border-mint/30 hover:bg-ink/50"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleTodo(todo._id)}
                        className="mt-0.5 text-mint transition hover:scale-105"
                        aria-label={todo.completed ? 'Mark active' : 'Mark done'}
                      >
                        {todo.completed ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <Circle className="h-6 w-6 opacity-70" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`truncate text-base font-semibold ${
                              todo.completed
                                ? 'text-mist line-through'
                                : 'text-foam'
                            }`}
                          >
                            {todo.title}
                          </h3>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${priorityTone(
                              todo.priority
                            )}`}
                          >
                            {todo.priority}
                          </span>
                        </div>
                        {todo.description ? (
                          <p className="mt-1 text-sm leading-relaxed text-mist/90">
                            {todo.description}
                          </p>
                        ) : null}
                        {todo.dueDate ? (
                          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-mist">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Due{' '}
                            {new Date(todo.dueDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteTodo(todo._id)}
                        className="rounded-full p-2 text-mist opacity-70 transition hover:bg-ember/15 hover:text-ember group-hover:opacity-100"
                        aria-label="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
