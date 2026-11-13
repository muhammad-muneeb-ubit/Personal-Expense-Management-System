import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ReceiptText, Tags, WalletCards, ChartNoAxesCombined, Settings, Plus, ArrowUpRight, ArrowDownRight, Menu, X, Utensils, Car, ShoppingBag, House, HeartPulse, GraduationCap, CircleDollarSign, Search, Trash2, Pencil, LogOut, ChevronDown, CalendarDays, TrendingUp, PiggyBank, ShieldCheck, Mail, LockKeyhole, UserRound, Eye, EyeOff, Download, RotateCcw, CheckCircle2, AlertCircle, Archive, Wallet, HandCoins, } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { apiRequest, refreshSession, setAccessToken } from './lib/api';
import MoneyLentPage from './pages/MoneyLentPage';

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/expenses', label: 'Transactions', icon: ReceiptText },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/budgets', label: 'Budgets', icon: WalletCards },
  { to: '/money-lent', label: 'Money Lent', icon: HandCoins },
  { to: '/reports', label: 'Reports', icon: ChartNoAxesCombined },
];

const categoryIcons = {
  'Food & Dining': Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  'Bills & Utilities': House,
  Health: HeartPulse,
  Education: GraduationCap,
};

const currencyFormat = (value, currency = 'PKR') =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const today = () => new Date().toISOString().slice(0, 10);
const monthNow = () => new Date().getMonth() + 1;
const yearNow = () => new Date().getFullYear();
const monthLabel = (month, year) =>
  new Date(year, month - 1, 1).toLocaleString('en', { month: 'long', year: 'numeric' });

