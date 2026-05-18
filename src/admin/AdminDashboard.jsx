import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  getCalculations,
  deleteCalculation,
  isAdminLoggedIn,
  adminLogout,
} from '../db/storage.js'
import './admin.css'

const ROWS_PER_PAGE = 10

const MENTION_COLORS = {
  green:  '#0d9488',
  teal:   '#0891b2',
  orange: '#f59e0b',
  red:    '#ef4444',
}

// ── helpers ──────────────────────────────────────────────────
function formatDate(iso) {
  return new Date(iso).toLocaleString('fr-DZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

// ── CSV export ────────────────────────────────────────────────
function exportCSV(calculations) {
  const header = 'ID,Nom,Date,Moyenne,Mention,Semestre\n'
  const rows = calculations.map(c =>
    `${c.id},"${c.studentName}","${formatDate(c.date)}",${c.moyenne},"${c.mention}",${c.semester}`
  ).join('\n')
  const bom = '\uFEFF'
  const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `grades_export_${todayISO()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="adm-stat-card" style={{ '--accent': accent }}>
      <div className="adm-stat-icon">{icon}</div>
      <div className="adm-stat-body">
        <span className="adm-stat-label">{label}</span>
        <span className="adm-stat-value">{value}</span>
        {sub && <span className="adm-stat-sub">{sub}</span>}
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [calcs, setCalcs]         = useState([])
  const [search, setSearch]       = useState('')
  const [sortField, setSortField] = useState('date')
  const [sortDir, setSortDir]     = useState('desc')
  const [filterMention, setFilterMention] = useState('all')
  const [page, setPage]           = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  // Auth guard
  useEffect(() => {
    if (!isAdminLoggedIn()) navigate('/admin', { replace: true })
  }, [navigate])

  // Load data
  function reload() { setCalcs(getCalculations()) }
  useEffect(() => { reload() }, [])

  // ── Stats ──────────────────────────────────────────────────
  const today    = todayISO()
  const todayCount = calcs.filter(c => c.date.slice(0, 10) === today).length
  const avgGlobal  = calcs.length
    ? (calcs.reduce((s, c) => s + c.moyenne, 0) / calcs.length).toFixed(2)
    : '—'

  const mentionCounts = calcs.reduce((acc, c) => {
    acc[c.mention] = (acc[c.mention] || 0) + 1
    return acc
  }, {})
  const topMention = Object.entries(mentionCounts).sort((a, b) => b[1] - a[1])[0]

  // ── Charts data ────────────────────────────────────────────
  const barData = useMemo(() => {
    const days = getLast7Days()
    return days.map(day => ({
      day: day.slice(5),   // MM-DD
      count: calcs.filter(c => c.date.slice(0, 10) === day).length,
    }))
  }, [calcs])

  const pieData = useMemo(() => {
    const map = {}
    calcs.forEach(c => { map[c.mention] = (map[c.mention] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [calcs])

  // ── Filter / sort / paginate ────────────────────────────────
  const filtered = useMemo(() => {
    let data = [...calcs]
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      data = data.filter(c => c.studentName.toLowerCase().includes(q))
    }
    if (filterMention !== 'all') {
      data = data.filter(c => c.mention === filterMention)
    }
    data.sort((a, b) => {
      let va = a[sortField], vb = b[sortField]
      if (sortField === 'date') { va = new Date(va); vb = new Date(vb) }
      if (sortField === 'moyenne') { va = +va; vb = +vb }
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })
    return data
  }, [calcs, search, sortField, sortDir, filterMention])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE))
  const pageData   = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
    setPage(1)
  }

  function sortIcon(field) {
    if (sortField !== field) return '↕'
    return sortDir === 'asc' ? '↑' : '↓'
  }

  // ── Delete flow ─────────────────────────────────────────────
  function startDelete(calc) {
    setDeleteTarget(calc)
    setDeleteConfirm('')
  }

  function confirmDelete() {
    if (deleteTarget) {
      deleteCalculation(deleteTarget.id)
      setDeleteTarget(null)
      reload()
    }
  }

  // ── Mentions list for filter ────────────────────────────────
  const mentionOptions = ['all', ...new Set(calcs.map(c => c.mention))]

  function handleLogout() {
    adminLogout()
    navigate('/admin', { replace: true })
  }

  const mentionClsMap = calcs.reduce((acc, c) => {
    acc[c.mention] = c.mentionCls
    return acc
  }, {})

  return (
    <div className="adm-app">
      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="adm-sidebar">
        <div className="adm-logo">
          <span className="adm-logo-icon">📊</span>
          <div>
            <div className="adm-logo-title">Admin Panel</div>
            <div className="adm-logo-sub">S2 Grade Tracker</div>
          </div>
        </div>
        <nav className="adm-nav">
          <a href="#dashboard" className="adm-nav-item active">
            <span>🏠</span> Dashboard
          </a>
          <a href="#table" className="adm-nav-item">
            <span>📋</span> Calculs
          </a>
          <a href="#charts" className="adm-nav-item">
            <span>📈</span> Analytique
          </a>
          <a href="/" className="adm-nav-item" target="_blank" rel="noreferrer">
            <span>🎓</span> Calculateur
          </a>
        </nav>
        <button className="adm-logout-btn" onClick={handleLogout}>
          <span>🚪</span> Déconnexion
        </button>
      </aside>

      {/* ── Main content ─────────────────────────────── */}
      <main className="adm-main" id="dashboard">
        {/* Header */}
        <div className="adm-topbar">
          <div>
            <h1 className="adm-page-title">Tableau de bord</h1>
            <p className="adm-page-sub">Vue globale des calculs de notes</p>
          </div>
          <div className="adm-topbar-actions">
            <button
              className="adm-btn adm-btn-secondary"
              onClick={() => exportCSV(filtered)}
              title="Exporter CSV"
              id="export-csv-btn"
            >
              <span>↓</span> Exporter CSV
            </button>
          </div>
        </div>

        {/* ── Stat cards ─────────────────────────────── */}
        <div className="adm-stats-row">
          <StatCard icon="🧮" label="Total calculs"      value={calcs.length}   accent="#0d9488" />
          <StatCard icon="📅" label="Aujourd'hui"        value={todayCount}     accent="#0891b2" />
          <StatCard icon="🏆" label="Mention dominante"  value={topMention ? topMention[0] : '—'} sub={topMention ? `${topMention[1]} fois` : ''} accent="#f59e0b" />
          <StatCard icon="⭐" label="Moyenne générale"   value={avgGlobal}      sub="sur 20" accent="#8b5cf6" />
        </div>

        {/* ── Charts ─────────────────────────────────── */}
        <div className="adm-charts-row" id="charts">
          <div className="adm-chart-card">
            <div className="adm-chart-title">📈 Calculs (7 derniers jours)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 10, color: '#f1f5f9' }}
                  cursor={{ fill: 'rgba(13,148,136,0.08)' }}
                />
                <Bar dataKey="count" fill="#0d9488" radius={[6,6,0,0]} name="Calculs" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="adm-chart-card">
            <div className="adm-chart-title">🎯 Distribution des mentions</div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={MENTION_COLORS[mentionClsMap[entry.name]] || '#64748b'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 10, color: '#f1f5f9' }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={v => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="adm-chart-empty">Aucune donnée disponible</div>
            )}
          </div>
        </div>

        {/* ── Table ──────────────────────────────────── */}
        <div className="adm-table-card" id="table">
          <div className="adm-table-toolbar">
            <input
              id="admin-search"
              className="adm-search"
              type="text"
              placeholder="🔍  Rechercher par nom..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
            <select
              id="admin-mention-filter"
              className="adm-select"
              value={filterMention}
              onChange={e => { setFilterMention(e.target.value); setPage(1) }}
            >
              {mentionOptions.map(m => (
                <option key={m} value={m}>{m === 'all' ? 'Toutes les mentions' : m}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="adm-table-empty">
              <span className="adm-empty-icon">📭</span>
              <p>Aucun calcul trouvé</p>
              {calcs.length === 0 && <p className="adm-empty-sub">Demandez aux étudiants d'utiliser le calculateur.</p>}
            </div>
          ) : (
            <>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th onClick={() => toggleSort('studentName')} className="adm-th-sort">
                        Nom {sortIcon('studentName')}
                      </th>
                      <th onClick={() => toggleSort('date')} className="adm-th-sort">
                        Date {sortIcon('date')}
                      </th>
                      <th onClick={() => toggleSort('moyenne')} className="adm-th-sort">
                        Moyenne {sortIcon('moyenne')}
                      </th>
                      <th>Mention</th>
                      <th>Semestre</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.map(c => (
                      <tr key={c.id} className="adm-tr">
                        <td className="adm-td-name">{c.studentName}</td>
                        <td className="adm-td-date">{formatDate(c.date)}</td>
                        <td>
                          <span className={`adm-avg-chip adm-avg-${c.mentionCls}`}>
                            {c.moyenne.toFixed(2)}/20
                          </span>
                        </td>
                        <td>
                          <span className={`adm-mention-badge adm-mention-${c.mentionCls}`}>
                            {c.mention}
                          </span>
                        </td>
                        <td><span className="adm-semester-tag">{c.semester}</span></td>
                        <td>
                          <div className="adm-row-actions">
                            <Link
                              to={`/admin/calc/${c.id}`}
                              className="adm-action-btn adm-action-view"
                              title="Voir le détail"
                            >
                              👁️
                            </Link>
                            <button
                              className="adm-action-btn adm-action-delete"
                              onClick={() => startDelete(c)}
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="adm-pagination">
                <span className="adm-page-info">
                  {filtered.length} résultat{filtered.length > 1 ? 's' : ''} ·
                  Page {page} / {totalPages}
                </span>
                <div className="adm-page-btns">
                  <button
                    className="adm-page-btn"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                  >«</button>
                  <button
                    className="adm-page-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >‹</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                    return (
                      <button
                        key={p}
                        className={`adm-page-btn ${p === page ? 'active' : ''}`}
                        onClick={() => setPage(p)}
                      >{p}</button>
                    )
                  })}
                  <button
                    className="adm-page-btn"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >›</button>
                  <button
                    className="adm-page-btn"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                  >»</button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ── Delete confirmation modal ─────────────────── */}
      {deleteTarget && (
        <div className="adm-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-icon">🗑️</div>
            <h2 className="adm-modal-title">Confirmer la suppression</h2>
            <p className="adm-modal-sub">
              Vous allez supprimer le calcul de <strong>{deleteTarget.studentName}</strong>.
              <br />Cette action est irréversible.
            </p>
            <div className="adm-modal-actions">
              <button
                className="adm-btn adm-btn-danger"
                onClick={confirmDelete}
                id="confirm-delete-btn"
              >
                Supprimer définitivement
              </button>
              <button
                className="adm-btn adm-btn-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
