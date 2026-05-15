import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─────────────────────────────────────────────────────────────
//  THEME PALETTES
// ─────────────────────────────────────────────────────────────
const LIGHT_THEME = {
  pageBg:       [248, 250, 252],
  headerBg:     [13, 148, 136],
  headerBg2:    [8, 145, 178],
  headerText:   [255, 255, 255],
  headerSub:    [204, 251, 241],
  cardBg:       [255, 255, 255],
  cardBorder:   [226, 232, 240],
  tableHead:    [15, 23, 42],
  tableHeadTxt: [255, 255, 255],
  tableAlt:     [248, 250, 252],
  tableRow:     [255, 255, 255],
  tableBorder:  [226, 232, 240],
  text:         [15, 23, 42],
  textMuted:    [100, 116, 139],
  textSoft:     [148, 163, 184],
  divider:      [226, 232, 240],
  sectionBg:    [241, 245, 249],
  accentBar:    [13, 148, 136],
  footerBg:     [241, 245, 249],
  footerText:   [100, 116, 139],
  barTrack:     [226, 232, 240],
  green:        [16, 185, 129],
  greenBg:      [209, 250, 229],
  greenText:    [6, 95, 70],
  teal:         [13, 148, 136],
  tealBg:       [204, 251, 241],
  tealText:     [15, 118, 110],
  orange:       [245, 158, 11],
  orangeBg:     [254, 243, 199],
  orangeText:   [146, 64, 14],
  red:          [239, 68, 68],
  redBg:        [254, 226, 226],
  redText:      [153, 27, 27],
  white:        [255, 255, 255],
}

