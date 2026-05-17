import { useState, useEffect, useRef } from 'react'
import { exportToPDF } from './pdfExport.js'
import './App.css'

const PASSWORD = 's2_fl_jib'

const modules = [
  { id: 'algebre2',    name: 'Algèbre 2',                     examW: 0.6, caW: 0.4, coef: 2 },
  { id: 'analyse2',   name: 'Analyse 2',                     examW: 0.6, caW: 0.4, coef: 3 },
  { id: 'electro',    name: 'Électricité et magnétisme',      examW: 0.6, caW: 0.4, coef: 3 },
  { id: 'prog',       name: 'Initiation à la programmation',  examW: 0.6, caW: 0.4, coef: 2 },
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

// ── Password Gate ────────────────────────────────────────────
function PasswordGate({ onUnlock }) {
  const [value, setValue]     = useState('')
  const [error, setError]     = useState(false)
  const [shake, setShake]     = useState(false)
  const [show, setShow]       = useState(false)
  const [attempts, setAttempts] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit() {
    if (value === PASSWORD) {
      onUnlock()
    } else {
      setAttempts(a => a + 1)
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setValue('')
      inputRef.current?.focus()
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSubmit()
    if (error) setError(false)
  }

  return (
    <div className="gate-overlay">
      {/* Animated background orbs */}
      <div className="gate-orb gate-orb-1" />
      <div className="gate-orb gate-orb-2" />
      <div className="gate-orb gate-orb-3" />

      {/* Grid pattern */}
      <div className="gate-grid" />

      <div className={`gate-card ${shake ? 'gate-shake' : ''}`}>
        {/* Top accent bar */}
        <div className="gate-accent-bar" />

        {/* Icon */}
        <div className="gate-icon-wrap">
          <div className="gate-icon-ring" />
          <span className="gate-icon">🔐</span>
        </div>

        {/* Titles */}
        <div className="gate-univ-tag">Université Béjaïa · L1 ST</div>
        <h1 className="gate-title">Accès Sécurisé</h1>
        <p className="gate-sub">Entrez le mot de passe pour accéder au calculateur de notes S2</p>

        {/* Input */}
        <div className="gate-input-wrap">
          <span className="gate-input-icon">🔑</span>
          <input
            ref={inputRef}
            className={`gate-input ${error ? 'gate-input-error' : ''}`}
            type={show ? 'text' : 'password'}
            placeholder="Mot de passe..."
            value={value}
            onChange={e => { setValue(e.target.value); setError(false) }}
            onKeyDown={handleKey}
            autoComplete="off"
            spellCheck="false"
          />
          <button
            className="gate-show-btn"
            onClick={() => setShow(s => !s)}
            tabIndex={-1}
            type="button"
            aria-label={show ? 'Masquer' : 'Afficher'}
          >
            {show ? '🙈' : '👁️'}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <p className="gate-error">
            ⚠ Mot de passe incorrect{attempts > 1 ? ` (${attempts} tentatives)` : ''}.
          </p>
        )}

        {/* Submit */}
        <button className="gate-btn" onClick={handleSubmit}>
          <span>Accéder</span>
          <span className="gate-btn-arrow">→</span>
        </button>

        {/* Footer hint */}
        <p className="gate-hint">Accès réservé aux étudiants ST — Béjaïa</p>
      </div>
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────
export default function App() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem('s2_unlocked') === 'yes'
  )
  const [grades, setGrades] = useState(
    () => Object.fromEntries(modules.map(m => [m.id, { exam: '', ca: '' }]))
  )
  const [studentName, setStudentName]   = useState('')
  const [nameTouched, setNameTouched]   = useState(false)
  const [exporting, setExporting]       = useState(false)
  const [pdfTemplate, setPdfTemplate]   = useState('pro')
  const [dark, setDark]                 = useState(() => localStorage.getItem('theme') === 'dark')
  const avgRef  = useRef(null)
  const nameRef = useRef(null)
  const prevAllFilled = useRef(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  function handleUnlock() {
    sessionStorage.setItem('s2_unlocked', 'yes')
    setUnlocked(true)
  }

  function handleChange(id, field, val) {
    setGrades(prev => ({ ...prev, [id]: { ...prev[id], [field]: clampVal(val) } }))
  }

  function reset() {
    setGrades(Object.fromEntries(modules.map(m => [m.id, { exam: '', ca: '' }])))
    setStudentName('')
    setNameTouched(false)
    prevAllFilled.current = false
  }

  const results = modules.map(m => {
    const g = grades[m.id]
    const raw = calcNote(m, g.exam, g.ca)
    const note = raw !== null ? Math.round(raw * 100) / 100 : null
    return { ...m, note }
  })

  const filled    = results.filter(r => r.note !== null)
  const allFilled = filled.length === modules.length
  const totalCoef = filled.reduce((s, r) => s + r.coef, 0)
  const moyenne   = totalCoef > 0
    ? Math.round((filled.reduce((s, r) => s + r.note * r.coef, 0) / totalCoef) * 100) / 100
    : null

  const hasName   = studentName.trim().length > 0
  const nameError = nameTouched && !hasName
  const showAvg   = allFilled && moyenne !== null && hasName
  const mention   = showAvg ? getMention(moyenne) : null
  const progress  = filled.length / modules.length
  const showNameBanner = allFilled && !hasName

  useEffect(() => {
    if (showAvg && !prevAllFilled.current) {
      prevAllFilled.current = true
      setTimeout(() => {
        avgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 120)
    }
    if (!showAvg) prevAllFilled.current = false
  }, [showAvg])

  async function handleExport() {
    if (!hasName) {
      setNameTouched(true)
      nameRef.current?.focus()
      nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setExporting(true)
    await new Promise(r => setTimeout(r, 80))
    exportToPDF(results, moyenne, studentName, pdfTemplate)
    setExporting(false)
  }

  // Show password gate if not unlocked
  if (!unlocked) {
    return (
      <div className="app">
        <PasswordGate onUnlock={handleUnlock} />
      </div>
    )
  }

  return (
    <div className="app">

      <header className="header">
        <div className="header-inner">
          <div className="header-top">
            <div className="header-left">
              <span className="univ-tag">Université Béjaïa · L1 ST</span>
              <h1>Calculateur de notes <span className="s2-tag">S2</span></h1>
              <p className="header-sub">Remplis ton nom et toutes tes notes pour révéler ta moyenne finale</p>
            </div>
            <div className="header-right">
              <button
                className="theme-toggle"
                onClick={() => setDark(d => !d)}
                aria-label="Basculer le thème"
              >
                <div className="toggle-slider" />
                <span className={`toggle-option ${!dark ? 'active' : ''}`}>☀️</span>
                <span className={`toggle-option ${dark ? 'active' : ''}`}>🌙</span>
              </button>
              <div className="header-icon">🎓</div>
            </div>
          </div>
        </div>
        <div className="header-progress-track">
          <div className="header-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </header>

      <div className="main">

        <div className="prog-pill">
          <div className="prog-bar-wrap">
            <div className="prog-bar-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="prog-label">
            {filled.length === 0
              ? 'Aucun module renseigné'
              : allFilled
              ? '✓  Tous les modules sont complétés'
              : `${filled.length} / ${modules.length} modules`}
          </span>
        </div>

        <div className="name-row">
          <label className="name-label">
            Prénom et nom
            <span className="name-required-badge">Obligatoire</span>
          </label>
          <div className={`name-input-wrap ${nameError ? 'name-error' : ''}`}>
            <span className="name-icon">👤</span>
            <input
              ref={nameRef}
              className={`name-input ${nameError ? 'input-error' : ''}`}
              type="text"
              placeholder="ex: ADAM moha slimane lakhdar tahar syphax dilane"
              value={studentName}
              onChange={e => { setStudentName(e.target.value); setNameTouched(true) }}
              onBlur={() => setNameTouched(true)}
            />
            {hasName && <span className="name-check">✓</span>}
          </div>
          {nameError && (
            <p className="name-error-msg">⚠ Entrez votre nom pour afficher la moyenne et exporter le PDF.</p>
          )}
        </div>

        {showNameBanner && (
          <div className="name-banner" onClick={() => { nameRef.current?.focus(); nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}>
            <span className="name-banner-icon">👆</span>
            <span>Tous les modules sont remplis ! Entrez votre <strong>nom</strong> pour voir votre moyenne.</span>
          </div>
        )}

        <div className="cards">
          {results.map((mod, idx) => {
            const g = grades[mod.id]
            const isTP = mod.examW === 0
            const pct = mod.note !== null ? (mod.note / 20) * 100 : 0
            const noteCls = getNoteCls(mod.note)
            const isDone = mod.note !== null

            return (
              <div
                key={mod.id}
                className={`card ${isDone ? 'card-done' : ''}`}
                style={{ '--delay': `${idx * 45}ms` }}
              >
                <div className="card-header">
                  <div className="card-title-group">
                    <div className="card-name-row">
                      <span className={`status-dot ${isDone ? noteCls : ''}`} />
                      <h2 className="card-name">{mod.name}</h2>
                    </div>
                    <div className="card-meta">
                      {!isTP && <span className="meta-tag">Exam {mod.examW * 100}%</span>}
                      <span className="meta-tag">CA {mod.caW * 100}%</span>
                      <span className="meta-tag coef-badge">Coef {mod.coef}</span>
                    </div>
                  </div>
                  <div className={`note-chip ${isDone ? noteCls : 'note-empty'}`}>
                    {isDone ? mod.note.toFixed(2) : '—'}
                  </div>
                </div>

                <div className="progress-bar">
                  <div className={`progress-fill ${noteCls}`} style={{ width: `${pct}%` }} />
                </div>

                <div className="inputs-row">
                  {!isTP && (
                    <div className="input-group">
                      <label className="input-label label-exam">
                        <span className="ldot exam-dot" /> Examen
                      </label>
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
                      <span className="ldot ca-dot" /> {isTP ? 'Note TP' : 'TD / CA'}
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
            <div className="recap-head">
              <span>Récapitulatif</span>
              <span className="recap-count">{filled.length} / {modules.length}</span>
            </div>
            {results.map(r => r.note !== null && (
              <div key={r.id} className="recap-row">
                <span className={`recap-dot ${getNoteCls(r.note)}`} />
                <span className="recap-name">{r.name}</span>
                <span className="recap-coef">×{r.coef}</span>
                <span className={`recap-note ${getNoteCls(r.note)}`}>{r.note.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {showAvg && (
          <div ref={avgRef} className={`avg-card avg-${mention.cls}`}>
            <div className="avg-glow" />
            <div className="avg-left">
              <span className="avg-eyebrow">✦ Moyenne générale S2</span>
              <div className="avg-value-row">
                <span className={`avg-value avg-color-${mention.cls}`}>{moyenne.toFixed(2)}</span>
                <span className="avg-denom">/20</span>
              </div>
              <span className="avg-note-small">{modules.length} modules · coefficients pondérés</span>
            </div>
            <div className="avg-right">
              <span className={`mention mention-${mention.cls}`}>{mention.label}</span>
            </div>
          </div>
        )}

        <div className="actions">
          {showAvg && (
            <div className="export-group">
              <div className="template-selector">
                <span className="template-label">Style PDF :</span>
                <div className="template-tabs">
                  <button
                    className={`template-tab ${pdfTemplate === 'pro' ? 'active' : ''}`}
                    onClick={() => setPdfTemplate('pro')}
                  >
                    <span>🏢</span> Professionnel
                  </button>
                  <button
                    className={`template-tab ${pdfTemplate === 'cartoon' ? 'active' : ''}`}
                    onClick={() => setPdfTemplate('cartoon')}
                  >
                    <span>🎨</span> Cartoon
                  </button>
                </div>
              </div>

              <button className="btn-export" onClick={handleExport} disabled={exporting}>
                {exporting
                  ? <><span className="spinner" /> Génération du PDF...</>
                  : <><span className="btn-dl-icon">↓</span> Exporter en PDF</>}
              </button>
            </div>
          )}

          {allFilled && !hasName && (
            <button
              className="btn-export btn-export-locked"
              onClick={() => { setNameTouched(true); nameRef.current?.focus(); nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}
            >
              <span>🔒</span> Entrez votre nom pour exporter
            </button>
          )}

          <button className="btn-reset" onClick={reset}>
            <span>↺</span> Réinitialiser
          </button>
        </div>

      </div>
    </div>
  )
}