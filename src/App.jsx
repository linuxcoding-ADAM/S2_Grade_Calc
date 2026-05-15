import { useState } from 'react'
import { exportToPDF } from './pdfExport'
import './App.css'

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
  if (avg >= 16) return { label: 'Excellent',   cls: 'green'  }
  if (avg >= 14) return { label: 'Très Bien',   cls: 'green'  }
  if (avg >= 12) return { label: 'Bien',         cls: 'teal'   }
  if (avg >= 10) return { label: 'Passable',     cls: 'orange' }
  return               { label: 'Insuffisant',  cls: 'red'    }
}

function getNoteCls(note) {
  if (note === null) return ''
  if (note >= 10) return 'note-good'
  if (note >= 8)  return 'note-warn'
  return 'note-bad'
}

function clampVal(val) {
  if (val === '') return ''
  const n = parseFloat(val)
  if (n > 20) return '20'
  if (n < 0)  return '0'
  return val
}

export default function App() {
  const [grades, setGrades] = useState(
    () => Object.fromEntries(modules.map(m => [m.id, { exam: '', ca: '' }]))
  )
  const [studentName, setStudentName] = useState('')
  const [exporting, setExporting] = useState(false)

  function handleChange(id, field, val) {
    setGrades(prev => ({ ...prev, [id]: { ...prev[id], [field]: clampVal(val) } }))
  }

  function reset() {
    setGrades(Object.fromEntries(modules.map(m => [m.id, { exam: '', ca: '' }])))
    setStudentName('')
  }

  const results = modules.map(m => {
    const g = grades[m.id]
    const raw = calcNote(m, g.exam, g.ca)
    const note = raw !== null ? Math.round(raw * 100) / 100 : null
    return { ...m, note }
  })

  const filled = results.filter(r => r.note !== null)
  const totalCoef = filled.reduce((s, r) => s + r.coef, 0)
  const moyenne = totalCoef > 0
    ? Math.round((filled.reduce((s, r) => s + r.note * r.coef, 0) / totalCoef) * 100) / 100
    : null

  const mention = moyenne !== null ? getMention(moyenne) : null

  async function handleExport() {
    setExporting(true)
    await new Promise(r => setTimeout(r, 80))
    exportToPDF(results, moyenne, studentName)
    setExporting(false)
  }

  return (
    <div className="app">

      <header className="header">
        <div className="header-inner">
          <div className="header-top">
            <div>
              <span className="univ-tag">Université Béjaïa · L1 ST</span>
              <h1>Calculateur de notes <span className="s2-tag">S2</span></h1>
            </div>
            <div className="header-icon">🎓</div>
          </div>
          <p className="header-sub">Saisis tes notes pour calculer ta moyenne du semestre</p>
        </div>
      </header>

      <div className="main">

        <div className="name-row">
          <label className="name-label">Prénom et nom (optionnel — apparaît sur le PDF)</label>
          <input
            className="name-input"
            type="text"
            placeholder="ex: Youcef Bouali"
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
          />
        </div>

        {moyenne !== null && (
          <div className={`avg-card avg-${mention.cls}`}>
            <div className="avg-left">
              <span className="avg-eyebrow">Moyenne générale</span>
              <div className="avg-value-row">
                <span className="avg-value">{moyenne.toFixed(2)}</span>
                <span className="avg-denom">/20</span>
              </div>
              {filled.length < modules.length && (
                <span className="avg-partial">{filled.length}/{modules.length} modules renseignés</span>
              )}
            </div>
            <span className={`mention mention-${mention.cls}`}>{mention.label}</span>
          </div>
        )}

        <div className="cards">
          {results.map(mod => {
            const g = grades[mod.id]
            const isTP = mod.examW === 0
            const pct = mod.note !== null ? (mod.note / 20) * 100 : 0

            return (
              <div key={mod.id} className="card">
                <div className="card-header">
                  <div className="card-title-group">
                    <h2 className="card-name">{mod.name}</h2>
                    <div className="card-meta">
                      {!isTP && <span>Exam {mod.examW * 100}%</span>}
                      <span>CA {mod.caW * 100}%</span>
                      <span className="coef-badge">Coef {mod.coef}</span>
                    </div>
                  </div>
                  {mod.note !== null && (
                    <div className={`note-chip ${getNoteCls(mod.note)}`}>
                      {mod.note.toFixed(2)}
                    </div>
                  )}
                </div>

                {mod.note !== null && (
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${getNoteCls(mod.note)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}

                <div className="inputs-row">
                  {!isTP && (
                    <div className="input-group">
                      <label className="input-label label-exam">Examen</label>
                      <input
                        type="number"
                        className="grade-input"
                        placeholder="/ 20"
                        value={g.exam}
                        min="0" max="20" step="0.25"
                        onChange={e => handleChange(mod.id, 'exam', e.target.value)}
                      />
                    </div>
                  )}
                  <div className="input-group">
                    <label className="input-label label-ca">
                      {isTP ? 'Note TP' : 'TD / CA'}
                    </label>
                    <input
                      type="number"
                      className="grade-input"
                      placeholder="/ 20"
                      value={g.ca}
                      min="0" max="20" step="0.25"
                      onChange={e => handleChange(mod.id, 'ca', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filled.length > 0 && (
          <div className="recap">
            <div className="recap-head">Récapitulatif</div>
            {results.map(r => r.note !== null && (
              <div key={r.id} className="recap-row">
                <span className="recap-name">{r.name}</span>
                <span className="recap-coef">coef {r.coef}</span>
                <span className={`recap-note ${getNoteCls(r.note)}`}>{r.note.toFixed(2)}</span>
              </div>
            ))}
            {moyenne !== null && (
              <div className={`recap-avg mention-${mention.cls}`}>
                <span>Moyenne S2</span>
                <span>{moyenne.toFixed(2)} / 20</span>
              </div>
            )}
          </div>
        )}

        <div className="actions">
          {filled.length > 0 && (
            <button className="btn-export" onClick={handleExport} disabled={exporting}>
              {exporting
                ? <><span className="spinner" /> Génération...</>
                : <><span>↓</span> Exporter en PDF</>
              }
            </button>
          )}
          <button className="btn-reset" onClick={reset}>Réinitialiser</button>
        </div>

      </div>
    </div>
  )
}