function Toast({ toast, clear }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clear, 3600);
    return () => clearTimeout(timer);
  }, [toast, clear]);

  if (!toast) return null;

  return (
    <div className={`toast ${toast.type || 'success'}`}>
      <span>
        {toast.type === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}
      </span>
      {toast.message}
      <button onClick={clear}>
        <X size={15} />
      </button>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Button({ children, variant = 'primary', ...props }) {
  return (
    <button className={`button ${variant}`} {...props}>
      {children}
    </button>
  );
}

function PageHeading({ eyebrow = 'POCKETWISE WORKSPACE', title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal">
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function AuthScreen({ onAuthenticated, notify }) {
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const update = (e) => setForm((old) => ({ ...old, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const data = await apiRequest(endpoint, {
        method: 'POST',
        auth: false,
        body: JSON.stringify(form),
      });
      setAccessToken(data.accessToken);
      onAuthenticated(data.user);
      if (data.message) notify(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!form.email) return setError('Enter your email address first.');
    setBusy(true);
    setError('');
    try {
      const data = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ email: form.email }),
      });
      notify(data.message);
      setMode('login');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-aside">
        <div className="brand auth-brand">
          <div className="brand-mark">
            <CircleDollarSign size={24} />
          </div>
          <span>Pocketwise</span>
        </div>
        <div className="auth-pitch">
          <div className="auth-eyebrow">YOUR MONEY, MADE CLEAR</div>
          <h1>
            Make every rupee
            <br />
            <em>count.</em>
          </h1>
          <p>A calmer way to track spending, plan your budget, and build better money habits.</p>
          <div className="auth-visual">
            <div className="visual-card">
              <span>Monthly spending</span>
              <strong>PKR 42,850</strong>
              <div className="visual-bars">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <small>
                <TrendingUp size={13} /> Stay on top of your goals
              </small>
            </div>
            <div className="visual-float">
              <PiggyBank size={19} />
              <span>Budget progress</span>
              <b>72%</b>
            </div>
          </div>
        </div>
        <div className="auth-aside-foot">Private by design · Built for your financial wellbeing</div>
      </div>

      <div className="auth-main">
        <div className="auth-mobile-brand">
          <div className="brand-mark">
            <CircleDollarSign size={22} />
          </div>
          <b>Pocketwise</b>
        </div>
        <div className="auth-card">
          <div className="auth-card-heading">
            <div className="eyebrow">WELCOME TO POCKETWISE</div>
            <h2>{mode === 'register' ? 'Create your account' : 'Welcome back'}</h2>
            <p>
              {mode === 'register'
                ? 'Start building a clearer picture of your money.'
                : 'Sign in to continue to your workspace.'}
            </p>
          </div>

          <form onSubmit={submit} className="stack-form">
            {mode === 'register' && (
              <Field label="Full name">
                <input
                  name="name"
                  value={form.name}
                  onChange={update}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                  minLength="2"
                  maxLength="70"
                />
              </Field>
            )}
            <Field label="Email address">
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={update}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Password">
              <div className="password-wrap">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update}
                  placeholder={mode === 'register' ? 'At least 10 characters' : 'Enter your password'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required
                  minLength={mode === 'register' ? 10 : 1}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {mode === 'register' && (
                <small>Use at least 10 characters with uppercase, lowercase and a number.</small>
              )}
            </Field>

            {error && (
              <div className="inline-error">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <Button disabled={busy} type="submit">
              {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}{' '}
              <ArrowUpRight size={16} />
            </Button>
          </form>

          {mode === 'login' && (
            <button className="text-button forgot-button" onClick={forgot} disabled={busy}>
              Forgot password?
            </button>
          )}

          <div className="auth-switch">
            {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setMode(mode === 'register' ? 'login' : 'register');
                setError('');
              }}
            >
              {mode === 'register' ? 'Sign in' : 'Create account'}
            </button>
          </div>

          <div className="auth-security">
            <ShieldCheck size={15} /> Your data is protected with encrypted sessions.
          </div>
        </div>

        <div className="auth-copyright">
          © {new Date().getFullYear()} Pocketwise. Your finances, in focus.
        </div>
      </div>
    </div>
  );
}

function Sidebar({ open, close, user, onLogout }) {
  return (
    <>
      <div className={`mobile-overlay ${open ? 'show' : ''}`} onClick={close} />
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <CircleDollarSign size={23} />
          </div>
          <span>Pocketwise</span>
          <button className="mobile-close" onClick={close}>
            <X size={19} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={close}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">
              <ChartNoAxesCombined size={18} />
            </div>
            <strong>Take control of your money</strong>
            <p>Small steps today make a big difference tomorrow.</p>
          </div>

          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={close}
          >
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>

          <div className="profile">
            <div className="avatar">{user?.name?.slice(0, 1).toUpperCase() || 'P'}</div>
            <div className="profile-text">
              <strong>{user?.name || 'My account'}</strong>
              <small>{user?.email || 'Personal workspace'}</small>
            </div>
            <button className="logout-icon" title="Sign out" onClick={onLogout}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({ onMenu, user, pageTitle }) {
  return (
    <header className="topbar">
      <button className="menu-button" onClick={onMenu}>
        <Menu size={21} />
      </button>
      <div className="breadcrumb">
        Workspace <span>/</span> <strong>{pageTitle}</strong>
      </div>
      <div className="top-actions">
        <div className="top-user">
          <div className="top-avatar">{user?.name?.slice(0, 1).toUpperCase() || 'P'}</div>
          <span>{user?.name || 'User'}</span>
          {/* <ChevronDown size={14} /> */}
        </div>
      </div>
    </header>
  );
}

function StatCard({ title, value, detail, icon: Icon, tint, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <div className={`stat-icon ${tint}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">
        <span className={accent ? 'trend-up' : 'trend-neutral'}>{detail}</span>
      </div>
    </div>
  );
}

function TransactionTable({ expenses, currency, onDelete, onEdit, compact = false }) {
  return (
    <div className="table-scroll">
      <table className="transactions-table">
        <thead>
          <tr>
            <th>TRANSACTION</th>
            <th>CATEGORY</th>
            <th>DATE</th>
            <th>PAYMENT</th>
            <th className="amount-cell">AMOUNT</th>
            {onDelete && !compact && <th />}
          </tr>
        </thead>
        <tbody>
          {expenses.length ? (
            expenses.map((e) => {
              const cat = e.categoryId || {};
              const Icon = categoryIcons[cat.name] || ReceiptText;
              return (
                <tr key={e._id}>
                  <td>
                    <div className="transaction-name">
                      <div
                        className="transaction-icon"
                        style={{
                          background: `${cat.color || '#7770f5'}18`,
                          color: cat.color || '#7770f5',
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <div>
                        <strong>{e.description}</strong>
                        {e.notes && <small className="row-note">{e.notes}</small>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="category-pill">{cat.name || 'Uncategorised'}</span>
                  </td>
                  <td>
                    {new Date(e.date).toLocaleDateString('en-PK', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td>
                    <span className="payment-label">{e.paymentMethod}</span>
                  </td>
                  <td className="amount-cell amount-negative">
                    − {currencyFormat(e.amount, currency)}
                  </td>
                  {onDelete && !compact && (
                    <td>
                      <div className="row-actions">
                        <button title="Edit expense" onClick={() => onEdit(e)}>
                          <Pencil size={14} />
                        </button>
                        <button title="Delete expense" onClick={() => onDelete(e._id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={onDelete && !compact ? 6 : 5} className="empty-state">
                No transactions found. Add an expense to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ExpenseForm({ categories, initial, onSave, onClose }) {
  const [form, setForm] = useState({
    description: initial?.description || '',
    amount: initial?.amount || '',
    categoryId: initial?.categoryId?._id || initial?.categoryId || categories.find((c) => !c.archived)?._id || '',
    date: initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : today(),
    paymentMethod: initial?.paymentMethod || 'Cash',
    notes: initial?.notes || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({ ...form, amount: Number(form.amount) });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={initial ? 'Edit expense' : 'Add expense'}
      subtitle="Keep your spending records up to date."
      onClose={onClose}
    >
      <form className="stack-form" onSubmit={submit}>
        <Field label="Description">
          <input
            required
            maxLength="100"
            placeholder="e.g. Grocery shopping"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>

        <div className="form-grid">
          <Field label="Amount">
            <input
              required
              type="number"
              min="1"
              step="1"
              placeholder="2500"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
          <Field label="Date">
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
        </div>

        <div className="form-grid">
          <Field label="Category">
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              {categories
                .filter((c) => !c.archived)
                .map((c) => (
                  <option value={c._id} key={c._id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Payment method">
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            >
              {['Cash', 'Card', 'Bank', 'Digital wallet'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Notes (optional)">
          <textarea
            rows="2"
            maxLength="500"
            placeholder="Add a note…"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>

        {error && <div className="inline-error">{error}</div>}

        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy || !categories.some((c) => !c.archived)}>
            {busy ? 'Saving…' : initial ? 'Save changes' : 'Save expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Dashboard({ data, expenses, currency, onAdd, lendingSummary }) {
  const summary = data?.summary || { spent: 0, count: 0, budget: 0, previousSpent: 0 };
  const remaining = summary.budget - summary.spent;
  const chartCategories = data?.categories || [];
  const trend = data?.trend || [];

  return (
    <div className="page-content">
      <PageHeading
        eyebrow={new Date()
          .toLocaleDateString('en', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
          .toUpperCase()}
        title="Good to see you 👋"
        description="Here's what's happening with your money."
        action={
          <Button onClick={onAdd}>
            <Plus size={17} /> Add expense
          </Button>
        }
      />

      <div className="stats-grid dashboard-stats-grid">
        <StatCard
          title="Spent this month"
          value={currencyFormat(summary.spent, currency)}
          detail={`${summary.count} transactions`}
          icon={ReceiptText}
          tint="orange"
        />
        <StatCard
          title="Monthly budget"
          value={currencyFormat(summary.budget, currency)}
          detail={summary.budget ? 'Your planned spending limit' : 'Set a budget to get started'}
          icon={WalletCards}
          tint="purple"
        />
        <StatCard
          title="Remaining budget"
          value={currencyFormat(remaining, currency)}
          detail={
            summary.budget
              ? remaining >= 0
                ? 'Available to spend'
                : 'Over budget'
              : 'No budget set yet'
          }
          icon={PiggyBank}
          tint="green"
          accent={remaining >= 0}
        />
        <StatCard
          title="Previous month"
          value={currencyFormat(summary.previousSpent, currency)}
          detail="Last month’s spending"
          icon={CalendarDays}
          tint="blue"
        />
        <StatCard
          title="Money lent"
          value={currencyFormat(lendingSummary?.outstanding || 0, currency)}
          detail="Still to receive"
          icon={HandCoins}
          tint="blue"
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Spending overview</h2>
              <p>Your monthly spending over the last six months</p>
            </div>
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-dot purple-dot" /> Expenses
            </span>
            <span className="chart-total">
              {currencyFormat(summary.spent, currency)} <small>this month</small>
            </span>
          </div>
          <div className="area-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 5, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7770f5" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#7770f5" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eef0f5" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#969bad', fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#969bad', fontSize: 10 }}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip formatter={(v) => currencyFormat(v, currency)} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#7770f5"
                  strokeWidth={2.8}
                  fill="url(#spendFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel category-panel">
          <div className="panel-heading">
            <div>
              <h2>Spending by category</h2>
              <p>This month's breakdown</p>
            </div>
          </div>
          {chartCategories.length ? (
            <>
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartCategories}
                      dataKey="amount"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={84}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {chartCategories.map((c, i) => (
                        <Cell key={c.name || i} fill={c.color || '#7770f5'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => currencyFormat(v, currency)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center">
                  <strong>{currencyFormat(summary.spent, currency)}</strong>
                  <span>Total spent</span>
                </div>
              </div>
              <div className="category-legend">
                {chartCategories.slice(0, 5).map((c) => (
                  <div key={c.name}>
                    <span>
                      <i style={{ background: c.color || '#7770f5' }} />
                      {c.name || 'Other'}
                    </span>
                    <strong>{currencyFormat(c.amount, currency)}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="chart-empty">
              <Tags size={25} />
              <p>Your category breakdown will appear here.</p>
            </div>
          )}
        </section>
      </div>

      <section className="panel transactions-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent transactions</h2>
            <p>Your latest expenses at a glance</p>
          </div>
          <NavLink to="/expenses" className="text-link">
            View all <ArrowUpRight size={15} />
          </NavLink>
        </div>
        <TransactionTable expenses={expenses.slice(0, 5)} currency={currency} compact />
      </section>
    </div>
  );
}

function ExpensesPage({ expenses, categories, currency, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [month, setMonth] = useState('all');
  const filtered = useMemo(
    () =>
      expenses.filter(
        (e) =>
          (!search || e.description.toLowerCase().includes(search.toLowerCase())) &&
          (category === 'all' || (e.categoryId?._id || e.categoryId) === category) &&
          (month === 'all' || new Date(e.date).toISOString().slice(0, 7) === month)
      ),
    [expenses, search, category, month]
  );

  return (
    <div className="page-content">
      <PageHeading
        title="Transactions"
        description="Track, review and manage your spending."
        action={
          <Button onClick={onAdd}>
            <Plus size={17} /> Add expense
          </Button>
        }
      />

      <section className="panel transactions-panel">
        <div className="panel-heading">
          <div>
            <h2>All transactions</h2>
            <p>
              {filtered.length} of {expenses.length} transactions
            </p>
          </div>
        </div>

        <div className="filters">
          <div className="search-field">
            <Search size={16} />
            <input
              placeholder="Search transactions"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            aria-label="Filter by month"
            type="month"
            value={month === 'all' ? '' : month}
            onChange={(e) => setMonth(e.target.value || 'all')}
          />
          <button
            className="clear-filter"
            onClick={() => {
              setSearch('');
              setCategory('all');
              setMonth('all');
            }}
          >
            <RotateCcw size={14} /> Clear
          </button>
        </div>

        <TransactionTable
          expenses={filtered}
          currency={currency}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </section>
    </div>
  );
}

function CategoriesPage({ categories, onCreate, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', color: '#7770f5' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function startEdit(c) {
    setEditing(c);
    setForm({ name: c.name, color: c.color || '#7770f5' });
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (editing) await onUpdate(editing._id, form);
      else await onCreate(form);
      setEditing(null);
      setForm({ name: '', color: '#7770f5' });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-content">
      <PageHeading
        title="Categories"
        description="Organise expenses into the groups that make sense to you."
      />

      <div className="category-layout">
        <section className="panel category-form-panel">
          <div className="panel-heading">
            <div>
              <h2>{editing ? 'Edit category' : 'Create a category'}</h2>
              <p>Give your spending a clear label.</p>
            </div>
          </div>

          <form className="stack-form" onSubmit={submit}>
            <Field label="Category name">
              <input
                required
                minLength="2"
                maxLength="40"
                placeholder="e.g. Personal care"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Category colour">
              <div className="color-input">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
                <span>{form.color.toUpperCase()}</span>
              </div>
            </Field>

            {error && <div className="inline-error">{error}</div>}

            <div className="form-actions">
              <Button disabled={busy}>
                {busy ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditing(null);
                    setForm({ name: '', color: '#7770f5' });
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="panel category-list-panel">
          <div className="panel-heading">
            <div>
              <h2>Your categories</h2>
              <p>{categories.filter((c) => !c.archived).length} active categories</p>
            </div>
          </div>

          <div className="category-cards">
            {categories.map((c) => (
              <div className={`category-card ${c.archived ? 'archived' : ''}`} key={c._id}>
                <div
                  className="category-color-icon"
                  style={{ background: `${c.color}1b`, color: c.color }}
                >
                  <Tags size={19} />
                </div>
                <div className="category-card-info">
                  <strong>{c.name}</strong>
                  <small>{c.archived ? 'Archived' : 'Active'}</small>
                </div>
                <div className="row-actions">
                  <button title="Edit" onClick={() => startEdit(c)}>
                    <Pencil size={15} />
                  </button>
                  {c.archived ? (
                    <button
                      title="Restore"
                      onClick={() => onUpdate(c._id, { archived: false })}
                    >
                      <RotateCcw size={15} />
                    </button>
                  ) : (
                    <button
                      title="Archive"
                      onClick={() => onUpdate(c._id, { archived: true })}
                    >
                      <Archive size={15} />
                    </button>
                  )}
                  <button title="Delete" onClick={() => onDelete(c._id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function BudgetsPage({ budgets, categories, currency, onSave, onDelete, onLoad }) {
  const [month, setMonth] = useState(monthNow());
  const [year, setYear] = useState(yearNow());
  const [shownBudgets, setShownBudgets] = useState(budgets);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    onLoad(month, year)
      .then((rows) => {
        if (active) setShownBudgets(rows);
      })
      .catch(() => { });
    return () => {
      active = false;
    };
  }, [month, year, onLoad]);

  const activeCategories = categories.filter((c) => !c.archived);
  const allocated = shownBudgets.reduce((sum, b) => sum + b.amount, 0);
  const spent = shownBudgets.reduce((sum, b) => sum + (b.spent || 0), 0);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({ categoryId, amount: Number(amount), month, year });
      setAmount('');
      setShownBudgets(await onLoad(month, year));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-content">
      <PageHeading
        title="Monthly budgets"
        description="Set a spending limit for each category and keep an eye on your progress."
      />

      <div className="budget-controls">
        <label>
          Month
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option value={i + 1} key={i}>
                {new Date(2020, i, 1).toLocaleString('en', { month: 'long' })}
              </option>
            ))}
          </select>
        </label>
        <label>
          Year
          <input
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </label>
        <div className="budget-period">{monthLabel(month, year)}</div>
      </div>

      <div className="stats-grid budget-stats">
        <StatCard
          title="Total budget"
          value={currencyFormat(allocated, currency)}
          detail="Across your categories"
          icon={WalletCards}
          tint="purple"
        />
        <StatCard
          title="Total spent"
          value={currencyFormat(spent, currency)}
          detail="Against allocated budgets"
          icon={ReceiptText}
          tint="orange"
        />
        <StatCard
          title="Budget remaining"
          value={currencyFormat(allocated - spent, currency)}
          detail={allocated ? `${Math.round((spent / allocated) * 100)}% used` : 'No budget set'}
          icon={PiggyBank}
          tint="green"
        />
      </div>

      <div className="budget-layout">
        <section className="panel budget-form-panel">
          <div className="panel-heading">
            <div>
              <h2>Set a category budget</h2>
              <p>Create or update a limit for this month.</p>
            </div>
          </div>

          <form className="stack-form" onSubmit={submit}>
            <Field label="Category">
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select category</option>
                {activeCategories.map((c) => (
                  <option value={c._id} key={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={`Budget amount (${currency})`}>
              <input
                type="number"
                min="1"
                step="1"
                required
                placeholder="e.g. 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>

            {error && <div className="inline-error">{error}</div>}

            <Button disabled={busy || !activeCategories.length}>
              {busy ? 'Saving…' : 'Save budget'}
            </Button>
            <small className="form-hint">
              Saving the same category and month updates its existing budget.
            </small>
          </form>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Budget progress</h2>
              <p>Actual spending compared with your limits.</p>
            </div>
          </div>

          <div className="budget-list">
            {shownBudgets.length ? (
              shownBudgets.map((b) => {
                const percent = b.amount ? Math.round((b.spent / b.amount) * 100) : 0;
                const color =
                  percent > 100
                    ? '#e56b75'
                    : percent > 80
                      ? '#e7a24d'
                      : b.categoryId?.color || '#7770f5';

                return (
                  <div className="budget-row" key={b._id}>
                    <div className="budget-row-top">
                      <div>
                        <i style={{ background: color }} />
                        <strong>{b.categoryId?.name || 'Category'}</strong>
                      </div>
                      <button
                        onClick={async () => {
                          await onDelete(b._id);
                          setShownBudgets(await onLoad(month, year));
                        }}
                        title="Delete budget"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="progress-track">
                      <div
                        style={{
                          width: `${Math.min(100, percent)}%`,
                          background: color,
                        }}
                      />
                    </div>

                    <div className="budget-row-bottom">
                      <span>
                        {currencyFormat(b.spent, currency)} spent · {percent}%
                      </span>
                      <strong>{currencyFormat(b.amount, currency)} limit</strong>
                    </div>

                    {percent > 100 && (
                      <small className="over-budget">
                        Over budget by {currencyFormat(b.spent - b.amount, currency)}
                      </small>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="chart-empty">
                <Wallet size={25} />
                <p>
                  No budgets for {monthLabel(month, year)} yet. Add one to track your spending.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ReportsPage({ report, currency, year, setYear }) {
  const monthly = report?.monthly || [];
  const total = report?.totals?.total || 0;

  return (
    <div className="page-content">
      <PageHeading
        title="Reports & analytics"
        description="Understand your spending patterns and how they change over time."
        action={
          <div className="year-select">
            <CalendarDays size={16} />
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[yearNow(), yearNow() - 1, yearNow() - 2, yearNow() - 3].map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="stats-grid">
        <StatCard
          title="Total spent"
          value={currencyFormat(total, currency)}
          detail={`During ${year}`}
          icon={CircleDollarSign}
          tint="purple"
        />
        <StatCard
          title="Transactions"
          value={String(report?.totals?.count || 0)}
          detail="Recorded expenses"
          icon={ReceiptText}
          tint="orange"
        />
        <StatCard
          title="Average transaction"
          value={currencyFormat(report?.totals?.average || 0, currency)}
          detail="Per expense"
          icon={TrendingUp}
          tint="green"
        />
        <StatCard
          title="Top category"
          value={report?.categories?.[0]?.name || '—'}
          detail={
            report?.categories?.[0]
              ? currencyFormat(report.categories[0].amount, currency)
              : 'No spending data'
          }
          icon={Tags}
          tint="blue"
        />
      </div>

      <div className="dashboard-grid report-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Monthly spending</h2>
              <p>How much you spent each month in {year}</p>
            </div>
          </div>
          <div className="report-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid stroke="#eef0f5" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#969bad', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#969bad', fontSize: 10 }}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip formatter={(v) => currencyFormat(v, currency)} />
                <Bar dataKey="amount" fill="#7770f5" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Category breakdown</h2>
              <p>Spending distribution for {year}</p>
            </div>
          </div>
          <div className="report-category-list">
            {report?.categories?.length ? (
              report.categories.map((c) => (
                <div key={c.name}>
                  <span>
                    <i style={{ background: c.color || '#7770f5' }} />
                    {c.name || 'Other'}
                  </span>
                  <strong>{currencyFormat(c.amount, currency)}</strong>
                </div>
              ))
            ) : (
              <div className="chart-empty">No category data for this year.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SettingsPage({
  user,
  onProfileSave,
  onPasswordChange,
  onResendVerification,
  notify,
}) {
  const [name, setName] = useState(user.name);
  const [currency, setCurrency] = useState(user.currency || 'PKR');
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '' });
  const [passwordBusy, setPasswordBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await onProfileSave({ name, currency });
      notify('Profile updated.');
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function change(e) {
    e.preventDefault();
    setPasswordBusy(true);
    try {
      await onPasswordChange(password);
      setPassword({ currentPassword: '', newPassword: '' });
      notify('Password changed. Sign in again with your new password.');
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <div className="page-content">
      <PageHeading
        title="Settings"
        description="Manage your profile, preferences and account security."
      />

      <div className="settings-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Profile & preferences</h2>
              <p>Personalise your Pocketwise workspace.</p>
            </div>
          </div>
          <form className="stack-form" onSubmit={save}>
            <Field label="Full name">
              <input
                required
                minLength="2"
                maxLength="70"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Email address">
              <input value={user.email} disabled />
              <small>Your sign-in email address.</small>
            </Field>
            <Field label="Display currency">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="PKR">PKR — Pakistani Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </Field>
            <Button disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</Button>
          </form>
        </section>

        <div className="settings-right">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Email verification</h2>
                <p>Keep your account contact details verified.</p>
              </div>
            </div>
            <div className="verification-status">
              <div className={`verification-icon ${user.emailVerified ? 'verified' : ''}`}>
                <Mail size={19} />
              </div>
              <div>
                <strong>{user.emailVerified ? 'Email verified' : 'Email not verified'}</strong>
                <small>
                  {user.emailVerified
                    ? 'Your email address has been confirmed.'
                    : 'Check your inbox for a verification link.'}
                </small>
              </div>
            </div>
            {!user.emailVerified && (
              <Button variant="secondary" onClick={onResendVerification}>
                Resend verification email
              </Button>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Change password</h2>
                <p>Use a strong password you don't use elsewhere.</p>
              </div>
            </div>
            <form className="stack-form" onSubmit={change}>
              <Field label="Current password">
                <input
                  type="password"
                  required
                  value={password.currentPassword}
                  onChange={(e) =>
                    setPassword({ ...password, currentPassword: e.target.value })
                  }
                />
              </Field>
              <Field label="New password">
                <input
                  type="password"
                  required
                  minLength="10"
                  value={password.newPassword}
                  onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
                />
                <small>At least 10 characters, with uppercase, lowercase and a number.</small>
              </Field>
              <Button disabled={passwordBusy}>
                {passwordBusy ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function VerifyEmailPage({ onDone }) {
  const [status, setStatus] = useState('Verifying your email…');
  const [error, setError] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const token = new URLSearchParams(location.search).get('token');
    if (!token) {
      setStatus('Verification link is missing.');
      setError(true);
      return;
    }
    apiRequest('/auth/verify-email', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ token }),
    })
      .then((r) => setStatus(r.message))
      .catch((e) => {
        setStatus(e.message);
        setError(true);
      });
  }, [location.search]);

  return (
    <div className="simple-auth-page">
      <div className="auth-card">
        <div className="auth-security">
          <Mail size={20} />
        </div>
        <h2>{error ? 'Verification unavailable' : 'Email verification'}</h2>
        <p>{status}</p>
        <Button onClick={onDone}>Continue to Pocketwise</Button>
      </div>
    </div>
  );
}

function ResetPasswordPage({ notify }) {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.search).get('token') || '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await apiRequest('/auth/reset-password', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ token, password }),
      });
      notify(data.message);
      navigate('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="simple-auth-page">
      <div className="auth-card">
        <div className="eyebrow">ACCOUNT RECOVERY</div>
        <h2>Set a new password</h2>
        <p>Choose a strong password for your Pocketwise account.</p>
        <form className="stack-form" onSubmit={submit}>
          <Field label="New password">
            <input
              type="password"
              required
              minLength="10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <small>At least 10 characters, with uppercase, lowercase and a number.</small>
          </Field>
          {error && <div className="inline-error">{error}</div>}
          <Button disabled={busy || !token}>{busy ? 'Updating…' : 'Reset password'}</Button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [report, setReport] = useState(null);
  const [reportYear, setReportYear] = useState(yearNow());
  const [apiStatus, setApiStatus] = useState('checking');
  const [lendingSummary, setLendingSummary] = useState({ totalLent: 0, totalRepaid: 0, outstanding: 0, });

  const [expenseModal, setExpenseModal] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const loadBudgetsForPeriod = useCallback(async (month, year) => {
    return (await apiRequest(`/budgets?month=${month}&year=${year}`)).budgets || [];
  }, []);

  const loadData = useCallback(async () => {
    setApiStatus('checking');
    try {
      const [expenseData, categoryData, budgetData, dashboardData, lendingData,] = await Promise.all([
        apiRequest('/expenses'),
        apiRequest('/categories'),
        apiRequest(`/budgets?month=${monthNow()}&year=${yearNow()}`),
        apiRequest('/insights/dashboard'),
        apiRequest('/lending'),
      ]);
      setExpenses(expenseData.expenses || []);
      setCategories(categoryData.categories || []);
      setBudgets(budgetData.budgets || []);
      setDashboard(dashboardData);
      setLendingSummary(lendingData.summary || {
        totalLent: 0,
        totalRepaid: 0,
        outstanding: 0,
      });
      setApiStatus('connected');
    } catch (e) {
      setApiStatus('offline');
      throw e;
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const session = await refreshSession();
        if (session && active) {
          setUser(session.user);
        }
      } catch {
      } finally {
        if (active) setBooting(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (user) loadData().catch((e) => notify(e.message, 'error'));
  }, [user, loadData, notify]);

  useEffect(() => {
    if (!user) return;
    apiRequest(`/insights/reports?year=${reportYear}`)
      .then(setReport)
      .catch((e) => notify(e.message, 'error'));
  }, [user, reportYear, notify]);

  const pageTitle =
    navItems.find((x) => x.to === location.pathname)?.label ||
    (location.pathname === '/settings' ? 'Settings' : 'Workspace');

  async function authenticated(nextUser) {
    setUser(nextUser);
    navigate('/');
  }

  async function logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST', auth: false });
    } catch { }
    setAccessToken(null);
    setUser(null);
    setExpenses([]);
    setCategories([]);
    setBudgets([]);
    setDashboard(null);
    navigate('/');
    notify('You have signed out.');
  }

  async function saveExpense(payload) {
    const data = expenseModal?._id
      ? await apiRequest(`/expenses/${expenseModal._id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      : await apiRequest('/expenses', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    notify(expenseModal?._id ? 'Expense updated.' : 'Expense added.');
    await loadData();
    return data;
  }

  async function deleteExpense(id) {
    if (!window.confirm('Delete this expense? This cannot be undone.')) return;
    try {
      await apiRequest(`/expenses/${id}`, { method: 'DELETE' });
      notify('Expense deleted.');
      await loadData();
    } catch (e) {
      notify(e.message, 'error');
    }
  }

  async function createCategory(payload) {
    await apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    notify('Category created.');
    await loadData();
  }

  async function updateCategory(id, payload) {
    await apiRequest(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    notify('Category updated.');
    await loadData();
  }

  async function deleteCategory(id) {
    if (
      !window.confirm(
        'Delete this category? Categories with financial history are archived instead.'
      )
    )
      return;
    try {
      const data = await apiRequest(`/categories/${id}`, { method: 'DELETE' });
      notify(data.message);
      await loadData();
    } catch (e) {
      notify(e.message, 'error');
    }
  }

  async function saveBudget(payload) {
    await apiRequest('/budgets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    notify('Budget saved.');
    const data = await apiRequest(`/budgets?month=${payload.month}&year=${payload.year}`);
    setBudgets(data.budgets || []);
  }

  async function deleteBudget(id) {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await apiRequest(`/budgets/${id}`, { method: 'DELETE' });
      notify('Budget deleted.');
      const data = await apiRequest(`/budgets?month=${monthNow()}&year=${yearNow()}`);
      setBudgets(data.budgets || []);
    } catch (e) {
      notify(e.message, 'error');
    }
  }

  async function saveProfile(payload) {
    const data = await apiRequest('/settings/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    setUser(data.user);
  }

  async function changePassword(payload) {
    await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await logout();
  }

  async function resendVerification() {
    const data = await apiRequest('/auth/resend-verification', { method: 'POST' });
    notify(data.message);
  }

  if (booting) {
    return (
      <div className="loading-screen">
        <div className="brand-mark">
          <CircleDollarSign size={24} />
        </div>
        <span>Loading Pocketwise…</span>
      </div>
    );
  }

  if (location.pathname === '/verify-email') {
    return (
      <>
        <VerifyEmailPage onDone={() => navigate('/')} />
        <Toast toast={toast} clear={clearToast} />
      </>
    );
  }

  if (location.pathname === '/reset-password') {
    return (
      <>
        <ResetPasswordPage notify={notify} />
        <Toast toast={toast} clear={clearToast} />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen onAuthenticated={authenticated} notify={notify} />
        <Toast toast={toast} clear={clearToast} />
      </>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        open={mobileOpen}
        close={() => setMobileOpen(false)}
        user={user}
        onLogout={logout}
      />

      <main className="main-area">
        <Header
          onMenu={() => setMobileOpen(true)}
          user={user}
          pageTitle={pageTitle}
        />

        <div className="connection-note">
          <span className={`status-dot ${apiStatus}`} />
          {apiStatus === 'connected'
            ? 'Securely connected to your account'
            : apiStatus === 'checking'
              ? 'Syncing your data…'
              : 'API connection unavailable'}
        </div>

        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                data={dashboard}
                expenses={expenses}
                currency={user.currency}
                onAdd={() => setExpenseModal({})}
                lendingSummary={lendingSummary}
              />
            }
          />
          <Route
            path="/expenses"
            element={
              <ExpensesPage
                expenses={expenses}
                categories={categories}
                currency={user.currency}
                onAdd={() => setExpenseModal({})}
                onEdit={(e) => setExpenseModal(e)}
                onDelete={deleteExpense}
              />
            }
          />
          <Route
            path="/categories"
            element={
              <CategoriesPage
                categories={categories}
                onCreate={createCategory}
                onUpdate={updateCategory}
                onDelete={deleteCategory}
              />
            }
          />
          <Route
            path="/budgets"
            element={
              <BudgetsPage
                budgets={budgets}
                categories={categories}
                currency={user.currency}
                onSave={saveBudget}
                onDelete={deleteBudget}
                onLoad={loadBudgetsForPeriod}
              />
            }
          />
          <Route
            path="/reports"
            element={
              <ReportsPage
                report={report}
                currency={user.currency}
                year={reportYear}
                setYear={setReportYear}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <SettingsPage
                user={user}
                onProfileSave={saveProfile}
                onPasswordChange={changePassword}
                onResendVerification={resendVerification}
                notify={notify}
              />
            }
          />
          <Route
            path="/money-lent"
            element={
              <MoneyLentPage
                currency={user.currency}
                notify={notify}
                onChanged={loadData}
              />
            }
          />
          <Route
            path="*"
            element={
              <Dashboard
                data={dashboard}
                expenses={expenses}
                currency={user.currency}
                onAdd={() => setExpenseModal({})}
              />
            }
          />
        </Routes>

        <footer className="footer">
          © {new Date().getFullYear()} Pocketwise <span>Made for better money habits</span>
        </footer>
      </main>

      {expenseModal && (
        <ExpenseForm
          categories={categories}
          initial={expenseModal._id ? expenseModal : null}
          onClose={() => setExpenseModal(null)}
          onSave={saveExpense}
        />
      )}

      <Toast toast={toast} clear={clearToast} />
    </div>
  );
}
