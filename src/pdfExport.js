import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ═══════════════════════════════════════════════════════════════
//  SHARED HELPERS
// ═══════════════════════════════════════════════════════════════

function getMention(avg) {
  if (avg >= 16) return 'Excellent'
  if (avg >= 14) return 'Très Bien'
  if (avg >= 12) return 'Bien'
  if (avg >= 10) return 'Passable'
  return 'Insuffisant'
}

function isDarkMode() {
  return document.documentElement.getAttribute('data-theme') === 'dark'
}

function noteColorPRO(note, dark) {
  if (dark) {
    if (note >= 14) return { fg: [52,211,153],  bg: [6,78,59],    txt: [110,231,183] }
    if (note >= 10) return { fg: [45,212,191],  bg: [19,78,74],   txt: [94,234,212]  }
    if (note >= 8)  return { fg: [251,191,36],  bg: [69,26,3],    txt: [252,211,77]  }
    return                 { fg: [248,113,113], bg: [69,10,10],   txt: [252,165,165] }
  }
  if (note >= 14) return { fg: [16,185,129],  bg: [209,250,229], txt: [6,95,70]    }
  if (note >= 10) return { fg: [13,148,136],  bg: [204,251,241], txt: [15,118,110] }
  if (note >= 8)  return { fg: [245,158,11],  bg: [254,243,199], txt: [146,64,14]  }
  return                 { fg: [239,68,68],   bg: [254,226,226], txt: [153,27,27]  }
}

function mentionColorPRO(avg, dark) {
  if (avg >= 10) return noteColorPRO(avg >= 14 ? 16 : 10, dark)
  return noteColorPRO(0, dark)
}

// ─── Cartoon color map (always vivid regardless of dark mode) ──
const CARTOON_COLORS = {
  purple:   [130, 80, 220],
  pink:     [236, 72, 153],
  yellow:   [253, 224, 71],
  orange:   [251, 146, 60],
  green:    [74, 222, 128],
  teal:     [45, 212, 191],
  blue:     [96, 165, 250],
  red:      [248, 113, 113],
  white:    [255, 255, 255],
  black:    [15, 15, 15],
  darkBg:   [25, 20, 40],
  cardBg:   [38, 32, 58],
  cardBg2:  [44, 36, 68],
  border:   [80, 65, 110],
  starBg:   [50, 40, 80],
  text:     [245, 240, 255],
  textMid:  [180, 165, 210],
  textSoft: [120, 105, 150],
}

function noteColorCARTOON(note) {
  if (note >= 16) return { fg: CARTOON_COLORS.green,  bg: [30, 80, 50],  emoji: '🌟' }
  if (note >= 14) return { fg: CARTOON_COLORS.teal,   bg: [20, 70, 65],  emoji: '✨' }
  if (note >= 12) return { fg: CARTOON_COLORS.blue,   bg: [25, 50, 90],  emoji: '👍' }
  if (note >= 10) return { fg: CARTOON_COLORS.yellow, bg: [70, 60, 15],  emoji: '📚' }
  if (note >= 8)  return { fg: CARTOON_COLORS.orange, bg: [70, 40, 10],  emoji: '⚠️' }
  return                 { fg: CARTOON_COLORS.red,    bg: [75, 20, 20],  emoji: '❌' }
}

// Rounded rect helper with optional stroke
function rr(doc, x, y, w, h, r, mode, strokeColor) {
  if (strokeColor) {
    doc.setDrawColor(...strokeColor)
    doc.setLineWidth(mode === 'FD' ? 1.5 : 0.5)
  }
  doc.roundedRect(x, y, w, h, r, r, mode)
}

// ═══════════════════════════════════════════════════════════════
//  TEMPLATE 1 — PROFESSIONAL (premium dark/light PDF)
// ═══════════════════════════════════════════════════════════════

