import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCalculationById, deleteCalculation, isAdminLoggedIn } from '../db/storage.js'
import './admin.css'

function formatDate(iso) {
  return new Date(iso).toLocaleString('fr-DZ', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getNoteCls(note) {
  if (note === null) return 'note-empty'
  if (note >= 10) return 'note-good'
  if (note >= 8)  return 'note-warn'
  return 'note-bad'
}

export default function AdminDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [calc, setCalc] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!isAdminLoggedIn()) { navigate('/admin', { replace: true }); return }
    const record = getCalculationById(id)
    if (record) setCalc(record)
    else setNotFound(true)
  }, [id, navigate])

  function handleDelete() {
    deleteCalculation(id)
    navigate('/admin/dashboard', { replace: true })
  }

  function exportSingleCSV() {
    if (!calc) return
    const header = 'Module,Exam,CA,Note/20,Coef\n'
    const rows = calc.results.map(r => {
      const g = calc.grades[r.id] || {}
      return `"${r.name}",${g.exam || ''},${g.ca || ''},${r.note !== null ? r.note.toFixed(2) : ''},${r.coef}`
    }).join('\n')
    const bom = '\uFEFF'
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href = url
    a.download = `${calc.studentName.replace(/\s+/g, '_')}_S2.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (notFound) {
    return (
      <div className="adm-app adm-not-found">
        <div className="adm-nf-card">
          <span className="adm-nf-icon">🔍</span>
          <h2>Calcul introuvable</h2>
          <p>Ce calcul a peut-être été supprimé.</p>
          <Link to="/admin/dashboard" className="adm-btn adm-btn-primary">
            ← Retour au dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!calc) return null

  const mention = calc.mention
  const mentionCls = calc.mentionCls

  return (
    <div className="adm-app">
      <aside className="adm-sidebar">
        <div className="adm-logo">
          <span className="adm-logo-icon">📊</span>
          <div>
            <div className="adm-logo-title">Admin Panel</div>
            <div className="adm-logo-sub">S2 Grade Tracker</div>
          </div>
        </div>
        <nav className="adm-nav">
          <Link to="/admin/dashboard" className="adm-nav-item">
            <span>🏠</span> Dashboard
          </Link>
          <Link to="/admin/dashboard#table" className="adm-nav-item active">
            <span>📋</span> Calculs
          </Link>
          <a href="/" className="adm-nav-item" target="_blank" rel="noreferrer">
            <span>🎓</span> Calculateur
          </a>
        </nav>
      </aside>

      <main className="adm-main">
        {/* Top bar */}
        <div className="adm-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link to="/admin/dashboard" className="adm-back-btn">
              ← Retour
            </Link>
            <div>
              <h1 className="adm-page-title">Détail du calcul</h1>
              <p className="adm-page-sub">{formatDate(calc.date)}</p>
            </div>
          </div>
          <div className="adm-topbar-actions">
            <button className="adm-btn adm-btn-secondary" onClick={exportSingleCSV} id="detail-export-csv-btn">
              <span>↓</span> Exporter CSV
            </button>
            <button className="adm-btn adm-btn-danger" onClick={() => setConfirmDelete(true)} id="detail-delete-btn">
              <span>🗑️</span> Supprimer
            </button>
          </div>
        </div>

        {/* Student summary card */}
        <div className={`adm-detail-hero adm-avg-${mentionCls}`}>
          <div className="adm-detail-hero-left">
            <div className="adm-detail-avatar">
              {calc.studentName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="adm-detail-name">{calc.studentName}</div>
              <div className="adm-detail-meta">
                <span>{calc.semester}</span>
                <span>·</span>
                <span>{calc.results?.length || 0} modules</span>
                <span>·</span>
                <span>{formatDate(calc.date)}</span>
              </div>
            </div>
          </div>
          <div className="adm-detail-hero-right">
            <div className={`adm-detail-avg adm-avg-color-${mentionCls}`}>
              {calc.moyenne.toFixed(2)}<span className="adm-detail-avg-denom">/20</span>
            </div>
            <span className={`adm-mention-badge adm-mention-${mentionCls}`}>{mention}</span>
          </div>
        </div>

        {/* Grades table */}
        <div className="adm-table-card">
          <div className="adm-table-header-row">
            <span className="adm-chart-title">📚 Détail des notes par module</span>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Examen</th>
                  <th>TD / CA</th>
                  <th>Note / 20</th>
                  <th>Coef</th>
                  <th>Note pondérée</th>
                </tr>
              </thead>
              <tbody>
                {calc.results?.map(r => {
                  const g = calc.grades?.[r.id] || {}
                  const noteCls = getNoteCls(r.note)
                  return (
                    <tr key={r.id} className="adm-tr">
                      <td className="adm-td-name">{r.name}</td>
                      <td className="adm-td-center">
                        {g.exam !== '' && g.exam !== undefined ? `${g.exam}/20` : <span className="adm-na">—</span>}
                      </td>
                      <td className="adm-td-center">
                        {g.ca !== '' && g.ca !== undefined ? `${g.ca}/20` : <span className="adm-na">—</span>}
                      </td>
                      <td>
                        <span className={`adm-note-chip adm-${noteCls}`}>
                          {r.note !== null ? r.note.toFixed(2) : '—'}
                        </span>
                      </td>
                      <td className="adm-td-center">{r.coef}</td>
                      <td className="adm-td-center adm-td-weighted">
                        {r.note !== null
                          ? (r.note * r.coef).toFixed(2)
                          : <span className="adm-na">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="adm-tfoot-row">
                  <td colSpan={3} />
                  <td colSpan={2} className="adm-tfoot-label">Moyenne pondérée</td>
                  <td>
                    <span className={`adm-avg-chip adm-avg-${mentionCls}`}>
                      {calc.moyenne.toFixed(2)}/20
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </main>

      {/* Delete modal */}
      {confirmDelete && (
        <div className="adm-modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-icon">⚠️</div>
            <h2 className="adm-modal-title">Supprimer ce calcul ?</h2>
            <p className="adm-modal-sub">
              Le calcul de <strong>{calc.studentName}</strong> sera définitivement supprimé.
            </p>
            <div className="adm-modal-actions">
              <button className="adm-btn adm-btn-danger" onClick={handleDelete}>
                Oui, supprimer
              </button>
              <button className="adm-btn adm-btn-secondary" onClick={() => setConfirmDelete(false)}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
