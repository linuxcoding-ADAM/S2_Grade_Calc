import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Colors
const TEAL   = [13, 148, 136]
const DARK   = [15, 23, 42]
const MUTED  = [100, 116, 139]
const LIGHT  = [241, 245, 249]
const WHITE  = [255, 255, 255]
const GREEN  = [16, 185, 129]
const ORANGE = [245, 158, 11]
const RED    = [239, 68, 68]

function getNoteColor(note) {
  if (note >= 14) return GREEN
  if (note >= 10) return TEAL
  if (note >= 8)  return ORANGE
  return RED
}

function getMention(avg) {
  if (avg >= 16) return 'Excellent'
  if (avg >= 14) return 'Très Bien'
  if (avg >= 12) return 'Bien'
  if (avg >= 10) return 'Passable'
  return 'Insuffisant'
}

function rgb(arr) {
  return `rgb(${arr.join(',')})`
}

export function exportToPDF(results, moyenne, studentName) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()   // 210
  const H = doc.internal.pageSize.getHeight()  // 297

  // ── Header band ──────────────────────────────────────────
  doc.setFillColor(...TEAL)
  doc.rect(0, 0, W, 42, 'F')

  // Decorative circle top-right
  doc.setFillColor(255, 255, 255, 0.06)
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.3)
  doc.circle(195, 8, 22, 'S')
  doc.circle(195, 8, 14, 'S')

  // University label
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...WHITE)
  doc.text('UNIVERSITÉ ABDERRAHMANE MIRA — BÉJAÏA', 14, 12)

  // Title
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Relevé de Notes — S2', 14, 26)

  // Sub
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(200, 240, 235)
  doc.text('Licence Sciences & Technologies · L1', 14, 34)

  // Date top-right
  const today = new Date().toLocaleDateString('fr-DZ', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
  doc.setFontSize(8)
  doc.setTextColor(...WHITE)
  doc.text(today, W - 14, 34, { align: 'right' })

  // ── Student info row ──────────────────────────────────────
  let y = 52

  if (studentName && studentName.trim()) {
    doc.setFillColor(...LIGHT)
    doc.roundedRect(14, y - 5, W - 28, 12, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...DARK)
    doc.text('Étudiant(e) :', 19, y + 2)
    doc.setFont('helvetica', 'normal')
    doc.text(studentName.trim(), 48, y + 2)
    y += 18
  }

  // ── Modules table ─────────────────────────────────────────
  const filled = results.filter(r => r.note !== null)

  const tableRows = results.map(r => {
    const pct = r.examW === 0
      ? 'TP (100% CA)'
      : `Exam ${r.examW * 100}% / CA ${r.caW * 100}%`

    return [
      r.name,
      pct,
      r.coef,
      r.note !== null ? r.note.toFixed(2) : '—',
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['Module', 'Pondération', 'Coef.', 'Note /20']],
    body: tableRows,
    margin: { left: 14, right: 14 },
    styles: {
      font: 'helvetica',
      fontSize: 9.5,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: DARK,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 75 },
      1: { cellWidth: 55, textColor: MUTED, fontSize: 8.5 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell(data) {
      // Color the note cell based on value
      if (data.column.index === 3 && data.section === 'body') {
        const val = parseFloat(data.cell.raw)
        if (!isNaN(val)) {
          data.cell.styles.textColor = getNoteColor(val)
        }
      }
    },
  })

  y = doc.lastAutoTable.finalY + 10

  // ── Average summary box ───────────────────────────────────
  if (moyenne !== null) {
    const mention = getMention(moyenne)
    const noteColor = getNoteColor(moyenne)
    const boxH = 32

    // Box background
    doc.setFillColor(...LIGHT)
    doc.roundedRect(14, y, W - 28, boxH, 3, 3, 'F')

    // Left accent bar
    doc.setFillColor(...TEAL)
    doc.roundedRect(14, y, 4, boxH, 1, 1, 'F')

    // Label
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text('MOYENNE GÉNÉRALE S2', 24, y + 9)

    // Value
    doc.setFontSize(26)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...noteColor)
    doc.text(moyenne.toFixed(2), 24, y + 25)

    // /20 suffix
    doc.setFontSize(11)
    doc.setTextColor(...MUTED)
    const avgWidth = doc.getTextWidth(moyenne.toFixed(2))
    doc.text('/ 20', 24 + avgWidth + 1.5, y + 25)

    // Mention badge (right side)
    const badgeX = W - 50
    const badgeY = y + 9
    doc.setFillColor(...noteColor)
    doc.roundedRect(badgeX, badgeY, 36, 14, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...WHITE)
    doc.text(mention, badgeX + 18, badgeY + 9.5, { align: 'center' })

    // Modules filled note
    if (filled.length < results.length) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7.5)
      doc.setTextColor(...MUTED)
      doc.text(
        `* Calculée sur ${filled.length}/${results.length} modules renseignés`,
        24, y + boxH + 5
      )
      y += 6
    }

    y += boxH + 10
  }

  // ── Per-module mini bars ───────────────────────────────────
  if (filled.length > 0) {
    y += 2
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text('DÉTAIL DES NOTES', 14, y)
    y += 6

    const barMaxW = W - 28 - 30 - 12  // space for label + score

    filled.forEach(r => {
      if (y > H - 30) return  // avoid overflow
      const pct = r.note / 20

      // Label
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...DARK)
      doc.text(r.name, 14, y + 3)

      // Background bar
      doc.setFillColor(226, 232, 240)
      doc.roundedRect(14, y + 5, barMaxW, 3.5, 1, 1, 'F')

      // Filled bar
      doc.setFillColor(...getNoteColor(r.note))
      doc.roundedRect(14, y + 5, barMaxW * pct, 3.5, 1, 1, 'F')

      // Score
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...getNoteColor(r.note))
      doc.text(r.note.toFixed(2), W - 14, y + 3, { align: 'right' })

      y += 14
    })
  }

  // ── Footer ────────────────────────────────────────────────
  doc.setFillColor(...LIGHT)
  doc.rect(0, H - 14, W, 14, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text('Document généré automatiquement — s2-grade-calc.vercel.app', 14, H - 5)
  doc.text('Page 1 / 1', W - 14, H - 5, { align: 'right' })

  // ── Save ──────────────────────────────────────────────────
  const filename = studentName?.trim()
    ? `Notes_S2_${studentName.trim().replace(/\s+/g, '_')}.pdf`
    : 'Notes_S2.pdf'

  doc.save(filename)
}