function exportPRO(results, moyenne, studentName) {
  const dark = isDarkMode()
  const d = {
    pageBg:     dark ? [10, 15, 26]    : [248, 250, 252],
    surface:    dark ? [17, 24, 39]    : [255, 255, 255],
    surface2:   dark ? [22, 31, 48]    : [241, 245, 249],
    border:     dark ? [30, 41, 59]    : [226, 232, 240],
    text:       dark ? [241, 245, 249] : [15, 23, 42],
    textMuted:  dark ? [148, 163, 184] : [100, 116, 139],
    textSoft:   dark ? [71, 85, 105]   : [148, 163, 184],
    teal:       dark ? [45, 212, 191]  : [13, 148, 136],
    tealBg:     dark ? [19, 78, 74]    : [204, 251, 241],
    accent:     dark ? [45, 212, 191]  : [13, 148, 136],
    accentDark: dark ? [20, 184, 166]  : [15, 118, 110],
    hdrBg:      dark ? [4, 47, 46]     : [13, 148, 136],
    hdrBg2:     dark ? [12, 42, 61]    : [8, 145, 178],
    hdrText:    [255, 255, 255],
    hdrSub:     dark ? [94, 234, 212]  : [204, 251, 241],
    footBg:     dark ? [15, 23, 42]    : [241, 245, 249],
    footText:   dark ? [71, 85, 105]   : [100, 116, 139],
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, H = 297
  const filled = results.filter(r => r.note !== null)

  // ── Background
  doc.setFillColor(...d.pageBg)
  doc.rect(0, 0, W, H, 'F')

  // ── Header band
  const HDR = 56
  doc.setFillColor(...d.hdrBg)
  doc.rect(0, 0, W, HDR, 'F')
  doc.setFillColor(...d.hdrBg2)
  doc.rect(W - 70, 0, 70, HDR, 'F')

  // Decorative circles top-right
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.3)
  doc.setGState(doc.GState({ opacity: 0.07 }))
  ;[34, 22, 11].forEach(r => doc.circle(W - 22, 5, r, 'S'))
  doc.setGState(doc.GState({ opacity: 1 }))

  // Header: institution
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...d.hdrSub)
  doc.text('UNIVERSITÉ ABDERRAHMANE MIRA DE BÉJAÏA', 13, 10)
  doc.text('FACULTÉ DE TECHNOLOGIE  ·  DÉPARTEMENT DES SCIENCES', 13, 14.5)

  // Thin rule
  doc.setDrawColor(...d.hdrSub)
  doc.setLineWidth(0.25)
  doc.setGState(doc.GState({ opacity: 0.25 }))
  doc.line(13, 16.5, 130, 16.5)
  doc.setGState(doc.GState({ opacity: 1 }))

  // Main title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...d.hdrText)
  doc.text('Relevé de Notes Officiel', 13, 29)

  // S2 pill + subtitle
  doc.setFillColor(...d.accent)
  rr(doc, 13, 33, 16, 8, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(255, 255, 255)
  doc.text('S2', 21, 38.5, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...d.hdrSub)
  doc.text('Licence Sciences & Technologies — L1  ·  Année 2024 / 2025', 32, 38.5)

  // Date top-right
  const today = new Date().toLocaleDateString('fr-DZ', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.setFontSize(7)
  doc.setTextColor(...d.hdrSub)
  doc.text(today, W - 13, 10, { align: 'right' })

  // Stamp-like circle
  doc.setDrawColor(...d.hdrSub)
  doc.setLineWidth(0.6)
  doc.setGState(doc.GState({ opacity: 0.18 }))
  doc.circle(W - 30, 38, 12, 'S')
  doc.setGState(doc.GState({ opacity: 0.1 }))
  doc.circle(W - 30, 38, 9, 'S')
  doc.setGState(doc.GState({ opacity: 1 }))

  let y = HDR + 10

  // ── Identity card
  doc.setFillColor(...d.surface)
  doc.setDrawColor(...d.border)
  doc.setLineWidth(0.4)
  rr(doc, 13, y, W - 26, 28, 3, 'FD')

  // Left accent
  doc.setFillColor(...d.accent)
  rr(doc, 13, y, 4.5, 28, 2, 'F')

  // Student info
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...d.textMuted)
  doc.text('ÉTUDIANT(E)', 22, y + 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...d.text)
  doc.text(studentName?.trim() || '—', 22, y + 18)

  // Divider vertical
  doc.setDrawColor(...d.border)
  doc.setLineWidth(0.3)
  doc.line(110, y + 5, 110, y + 23)

  // Right info columns
  const cols = [
    { label: 'SEMESTRE',   val: 'S2 — 2024/2025' },
    { label: 'FORMATION',  val: 'Licence ST — L1'  },
    { label: 'MODULES',    val: `${results.length} modules / ${results.reduce((s,r)=>s+r.coef,0)} crédits` },
  ]
  cols.forEach((c, i) => {
    const cx = 115 + i * 31
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...d.textMuted)
    doc.text(c.label, cx, y + 8)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...d.text)
    doc.text(c.val, cx, y + 16)
  })

  y += 36

  // ── Section header: modules
  doc.setFillColor(...d.surface2)
  doc.setDrawColor(...d.border)
  rr(doc, 13, y, W - 26, 7, 1.5, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...d.textMuted)
  doc.text('▸  DÉTAIL DES MODULES ET NOTES', 17, y + 4.8)
  y += 11

  // ── Modules table (detailed)
  const rows = results.map(r => {
    const pond = r.examW === 0 ? 'TP — 100 % CA' : `Exam ${r.examW * 100}% / CA ${r.caW * 100}%`
    const statut = r.note === null ? 'Non saisi'
      : r.note >= 10 ? 'Validé ✓' : r.note >= 8 ? 'Rattrapable' : 'Ajourné ✗'
    return [r.name, pond, String(r.coef), r.note !== null ? r.note.toFixed(2) : '—', statut]
  })

  autoTable(doc, {
    startY: y,
    head: [['Module', 'Pondération', 'Coef.', 'Note /20', 'Statut']],
    body: rows,
    margin: { left: 13, right: 13 },
    styles: {
      font: 'helvetica', fontSize: 8.5,
      cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
      lineColor: d.border, lineWidth: 0.3,
      fillColor: d.surface, textColor: d.text,
    },
    headStyles: {
      fillColor: d.hdrBg, textColor: [255,255,255],
      fontStyle: 'bold', fontSize: 7.5, halign: 'left',
    },
    alternateRowStyles: { fillColor: d.surface2 },
    columnStyles: {
      0: { cellWidth: 62, fontStyle: 'bold' },
      1: { cellWidth: 48, textColor: d.textMuted, fontSize: 7.5 },
      2: { cellWidth: 16, halign: 'center', textColor: d.textMuted },
      3: { cellWidth: 26, halign: 'center', fontStyle: 'bold', fontSize: 11 },
      4: { cellWidth: 30, halign: 'center', fontSize: 7.5 },
    },
    didParseCell(data) {
      if (data.column.index === 3 && data.section === 'body') {
        const v = parseFloat(data.cell.raw)
        if (!isNaN(v)) {
          const c = noteColorPRO(v, dark)
          data.cell.styles.textColor = c.fg
          data.cell.styles.fillColor = c.bg
        }
      }
      if (data.column.index === 4 && data.section === 'body') {
        const raw = data.cell.raw
        if (raw.includes('Validé')) { data.cell.styles.textColor = dark ? [52,211,153] : [16,185,129] }
        else if (raw.includes('Rattrapable')) { data.cell.styles.textColor = dark ? [251,191,36] : [245,158,11] }
        else if (raw.includes('Ajourné')) { data.cell.styles.textColor = dark ? [248,113,113] : [239,68,68] }
        else { data.cell.styles.textColor = d.textSoft }
      }
    },
  })

  y = doc.lastAutoTable.finalY + 14

  // ── Statistics row
  if (filled.length > 0) {
    const validé = filled.filter(r => r.note >= 10).length
    const best   = filled.reduce((b, r) => r.note > b.note ? r : b, filled[0])
    const worst  = filled.reduce((b, r) => r.note < b.note ? r : b, filled[0])
    const totalC = filled.reduce((s, r) => s + r.coef, 0)

    const stats = [
      { icon: '✓', label: 'Modules validés',   val: `${validé} / ${filled.length}` },
      { icon: '▲', label: 'Meilleure note',     val: best.note.toFixed(2) + ' /20' },
      { icon: '▼', label: 'Note la plus basse', val: worst.note.toFixed(2) + ' /20' },
      { icon: '∑', label: 'Crédits totaux',     val: String(totalC) },
    ]

    const SW = (W - 26 - 9) / 4
    stats.forEach((s, i) => {
      const sx = 13 + i * (SW + 3)
      doc.setFillColor(...d.surface)
      doc.setDrawColor(...d.border)
      rr(doc, sx, y, SW, 22, 2.5, 'FD')
      doc.setFillColor(...d.accent)
      rr(doc, sx, y, SW, 5, 2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(...d.textMuted)
      doc.text(s.label.toUpperCase(), sx + SW/2, y + 12, { align: 'center' })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...d.text)
      doc.text(s.val, sx + SW/2, y + 19, { align: 'center' })
    })
    y += 30
  }

  // ── Average card
  if (moyenne !== null) {
    const mention = getMention(moyenne)
    const mc = mentionColorPRO(moyenne, dark)
    const CARD_H = 42

    doc.setFillColor(...d.surface)
    doc.setDrawColor(...d.border)
    rr(doc, 13, y, W - 26, CARD_H, 3, 'FD')
    doc.setFillColor(...mc.fg)
    rr(doc, 13, y, 5, CARD_H, 2, 'F')

    // Radial glow overlay
    doc.setGState(doc.GState({ opacity: 0.04 }))
    doc.setFillColor(...mc.fg)
    doc.circle(50, y + CARD_H / 2, 30, 'F')
    doc.setGState(doc.GState({ opacity: 1 }))

    // Eyebrow
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...d.textMuted)
    doc.text('MOYENNE GÉNÉRALE DU SEMESTRE 2', 23, y + 10)

    // Big number
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(32)
    doc.setTextColor(...mc.fg)
    doc.text(moyenne.toFixed(2), 23, y + 32)
    const numW = doc.getTextWidth(moyenne.toFixed(2))
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(...d.textMuted)
    doc.text('/ 20', 23 + numW + 3, y + 32)

    // Mention badge
    const bw = 46, bh = 14
    const bx = W - 13 - bw - 14, by = y + (CARD_H - bh) / 2
    doc.setFillColor(...mc.fg)
    rr(doc, bx, by, bw, bh, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(mention, bx + bw / 2, by + 9.5, { align: 'center' })

    // Coefficients note
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(...d.textSoft)
    doc.text(`Calculée sur ${filled.length} module${filled.length > 1 ? 's' : ''} · pondérée par coefficients`, 23, y + CARD_H - 5)

    y += CARD_H + 14
  }

  // ── Visual bars section
  if (filled.length > 0) {
    doc.setFillColor(...d.surface2)
    doc.setDrawColor(...d.border)
    rr(doc, 13, y, W - 26, 7, 1.5, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...d.textMuted)
    doc.text('▸  VISUALISATION DES RÉSULTATS', 17, y + 4.8)
    y += 11

    const ROW_H = 12, PAD = 8
    const CARD_H = filled.length * ROW_H + PAD * 2

    doc.setFillColor(...d.surface)
    doc.setDrawColor(...d.border)
    rr(doc, 13, y, W - 26, CARD_H, 3, 'FD')

    const LBL_W = 62, SCORE_W = 20
    const BAR_X = 13 + PAD + LBL_W + 4
    const BAR_W = W - 26 - PAD * 2 - LBL_W - SCORE_W - 12

    let ry = y + PAD
    filled.forEach((r, i) => {
      const c = noteColorPRO(r.note, dark)
      const pct = r.note / 20

      if (i % 2 === 0) {
        doc.setGState(doc.GState({ opacity: 0.4 }))
        doc.setFillColor(...d.surface2)
        rr(doc, 13 + PAD - 2, ry - 1.5, W - 26 - PAD * 2 + 4, ROW_H - 1, 1, 'F')
        doc.setGState(doc.GState({ opacity: 1 }))
      }

      // Label
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...d.text)
      let lbl = r.name
      while (doc.getTextWidth(lbl) > LBL_W - 2 && lbl.length > 1) lbl = lbl.slice(0, -1)
      if (lbl !== r.name) lbl = lbl.slice(0, -1) + '…'
      doc.text(lbl, 13 + PAD, ry + 6.5)

      // Track
      doc.setFillColor(...d.border)
      rr(doc, BAR_X, ry + 4, BAR_W, 3.5, 1, 'F')

      // Fill
      doc.setFillColor(...c.fg)
      if (pct > 0) rr(doc, BAR_X, ry + 4, BAR_W * pct, 3.5, 1, 'F')

      // Score badge
      const sx = BAR_X + BAR_W + 4
      doc.setFillColor(...c.bg)
      rr(doc, sx, ry + 1, SCORE_W, 8, 2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...c.fg)
      doc.text(r.note.toFixed(2), sx + SCORE_W / 2, ry + 6.5, { align: 'center' })

      ry += ROW_H
    })
    y += CARD_H + 12
  }

  // ── Signature / validation box
  if (y < H - 40) {
    doc.setFillColor(...d.surface)
    doc.setDrawColor(...d.border)
    rr(doc, 13, y, W - 26, 22, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...d.textMuted)
    doc.text('VISA DU RESPONSABLE PÉDAGOGIQUE', 22, y + 8)
    doc.setDrawColor(...d.border)
    doc.setLineWidth(0.4)
    doc.line(22, y + 18, 90, y + 18)
    doc.text('CACHET DE L\'ÉTABLISSEMENT', W - 80, y + 8)
    doc.setLineWidth(0.4)
    doc.rect(W - 80, y + 10, 60, 10)
    y += 28
  }

  // ── Footer
  doc.setFillColor(...d.footBg)
  doc.rect(0, H - 13, W, 13, 'F')
  doc.setDrawColor(...d.border)
  doc.setLineWidth(0.3)
  doc.line(0, H - 13, W, H - 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...d.footText)
  doc.text('Document généré automatiquement · s2-grade-calc.vercel.app', 13, H - 4.5)
  doc.text('Page 1 / 1', W - 13, H - 4.5, { align: 'right' })

  const fn = studentName?.trim()
    ? `Notes_S2_PRO_${studentName.trim().replace(/\s+/g, '_')}.pdf`
    : 'Notes_S2_PRO.pdf'
  doc.save(fn)
}