const DARK_THEME = {
  pageBg:       [10, 15, 26],
  headerBg:     [4, 47, 46],
  headerBg2:    [12, 42, 61],
  headerText:   [241, 245, 249],
  headerSub:    [94, 234, 212],
  cardBg:       [17, 24, 39],
  cardBorder:   [30, 41, 59],
  tableHead:    [30, 41, 59],
  tableHeadTxt: [226, 232, 240],
  tableAlt:     [15, 23, 42],
  tableRow:     [17, 24, 39],
  tableBorder:  [30, 41, 59],
  text:         [241, 245, 249],
  textMuted:    [148, 163, 184],
  textSoft:     [71, 85, 105],
  divider:      [30, 41, 59],
  sectionBg:    [15, 23, 42],
  accentBar:    [45, 212, 191],
  footerBg:     [15, 23, 42],
  footerText:   [71, 85, 105],
  barTrack:     [30, 41, 59],
  green:        [52, 211, 153],
  greenBg:      [6, 78, 59],
  greenText:    [110, 231, 183],
  teal:         [45, 212, 191],
  tealBg:       [19, 78, 74],
  tealText:     [94, 234, 212],
  orange:       [251, 191, 36],
  orangeBg:     [69, 26, 3],
  orangeText:   [252, 211, 77],
  red:          [248, 113, 113],
  redBg:        [69, 10, 10],
  redText:      [252, 165, 165],
  white:        [255, 255, 255],
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function getNoteColors(note, t) {
  if (note >= 14) return { fg: t.green,  bg: t.greenBg,  label: t.greenText  }
  if (note >= 10) return { fg: t.teal,   bg: t.tealBg,   label: t.tealText   }
  if (note >= 8)  return { fg: t.orange, bg: t.orangeBg, label: t.orangeText }
  return               { fg: t.red,    bg: t.redBg,    label: t.redText    }
}

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

// ─────────────────────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export function exportToPDF(results, moyenne, studentName) {
  const t = isDarkMode() ? DARK_THEME : LIGHT_THEME
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()   // 210
  const H = doc.internal.pageSize.getHeight()  // 297

  // ── Page background ──────────────────────────────────────
  doc.setFillColor(...t.pageBg)
  doc.rect(0, 0, W, H, 'F')

  // ── Header gradient band ─────────────────────────────────
  const HEADER_H = 52
  doc.setFillColor(...t.headerBg)
  doc.rect(0, 0, W, HEADER_H, 'F')

  // Right accent strip
  doc.setFillColor(...t.headerBg2)
  doc.rect(W - 60, 0, 60, HEADER_H, 'F')

  // Decorative rings
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.25)
  doc.setGState(doc.GState({ opacity: 0.08 }))
  doc.circle(W - 18, 6, 30, 'S')
  doc.circle(W - 18, 6, 20, 'S')
  doc.circle(W - 18, 6, 10, 'S')
  doc.setGState(doc.GState({ opacity: 1 }))

  // University label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...t.headerSub)
  doc.text('UNIVERSITÉ ABDERRAHMANE MIRA — BÉJAÏA', 14, 11)

  // Thin rule under label
  doc.setDrawColor(...t.headerSub)
  doc.setLineWidth(0.3)
  doc.setGState(doc.GState({ opacity: 0.3 }))
  doc.line(14, 13, 120, 13)
  doc.setGState(doc.GState({ opacity: 1 }))

  // Main title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...t.headerText)
  doc.text('Relevé de Notes', 14, 26)

  // S2 pill
  doc.setFillColor(...t.accentBar)
  doc.roundedRect(14, 30, 17, 8, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...t.white)
  doc.text('S2', 22.5, 35.5, { align: 'center' })

  // Subtitle
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...t.headerSub)
  doc.text('Licence Sciences & Technologies · L1', 34, 35.5)

  // Date — top right
  const today = new Date().toLocaleDateString('fr-DZ', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...t.headerSub)
  doc.text(today, W - 14, 11, { align: 'right' })

  // ── Info strip (name + date) ─────────────────────────────
  let y = HEADER_H + 10

  doc.setFillColor(...t.cardBg)
  doc.setDrawColor(...t.cardBorder)
  doc.setLineWidth(0.4)
  doc.roundedRect(14, y, W - 28, 16, 3, 3, 'FD')

  // Left teal accent
  doc.setFillColor(...t.accentBar)
  doc.roundedRect(14, y, 4, 16, 1.5, 1.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...t.textMuted)
  doc.text('ÉTUDIANT(E)', 22, y + 6)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...t.text)
  const name = studentName?.trim() || '—'
  doc.text(name, 22, y + 13)

  // Right side: semestre info
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...t.textMuted)
  doc.text('SEMESTRE', W - 60, y + 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...t.text)
  doc.text('Semestre 2 — 2024/2025', W - 60, y + 13)

  y += 26

  // ── Section title: Modules ───────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...t.textMuted)
  doc.text('▸  DÉTAIL DES MODULES', 14, y)
  y += 5

  // ── Modules table ────────────────────────────────────────
  const filled = results.filter(r => r.note !== null)

  const tableRows = results.map(r => {
    const pond = r.examW === 0
      ? 'TP — 100 % CA'
      : `Exam ${r.examW * 100} %  /  CA ${r.caW * 100} %`
    return [r.name, pond, String(r.coef), r.note !== null ? r.note.toFixed(2) : '—']
  })

  autoTable(doc, {
    startY: y,
    head: [['Module', 'Pondération', 'Coef.', 'Note /20']],
    body: tableRows,
    margin: { left: 14, right: 14 },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: { top: 4.5, bottom: 4.5, left: 6, right: 6 },
      lineColor: t.tableBorder,
      lineWidth: 0.3,
      fillColor: t.tableRow,
      textColor: t.text,
    },
    headStyles: {
      fillColor: t.tableHead,
      textColor: t.tableHeadTxt,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: t.tableAlt,
    },
    columnStyles: {
      0: { cellWidth: 72, fontStyle: 'bold' },
      1: { cellWidth: 56, textColor: t.textMuted, fontSize: 8 },
      2: { cellWidth: 18, halign: 'center', textColor: t.textMuted },
      3: { cellWidth: 30, halign: 'center', fontStyle: 'bold', fontSize: 10 },
    },
    didParseCell(data) {
      if (data.column.index === 3 && data.section === 'body') {
        const val = parseFloat(data.cell.raw)
        if (!isNaN(val)) {
          const c = getNoteColors(val, t)
          data.cell.styles.textColor = c.fg
          data.cell.styles.fillColor = c.bg
        }
      }
    },
  })

  y = doc.lastAutoTable.finalY + 12

  // ── Average summary card ─────────────────────────────────
  if (moyenne !== null) {
    const mention = getMention(moyenne)
    const nc = getNoteColors(moyenne, t)
    const CARD_H = 38

    // Card bg
    doc.setFillColor(...t.cardBg)
    doc.setDrawColor(...t.cardBorder)
    doc.setLineWidth(0.4)
    doc.roundedRect(14, y, W - 28, CARD_H, 3, 3, 'FD')

    // Left accent bar
    doc.setFillColor(...nc.fg)
    doc.roundedRect(14, y, 5, CARD_H, 2, 2, 'F')

    // Eyebrow
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...t.textMuted)
    doc.text('MOYENNE GÉNÉRALE S2', 25, y + 9)

    // Big value
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(...nc.fg)
    doc.text(moyenne.toFixed(2), 25, y + 28)

    // /20
    const valW = doc.getTextWidth(moyenne.toFixed(2))
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...t.textMuted)
    doc.text('/ 20', 25 + valW + 2, y + 28)

    // Mention badge
    const BADGE_W = 42
    const BADGE_H = 13
    const bx = W - 14 - BADGE_W - 14
    const by = y + (CARD_H - BADGE_H) / 2
    doc.setFillColor(...nc.fg)
    doc.roundedRect(bx, by, BADGE_W, BADGE_H, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...t.white)
    doc.text(mention, bx + BADGE_W / 2, by + 8.5, { align: 'center' })

    // Partial note if needed
    if (filled.length < results.length) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7)
      doc.setTextColor(...t.textSoft)
      doc.text(
        `* Calculée sur ${filled.length} / ${results.length} modules renseignés`,
        25, y + CARD_H + 5
      )
      y += 5
    }

    y += CARD_H + 12
  }

  // ── Visual note bars ─────────────────────────────────────
  if (filled.length > 0) {
    // Section header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...t.textMuted)
    doc.text('▸  VISUALISATION DES NOTES', 14, y)
    y += 6

    // Card wrapper
    const BAR_ROWS = filled.length
    const ROW_H = 13
    const PADDING = 10
    const CARD_H = BAR_ROWS * ROW_H + PADDING * 2 - 2

    doc.setFillColor(...t.cardBg)
    doc.setDrawColor(...t.cardBorder)
    doc.setLineWidth(0.4)
    doc.roundedRect(14, y, W - 28, CARD_H, 3, 3, 'FD')

    const BAR_X = 14 + PADDING
    const BAR_MAX = W - 28 - PADDING * 2 - 26  // space for label left + score right
    const LABEL_W = 68
    const SCORE_W = 18

    let ry = y + PADDING

    filled.forEach((r, i) => {
      const nc = getNoteColors(r.note, t)
      const pct = r.note / 20
      const barX = BAR_X + LABEL_W + 4
      const barW = BAR_MAX - LABEL_W - SCORE_W - 4

      // Alternating subtle row tint
      if (i % 2 === 0) {
        doc.setFillColor(...t.sectionBg)
        doc.setGState(doc.GState({ opacity: 0.5 }))
        doc.roundedRect(BAR_X - 2, ry - 2, W - 28 - PADDING * 2 + 4, ROW_H - 1, 1, 1, 'F')
        doc.setGState(doc.GState({ opacity: 1 }))
      }

      // Module name
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...t.text)
      // Truncate long names
      let label = r.name
      while (doc.getTextWidth(label) > LABEL_W - 2 && label.length > 0) {
        label = label.slice(0, -1)
      }
      if (label !== r.name) label = label.slice(0, -1) + '…'
      doc.text(label, BAR_X, ry + 6)

      // Track
      doc.setFillColor(...t.barTrack)
      doc.roundedRect(barX, ry + 3, barW, 4, 1, 1, 'F')

      // Fill
      doc.setFillColor(...nc.fg)
      doc.roundedRect(barX, ry + 3, barW * pct, 4, 1, 1, 'F')

      // Score pill
      const scoreX = barX + barW + 4
      doc.setFillColor(...nc.bg)
      doc.roundedRect(scoreX, ry + 1, SCORE_W, 7, 2, 2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...nc.fg)
      doc.text(r.note.toFixed(2), scoreX + SCORE_W / 2, ry + 6.3, { align: 'center' })

      ry += ROW_H
    })

    y += CARD_H + 10
  }

  // ── Footer ───────────────────────────────────────────────
  doc.setFillColor(...t.footerBg)
  doc.rect(0, H - 12, W, 12, 'F')

  // Footer top line
  doc.setDrawColor(...t.divider)
  doc.setLineWidth(0.3)
  doc.line(0, H - 12, W, H - 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...t.footerText)
  doc.text('Document généré automatiquement — s2-grade-calc.vercel.app', 14, H - 4.5)
  doc.text('Page 1 / 1', W - 14, H - 4.5, { align: 'right' })

  // ── Save ─────────────────────────────────────────────────
  const filename = studentName?.trim()
    ? `Notes_S2_${studentName.trim().replace(/\s+/g, '_')}.pdf`
    : 'Notes_S2.pdf'

  doc.save(filename)
}