import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin, isAdminLoggedIn } from '../db/storage.js'
import './admin.css'

export default function AdminLogin() {
  const [value, setValue]       = useState('')
  const [error, setError]       = useState(false)
  const [shake, setShake]       = useState(false)
  const [show, setShow]         = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [loading, setLoading]   = useState(false)
  const inputRef  = useRef(null)
  const navigate  = useNavigate()

  // Already logged in → go straight to dashboard
  useEffect(() => {
    if (isAdminLoggedIn()) navigate('/admin/dashboard', { replace: true })
    else inputRef.current?.focus()
  }, [navigate])

  async function handleSubmit() {
    if (!value.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))  // simulate latency
    if (adminLogin(value)) {
      navigate('/admin/dashboard', { replace: true })
    } else {
      setAttempts(a => a + 1)
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setValue('')
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleSubmit()
    if (error) setError(false)
  }

  return (
    <div className="gate-overlay">
      <div className="gate-orb gate-orb-1" />
      <div className="gate-orb gate-orb-2" />
      <div className="gate-orb gate-orb-3" />
      <div className="gate-grid" />

      <div className={`gate-card ${shake ? 'gate-shake' : ''}`}>
        <div className="gate-accent-bar" />

        <div className="gate-icon-wrap">
          <div className="gate-icon-ring" />
          <span className="gate-icon">⚙️</span>
        </div>

        <div className="gate-univ-tag">Université Béjaïa · L1 ST</div>
        <h1 className="gate-title">Panneau Admin</h1>
        <p className="gate-sub">
          Accès réservé à l'administrateur.
          <br />Entrez le mot de passe admin pour continuer.
        </p>

        <div className="gate-input-wrap">
          <span className="gate-input-icon">🔑</span>
          <input
            ref={inputRef}
            id="admin-password-input"
            className={`gate-input ${error ? 'gate-input-error' : ''}`}
            type={show ? 'text' : 'password'}
            placeholder="Mot de passe admin..."
            value={value}
            onChange={e => { setValue(e.target.value); setError(false) }}
            onKeyDown={handleKey}
            autoComplete="current-password"
            spellCheck="false"
            disabled={loading}
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

        {error && (
          <p className="gate-error">
            ⚠ Mot de passe incorrect{attempts > 1 ? ` (${attempts} tentatives)` : ''}.
          </p>
        )}

        <button
          className="gate-btn"
          onClick={handleSubmit}
          disabled={loading || !value.trim()}
          id="admin-login-btn"
        >
          {loading
            ? <><span className="gate-spinner" /> Vérification...</>
            : <><span>Accéder au dashboard</span><span className="gate-btn-arrow">→</span></>}
        </button>

        <p className="gate-hint">
          <a href="/" className="admin-back-link">← Retour au calculateur</a>
        </p>
      </div>
    </div>
  )
}
