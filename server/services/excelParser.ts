import * as XLSX from 'xlsx';

export interface Student {
  lastName: string;
  firstName: string;
  className: string;
}

export interface ParseResult {
  students: Student[];
  errors: string[];
  totalRows: number;
  successCount: number;
}

/**
 * Parse un fichier Excel et extrait la liste des eleves
 * Format attendu: NOM | Prenom | Classe
 * ou: NOM Prenom | Classe
 */
export function parseStudentList(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json<any>(firstSheet, { header: 1 });

  const students: Student[] = [];
  const errors: string[] = [];
  let totalRows = 0;

  // Detecter si la premiere ligne est un header
  const hasHeader = isHeaderRow(data[0]);
  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < data.length; i++) {
    const row = data[i];
    if (!row || !Array.isArray(row) || row.every(cell => !cell)) continue;

    totalRows++;

    try {
      const student = parseRow(row, i + 1);
      if (student) {
        students.push(student);
      } else {
        errors.push(`Ligne ${i + 1}: donnees incompletes`);
      }
    } catch (err) {
      errors.push(`Ligne ${i + 1}: erreur de parsing`);
    }
  }

  return {
    students,
    errors,
    totalRows,
    successCount: students.length,
  };
}

/**
 * Verifie si une ligne ressemble a un header
 */
function isHeaderRow(row: any[]): boolean {
  if (!row || !Array.isArray(row)) return false;

  const headerKeywords = ['nom', 'prenom', 'prénom', 'classe', 'name', 'first', 'last', 'eleve', 'élève'];
  const rowText = row.map(cell => String(cell || '').toLowerCase()).join(' ');

  return headerKeywords.some(keyword => rowText.includes(keyword));
}

/**
 * Parse une ligne et extrait les informations de l'eleve
 */
function parseRow(row: any[], lineNumber: number): Student | null {
  let lastName = '';
  let firstName = '';
  let className = '';

  // Nettoyer les cellules
  const cleanRow = row.map(cell => String(cell || '').trim());

  if (cleanRow.length >= 3) {
    // Format: NOM | Prenom | Classe
    lastName = cleanRow[0].toUpperCase();
    firstName = formatFirstName(cleanRow[1]);
    className = cleanRow[2].toUpperCase();
  } else if (cleanRow.length === 2) {
    // Format: NOM Prenom | Classe
    const firstCell = cleanRow[0];
    const parts = firstCell.split(/\s+/);

    if (parts.length >= 2) {
      lastName = parts[0].toUpperCase();
      firstName = formatFirstName(parts.slice(1).join(' '));
    } else {
      lastName = firstCell.toUpperCase();
    }
    className = cleanRow[1].toUpperCase();
  } else if (cleanRow.length === 1) {
    // Format: NOM Prenom Classe (tout dans une cellule)
    const parts = cleanRow[0].split(/\s+/);
    if (parts.length >= 3) {
      lastName = parts[0].toUpperCase();
      firstName = formatFirstName(parts.slice(1, -1).join(' '));
      className = parts[parts.length - 1].toUpperCase();
    } else if (parts.length === 2) {
      lastName = parts[0].toUpperCase();
      className = parts[1].toUpperCase();
    } else {
      return null;
    }
  }

  // Validation minimale
  if (!lastName || lastName.length < 2) {
    return null;
  }

  return { lastName, firstName, className };
}

/**
 * Formate un prenom avec majuscule initiale
 */
function formatFirstName(name: string): string {
  if (!name) return '';
  return name
    .split(/[\s-]+/)
    .map(part => {
      if (part.length === 0) return '';
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * Valide qu'un fichier est bien un Excel
 */
export function isValidExcelFile(mimeType: string, filename: string): boolean {
  const validMimes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  const validExtensions = ['.xlsx', '.xls'];

  const hasValidMime = validMimes.includes(mimeType);
  const hasValidExt = validExtensions.some(ext =>
    filename.toLowerCase().endsWith(ext)
  );

  return hasValidMime || hasValidExt;
}
