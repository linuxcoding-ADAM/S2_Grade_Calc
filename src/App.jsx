import { useState } from 'react'
import './App.css'

// S2 modules with their weights and coefficients
const modules = [
  { id: 'algebre2',    name: 'Algèbre 2',                     examW: 0.6, caW: 0.4, coef: 3 },
  { id: 'analyse2',   name: 'Analyse 2',                     examW: 0.6, caW: 0.4, coef: 3 },
  { id: 'electro',    name: 'Électricité et magnétisme',      examW: 0.6, caW: 0.4, coef: 3 },
  { id: 'prog',       name: 'Initiation à la programmation',  examW: 0.6, caW: 0.4, coef: 3 },
  { id: 'logiciels',  name: 'Logiciels libres-open sources',  examW: 0.6, caW: 0.4, coef: 2 },
  { id: 'thermo',     name: 'Thermodynamique',                examW: 0.6, caW: 0.4, coef: 3 },
  { id: 'tp_electro', name: 'TP Électricité et magnétisme',   examW: 0,   caW: 1,   coef: 1 },
  { id: 'tp_thermo',  name: 'TP Thermodynamique',             examW: 0,   caW: 1,   coef: 1 },
]

function calcNote(mod, exam, ca) {
  if (mod.examW === 0) return ca !== '' ? parseFloat(ca) : null
  if (exam !== '' && ca !== '') return parseFloat(exam) * mod.examW + parseFloat(ca) * mod.caW
  return null
}

function getMention(avg) {
  if (avg >= 16) return { label: 'Excellent',    color: '#10b981' }
  if (avg >= 14) return { label: 'Très Bien',    color: '#10b981' }
  if (avg >= 12) return { label: 'Bien',          color: '#0d9488' }
  if (avg >= 10) return { label: 'Passable',      color: '#f59e0b' }
  return               { label: 'Insuffisant',   color: '#ef4444' }
}

function getNoteColor(note) {
  if (note === null) return '#334155'
  if (note >= 10) return '#0d9488'
  if (note >= 8)  return '#f59e0b'
  return '#ef4444'
}

export default function App() {
  const [grades, setGrades] = useState(
    () => Object.fromEntries(modules.map(m => [m.id, { exam: '', ca: '' }]))
  )

  function handleChange(id, field, val) {
    // clamp between 0 and 20
    let v = val
    if (val !== '' && parseFloat(val) > 20) v = '20'
    if (val !== '' && parseFloat(val) < 0)  v = '0'
    setGrades(prev => ({ ...prev, [id]: { ...prev[id], [field]: v } }))
  }

  function reset() {
    setGrades(Object.fromEntries(modules.map(m => [m.id, { exam: '', ca: '' }])))
  }

  // compute per-module results
  const results = modules.map(m => {
    const g = grades[m.id]
    const note = calcNote(m, g.exam, g.ca)
    return { ...m, note: note !== null ? Math.round(note * 100) / 100 : null }
  })

  // weighted average over filled modules
  const filled = results.filter(r => r.note !== null)
  const totalCoef = filled.reduce((sum, r) => sum + r.coef, 0)
  const moyenne = totalCoef > 0
    ? Math.round((filled.reduce((sum, r) => sum + r.note * r.coef, 0) / totalCoef) * 100) / 100
    : null

  const mention = moyenne !== null ? getMention(moyenne) : null

  return (
    <div className="app">
      {/* header */}
      <header className="header">
        <div className="header-inner">
          <span className="header-badge">ST · L1 · Béjaïa</span>
          <h1 className="header-title">Calculateur S2</h1>
          <p className="header-sub">Entre tes notes pour calculer ta moyenne</p>
        </div>
      </header>

      <main className="main">
        {/* average card — shows once any module is filled */}
        {moyenne !== null && (
          <div className="avg-card">
            <div className="avg-left">
              <span className="avg-label">Moyenne générale</span>
              <span className="avg-value" style={{ color: mention.color }}>
                {moyenne.toFixed(2)}
                <span className="avg-denom">/20</span>
              </span>
              {filled.length < modules.length && (
                <span className="avg-note">
                  basée sur {filled.length}/{modules.length} modules
                </span>
              )}
            </div>
            <span className="mention-badge" style={{ background: mention.color + '20', color: mention.color }}>
              {mention.label}
            </span>
          </div>
        )}

        {/* module cards */}
        <div className="cards">
          {results.map((mod) => {
            const g = grades[mod.id]
            const isTPOnly = mod.examW === 0
            const noteColor = getNoteColor(mod.note)

            return (
              <div key={mod.id} className="card">
                <div className="card-top">
                  <div>
                    <h2 className="card-name">{mod.name}</h2>
                    <div className="card-meta">
                      {!isTPOnly && <span>Exam {mod.examW * 100}%</span>}
                      <span>CA {mod.caW * 100}%</span>
                      <span>Coef {mod.coef}</span>
                    </div>
                  </div>

                  {mod.note !== null && (
                    <div className="note-chip" style={{ borderColor: noteColor + '50', background: noteColor + '15' }}>
                      <span style={{ color: noteColor }}>{mod.note.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="inputs-row">
                  {!isTPOnly && (
                    <div className="input-group">
                      <label className="input-label exam-label">🎓 Examen</label>
                      <input
                        type="number"
                        className="grade-input"
                        placeholder="0 – 20"
                        value={g.exam}
                        min="0"
                        max="20"
                        step="0.25"
                        onChange={e => handleChange(mod.id, 'exam', e.target.value)}
                      />
                    </div>
                  )}
                  <div className="input-group">
                    <label className="input-label ca-label">
                      📝 {isTPOnly ? 'Note TP' : 'TD / CA'}
                    </label>
                    <input
                      type="number"
                      className="grade-input"
                      placeholder="0 – 20"
                      value={g.ca}
                      min="0"
                      max="20"
                      step="0.25"
                      onChange={e => handleChange(mod.id, 'ca', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* recap table */}
        {filled.length > 0 && (
          <div className="recap">
            <h3 className="recap-title">Récapitulatif</h3>
            <div className="recap-list">
              {results.map(r => r.note !== null && (
                <div key={r.id} className="recap-row">
                  <span className="recap-name">{r.name}</span>
                  <span className="recap-coef">coef {r.coef}</span>
                  <span className="recap-note" style={{ color: getNoteColor(r.note) }}>
                    {r.note.toFixed(2)}
                  </span>
                </div>
              ))}

              {moyenne !== null && (
                <div className="recap-avg-row">
                  <span>Moyenne S2</span>
                  <span style={{ color: mention.color }}>{moyenne.toFixed(2)}/20</span>
                </div>
              )}
            </div>
          </div>
        )}

        <button className="reset-btn" onClick={reset}>
          Réinitialiser
        </button>
      </main>
    </div>
  )
}
