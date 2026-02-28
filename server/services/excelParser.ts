import ExcelJS from 'exceljs'

export interface Student {
  lastName: string
  firstName: string
  className: string
}

export interface ParseResult {
  students: Student[]
  errors: string[]
  totalRows: number
  successCount: number
}

/**
 * Parse un fichier Excel et extrait la liste des élèves
 * Format attendu: NOM | Prénom | Classe
 * ou: NOM Prénom | Classe
 */
export async function parseStudentList(buffer: Buffer): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const sheet = workbook.worksheets[0]

  if (!sheet) {
    return { students: [], errors: ['Aucune feuille trouvée'], totalRows: 0, successCount: 0 }
  }

  const students: Student[] = []
  const errors: string[] = []
  let totalRows = 0

  // Détecter si la première ligne est un header
  const firstRow = sheet.getRow(1)
  const hasHeader = isHeaderRow(firstRow)
  const startIndex = hasHeader ? 2 : 1

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < startIndex) return

    const cells = row.values as unknown[]
    // ExcelJS rows are 1-indexed, values[0] is undefined
    const cleanCells = (Array.isArray(cells) ? cells.slice(1) : [])
      .map(cell => String(cell ?? '').trim())
      .filter(c => c)

    if (cleanCells.length === 0) return

    totalRows++

    try {
      const student = parseRow(cleanCells, rowNumber)
      if (student) {
        students.push(student)
      } else {
        errors.push(`Ligne ${rowNumber}: données incomplètes`)
      }
    } catch {
      errors.push(`Ligne ${rowNumber}: erreur de parsing`)
    }
  })

  return { students, errors, totalRows, successCount: students.length }
}

function isHeaderRow(row: ExcelJS.Row): boolean {
  const headerKeywords = ['nom', 'prenom', 'prénom', 'classe', 'name', 'first', 'last', 'eleve', 'élève']
  const rowText = (row.values as unknown[])
    ?.slice(1)
    ?.map(cell => String(cell ?? '').toLowerCase())
    .join(' ') ?? ''

  return headerKeywords.some(keyword => rowText.includes(keyword))
}

function parseRow(cells: string[], lineNumber: number): Student | null {
  let lastName = ''
  let firstName = ''
  let className = ''

  if (cells.length >= 3) {
    lastName = cells[0].toUpperCase()
    firstName = formatFirstName(cells[1])
    className = cells[2].toUpperCase()
  } else if (cells.length === 2) {
    const parts = cells[0].split(/\s+/)
    if (parts.length >= 2) {
      lastName = parts[0].toUpperCase()
      firstName = formatFirstName(parts.slice(1).join(' '))
    } else {
      lastName = cells[0].toUpperCase()
    }
    className = cells[1].toUpperCase()
  } else if (cells.length === 1) {
    const parts = cells[0].split(/\s+/)
    if (parts.length >= 3) {
      lastName = parts[0].toUpperCase()
      firstName = formatFirstName(parts.slice(1, -1).join(' '))
      className = parts[parts.length - 1].toUpperCase()
    } else if (parts.length === 2) {
      lastName = parts[0].toUpperCase()
      className = parts[1].toUpperCase()
    } else {
      return null
    }
  }

  if (!lastName || lastName.length < 2) return null

  return { lastName, firstName, className }
}

function formatFirstName(name: string): string {
  if (!name) return ''
  return name
    .split(/[\s-]+/)
    .map(part => part.length === 0 ? '' : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .filter(Boolean)
    .join(' ')
}

export function isValidExcelFile(mimeType: string, filename: string): boolean {
  const validMimes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]
  const validExtensions = ['.xlsx', '.xls']

  return validMimes.includes(mimeType) || validExtensions.some(ext => filename.toLowerCase().endsWith(ext))
}
