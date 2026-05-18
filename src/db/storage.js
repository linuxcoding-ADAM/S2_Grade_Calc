/**
 * storage.js — localStorage-based database for grade calculations.
 * Drop-in replaceable with a Supabase/fetch API without changing callers.
 */

const DB_KEY = 's2_grade_calc_db'

/** @returns {Array} all saved calculations */
export function getCalculations() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY) || '[]')
  } catch {
    return []
  }
}

/** @returns {Object|null} single calculation by id */
export function getCalculationById(id) {
  return getCalculations().find(c => c.id === id) || null
}

/**
 * Save a new calculation. Returns the saved record.
 * @param {{ studentName, grades, results, moyenne, mention }} data
 */
export function saveCalculation(data) {
  const all = getCalculations()
  const record = {
    id: crypto.randomUUID(),
    studentName: data.studentName,
    date: new Date().toISOString(),
    grades: data.grades,           // raw grade inputs per module
    results: data.results,         // computed notes per module
    moyenne: data.moyenne,         // final weighted average
    mention: data.mention,         // label e.g. "Très Bien"
    mentionCls: data.mentionCls,   // color class
    semester: data.semester || 'S2',
  }
  all.unshift(record)              // newest first
  localStorage.setItem(DB_KEY, JSON.stringify(all))
  return record
}

/** Delete a calculation by id. Returns remaining records. */
export function deleteCalculation(id) {
  const remaining = getCalculations().filter(c => c.id !== id)
  localStorage.setItem(DB_KEY, JSON.stringify(remaining))
  return remaining
}

/** Clear all calculations (use with caution). */
export function clearAllCalculations() {
  localStorage.removeItem(DB_KEY)
}

// ── Admin auth helpers ────────────────────────────────────
const ADMIN_KEY = 's2_admin_token'
const ADMIN_PASSWORD = 'her_name_is_imane'

export function adminLogin(password) {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_KEY, 'yes')
    return true
  }
  return false
}

export function isAdminLoggedIn() {
  return sessionStorage.getItem(ADMIN_KEY) === 'yes'
}

export function adminLogout() {
  sessionStorage.removeItem(ADMIN_KEY)
}