// ═══════════════════════════════════════════════════════════════
//  TEMPLATE 2 — CARTOON (vibrant, playful, dark-only style)
// ═══════════════════════════════════════════════════════════════

function exportCARTOON(results, moyenne, studentName) {
  const C = CARTOON_COLORS
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, H = 297
  const filled = results.filter(r => r.note !== null)

  // ── Page background (deep dark purple)
  doc.setFillColor(...C.darkBg)
  doc.rect(0, 0, W, H, 'F')

  // ── Starfield dots
  doc.setFillColor(...C.border)
  const stars = [
    [18,8],[45,5],[72,12],[110,4],[145,9],[180,6],[195,15],
    [25,22],[60,18],[90,25],[130,20],[165,17],[200,22],
    [15,35],[55,30],[85,38],[120,32],[160,28],[198,35],
  ]
  stars.forEach(([sx, sy]) => {
    doc.setFillColor(255, 255, 255)
    doc.setGState(doc.GState({ opacity: Math.random() * 0.3 + 0.05 }))
    doc.circle(sx, sy, 0.4, 'F')
  })
  doc.setGState(doc.GState({ opacity: 1 }))

  // ── Wavy header band (simulated with gradient-style rects)
  // Main gradient: purple to pink
  const HDR = 62
  ;[
    [[80, 40, 160], 0, HDR],
    [[100, 45, 180], 30, HDR],
    [[120, 50, 200], 70, HDR],
    [[140, 55, 210], 110, HDR],
    [[160, 60, 200], 150, HDR],
    [[180, 65, 180], 180, HDR],
  ].forEach(([color, x, height]) => {
    doc.setFillColor(...color)
    doc.setGState(doc.GState({ opacity: 0.9 }))
    doc.rect(x, 0, 35, height, 'F')
  })
  doc.setGState(doc.GState({ opacity: 1 }))

  // Header overlay gradient (dark top)
  doc.setFillColor(25, 20, 40)
  doc.setGState(doc.GState({ opacity: 0.35 }))
  doc.rect(0, 0, W, HDR, 'F')
  doc.setGState(doc.GState({ opacity: 1 }))

  // Big decorative orbs
  const orbs = [
    { x: 185, y: -8, r: 28, c: C.pink,   o: 0.3 },
    { x: 165, y: 55, r: 18, c: C.purple, o: 0.25 },
    { x: 20,  y: 60, r: 22, c: C.teal,   o: 0.2 },
  ]
  orbs.forEach(o => {
    doc.setFillColor(...o.c)
    doc.setGState(doc.GState({ opacity: o.o }))
    doc.circle(o.x, o.y, o.r, 'F')
  })
  doc.setGState(doc.GState({ opacity: 1 }))

  // ── Header text
  // Emoji icon area
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...C.text)
  doc.text('🎓  UNIVERSITÉ ABDERRAHMANE MIRA DE BÉJAÏA', 13, 11)

  // Sparkle line
  doc.setDrawColor(...C.purple)
  doc.setLineWidth(0.8)
  doc.setGState(doc.GState({ opacity: 0.5 }))
  doc.line(13, 13.5, 150, 13.5)
  doc.setGState(doc.GState({ opacity: 1 }))

  // Title — big and bold
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor(...C.white)
  doc.text('Mes Notes du Semestre', 13, 27)

  // S2 badge
  doc.setFillColor(...C.yellow)
  rr(doc, 13, 31, 18, 9, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...C.black)
  doc.text('S 2', 22, 37, { align: 'center' })

  // Subtitle
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...C.textMid)
  doc.text('Licence ST  ·  L1  ·  Année 2024/2025  🚀', 34, 37)

  // Date bubble top-right
  const today = new Date().toLocaleDateString('fr-DZ', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.setFillColor(...C.cardBg)
  rr(doc, W - 13 - 52, 6, 52, 10, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...C.textMid)
  doc.text(today, W - 13 - 52 + 26, 12.5, { align: 'center' })

  // ── Name card (cartoon style)
  let y = HDR + 10

  doc.setFillColor(...C.cardBg)
  doc.setDrawColor(...C.purple)
  doc.setLineWidth(2)
  rr(doc, 13, y, W - 26, 28, 4, 'FD', C.purple)

  // Colorful left stripe
  const stripeColors = [C.pink, C.purple, C.teal, C.yellow]
  stripeColors.forEach((sc, i) => {
    doc.setFillColor(...sc)
    rr(doc, 13, y + i * 7, 4, 7, 0, 'F')
  })

  // Name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C.textMid)
  doc.text('👤  ÉTUDIANT(E)', 22, y + 9)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...C.white)
  doc.text(studentName?.trim() || '—', 22, y + 21)

  // Right side stats bubbles
  const infoBubbles = [
    { label: '📚 S2', sub: '2024/2025' },
    { label: '🏫 L1 ST', sub: 'Technologie' },
    { label: `📦 ${results.length}`, sub: 'Modules' },
    { label: `⚖️ ${results.reduce((s,r)=>s+r.coef,0)}`, sub: 'Crédits' },
  ]
  infoBubbles.forEach((b, i) => {
    const bx = 115 + i * 24
    doc.setFillColor(...C.starBg)
    rr(doc, bx, y + 5, 21, 18, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...C.text)
    doc.text(b.label, bx + 10.5, y + 14, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(...C.textSoft)
    doc.text(b.sub, bx + 10.5, y + 20, { align: 'center' })
  })

  y += 36

  // ── Module cards — each module gets its own cartoon card
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C.textMid)
  doc.text('🎯  VOS MODULES', 13, y)
  y += 6

  const COL_W = (W - 26 - 4) / 2
  const CARD_H_M = 28
  results.forEach((r, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const cx = 13 + col * (COL_W + 4)
    const cy = y + row * (CARD_H_M + 4)
    const c = r.note !== null ? noteColorCARTOON(r.note) : { fg: C.border, bg: C.cardBg, emoji: '❓' }

    // Card bg
    doc.setFillColor(...C.cardBg)
    doc.setDrawColor(...c.fg)
    doc.setLineWidth(1.5)
    rr(doc, cx, cy, COL_W, CARD_H_M, 3, 'FD', c.fg)

    // Color top strip
    doc.setFillColor(...c.fg)
    doc.setGState(doc.GState({ opacity: 0.15 }))
    rr(doc, cx, cy, COL_W, CARD_H_M, 3, 'F')
    doc.setGState(doc.GState({ opacity: 1 }))
    doc.setFillColor(...c.fg)
    rr(doc, cx, cy, COL_W, 5, 2, 'F')

    // Module name (truncate)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C.text)
    let name = r.name
    while (doc.getTextWidth(name) > COL_W - 26 && name.length > 1) name = name.slice(0,-1)
    if (name !== r.name) name = name.slice(0,-1) + '…'
    doc.text(name, cx + 5, cy + 12)

    // Coef tag
    doc.setFillColor(...C.starBg)
    rr(doc, cx + COL_W - 20, cy + 7, 16, 8, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(...C.textMid)
    doc.text(`×${r.coef}`, cx + COL_W - 12, cy + 12.5, { align: 'center' })

    // Note display
    if (r.note !== null) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(...c.fg)
      doc.text(r.note.toFixed(2), cx + 5, cy + 24)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(...C.textSoft)
      doc.text('/20', cx + 5 + doc.getTextWidth(r.note.toFixed(2)) + 1.5, cy + 24)

      // Mini bar
      const BAR_X = cx + 5 + 25, BAR_W = COL_W - 38, BAR_Y = cy + 21
      doc.setFillColor(60, 50, 80)
      rr(doc, BAR_X, BAR_Y, BAR_W, 3.5, 1, 'F')
      doc.setFillColor(...c.fg)
      if (r.note > 0) rr(doc, BAR_X, BAR_Y, BAR_W * (r.note / 20), 3.5, 1, 'F')
    } else {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(...C.textSoft)
      doc.text('Non saisi', cx + 5, cy + 24)
    }
  })

  const rows_count = Math.ceil(results.length / 2)
  y += rows_count * (CARD_H_M + 4) + 8

  // ── Average — big cartoon display
  if (moyenne !== null) {
    const mention = getMention(moyenne)
    const mc = noteColorCARTOON(moyenne)

    // Card
    doc.setFillColor(...C.cardBg)
    doc.setDrawColor(...mc.fg)
    doc.setLineWidth(3)
    rr(doc, 13, y, W - 26, 50, 5, 'FD', mc.fg)

    // Colorful BG fill
    doc.setFillColor(...mc.fg)
    doc.setGState(doc.GState({ opacity: 0.08 }))
    doc.rect(13, y, W - 26, 50, 'F')
    doc.setGState(doc.GState({ opacity: 1 }))

    // Stars decoration
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...mc.fg)
    doc.setGState(doc.GState({ opacity: 0.3 }))
    doc.text('★ ★ ★', W - 60, y + 20)
    doc.setGState(doc.GState({ opacity: 1 }))

    // Label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...C.textMid)
    doc.text('🏆  MOYENNE GÉNÉRALE S2', 22, y + 12)

    // Big average number
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(38)
    doc.setTextColor(...mc.fg)
    doc.text(moyenne.toFixed(2), 22, y + 38)
    const nw = doc.getTextWidth(moyenne.toFixed(2))
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...C.textMid)
    doc.text('/ 20', 22 + nw + 3, y + 38)

    // Mention badge
    doc.setFillColor(...mc.fg)
    rr(doc, W - 80, y + 10, 56, 16, 5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...C.black)
    doc.text(mention, W - 80 + 28, y + 21, { align: 'center' })

    // Stars for score
    const stars_count = Math.round(moyenne / 4) // 0-5
    doc.setFontSize(14)
    doc.setTextColor(...C.yellow)
    let starStr = ''
    for (let s = 0; s < 5; s++) starStr += s < stars_count ? '★' : '☆'
    doc.text(starStr, W - 80, y + 42)

    // Module count
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(...C.textSoft)
    doc.text(`${filled.length} modules · coefficients pondérés`, 22, y + 47)

    y += 62
  }

  // ── Cartoon ranking/podium
  if (filled.length > 0) {
    const sorted = [...filled].sort((a, b) => b.note - a.note)
    const top3 = sorted.slice(0, Math.min(3, sorted.length))

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...C.textMid)
    doc.text('🥇  TOP MODULES', 13, y)
    y += 6

    const podiumColors = [C.yellow, [192,192,192], [205,127,50]]
    const podiumEmojis = ['🥇', '🥈', '🥉']

    top3.forEach((r, i) => {
      const pc = podiumColors[i] || C.border
      doc.setFillColor(...C.cardBg)
      doc.setDrawColor(...pc)
      doc.setLineWidth(1.5)
      rr(doc, 13, y, W - 26, 14, 3, 'FD', pc)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(...pc)
      doc.text(podiumEmojis[i], 18, y + 9.5)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...C.text)
      doc.text(r.name, 28, y + 9.5)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...pc)
      doc.text(r.note.toFixed(2) + ' /20', W - 45, y + 9.5)
      y += 17
    })
    y += 4
  }

  // ── Fun footer
  doc.setFillColor(...C.cardBg)
  doc.rect(0, H - 16, W, 16, 'F')
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.5)
  doc.line(0, H - 16, W, H - 16)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...C.purple)
  doc.text('✨', 13, H - 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...C.textSoft)
  doc.text('Généré avec ❤️ · J_304', 20, H - 5)
  doc.text('Bon courage pour la suite ! 🚀', W / 2, H - 5, { align: 'center' })
  doc.text('Page 1 / 1', W - 13, H - 5, { align: 'right' })

  const fn = studentName?.trim()
    ? `Notes_S2_CARTOON_${studentName.trim().replace(/\s+/g, '_')}.pdf`
    : 'Notes_S2_CARTOON.pdf'
  doc.save(fn)
}


// ═══════════════════════════════════════════════════════════════
//  PUBLIC ENTRY POINT
// ═══════════════════════════════════════════════════════════════

export function exportToPDF(results, moyenne, studentName, template = 'pro') {
  if (template === 'cartoon') {
    exportCARTOON(results, moyenne, studentName)
  } else {
    exportPRO(results, moyenne, studentName)
  }
}