import { Document, Page, Text, View, StyleSheet, Font, Image, pdf } from '@react-pdf/renderer';

// ============================================================================
// TYPES
// ============================================================================

interface SessionForPDF {
  id: number;
  date: string;
  timeSlot: string;
  type: 'RCD' | 'DEVOIRS_FAITS' | 'AUTRE' | 'HSE';
  status: string;
  className?: string;
  studentCount?: number;
  gradeLevel?: string;
  description?: string;
  replacedTeacherPrefix?: string;
  replacedTeacherFirstName?: string;
  replacedTeacherLastName?: string;
  subject?: string;
  comment?: string;
  createdAt?: string;
  validatedAt?: string;
}

interface TeacherForPDF {
  civilite?: string;
  firstName: string;
  lastName: string;
  subject?: string;
  inPacte?: boolean;
}

interface RecapProps {
  teacher: TeacherForPDF;
  sessions: SessionForPDF[];
  month: number; // 0-11
  year: number;
}

// ============================================================================
// HELPERS
// ============================================================================

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const SLOT_LABELS: Record<string, string> = {
  M1: '8h-9h', M2: '9h-10h', M3: '10h-11h', M4: '11h-12h',
  S1: '13h-14h', S2: '14h-15h', S3: '15h-16h', S4: '16h-17h',
};

const TYPE_LABELS: Record<string, string> = {
  RCD: 'Remplacement (RCD)',
  DEVOIRS_FAITS: 'Devoirs Faits',
  AUTRE: 'Autre',
  HSE: 'HSE',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'En attente',
  PENDING_DOCUMENTS: 'Document demandé',
  PENDING_VALIDATION: 'En validation',
  VALIDATED: 'Validée',
  ON_HOLD: 'En attente (direction)',
  REJECTED: 'Rejetée',
  SENT_FOR_PAYMENT: 'Mis en paiement',
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function getDayName(dateStr: string): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[new Date(dateStr).getDay()];
}

function getSessionDetail(session: SessionForPDF): string {
  switch (session.type) {
    case 'RCD': {
      const prefix = session.replacedTeacherPrefix || '';
      const first = session.replacedTeacherFirstName || '';
      const last = session.replacedTeacherLastName || '';
      const cls = session.className ? ` — ${session.className}` : '';
      const subj = session.subject ? ` (${session.subject})` : '';
      return `${prefix} ${first} ${last}${subj}${cls}`.trim();
    }
    case 'DEVOIRS_FAITS': {
      const grade = session.gradeLevel || '';
      const count = session.studentCount ? `${session.studentCount} élèves` : '';
      return [grade, count].filter(Boolean).join(' — ');
    }
    case 'AUTRE':
    case 'HSE':
      return session.description || '';
    default:
      return '';
  }
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f59e0b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 50,
    height: 50,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#78716c',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerDate: {
    fontSize: 9,
    color: '#78716c',
  },

  // Document title
  docTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 4,
    color: '#1c1917',
  },
  docSubtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
    color: '#57534e',
  },

  // Teacher info
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    color: '#1c1917',
  },
  pacteBadge: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  pacteBadgeText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#166534',
  },

  // Table
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#78716c',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e7e5e4',
  },
  tableRowAlt: {
    backgroundColor: '#fafaf9',
  },
  tableCell: {
    fontSize: 9,
    color: '#292524',
  },
  tableCellBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#292524',
  },

  // Column widths
  colDate: { width: '18%' },
  colSlot: { width: '12%' },
  colType: { width: '18%' },
  colDetail: { width: '37%' },
  colStatus: { width: '15%' },

  // Summary
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f4',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 6,
    padding: 12,
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1c1917',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#78716c',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#d6d3d1',
    marginHorizontal: 8,
  },

  // Signature
  signatureSection: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBlock: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#44403c',
    marginBottom: 4,
  },
  signatureDateLine: {
    fontSize: 9,
    color: '#78716c',
    marginBottom: 24,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#a8a29e',
    borderTopStyle: 'dashed' as const,
    paddingTop: 4,
  },
  signatureHint: {
    fontSize: 7,
    color: '#a8a29e',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#d6d3d1',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: '#a8a29e',
  },

  // Empty state
  emptyText: {
    fontSize: 11,
    color: '#78716c',
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
});

// ============================================================================
// PDF DOCUMENT COMPONENT
// ============================================================================

const RecapitulatifDocument = ({ teacher, sessions, month, year }: RecapProps) => {
  const monthLabel = MONTHS[month];
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const slotOrder = ['M1', 'M2', 'M3', 'M4', 'S1', 'S2', 'S3', 'S4'];
    return slotOrder.indexOf(a.timeSlot) - slotOrder.indexOf(b.timeSlot);
  });

  const totalSessions = sortedSessions.length;
  const byType = {
    RCD: sortedSessions.filter(s => s.type === 'RCD').length,
    DF: sortedSessions.filter(s => s.type === 'DEVOIRS_FAITS').length,
    HSE: sortedSessions.filter(s => s.type === 'HSE').length,
    AUTRE: sortedSessions.filter(s => s.type === 'AUTRE').length,
  };

  const teacherFullName = `${teacher.civilite || ''} ${teacher.firstName} ${teacher.lastName}`.trim();
  const today = new Date();
  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image src="/logo.png" style={styles.logo} />
            <View>
              <Text style={styles.headerTitle}>Collège Chaissac</Text>
              <Text style={styles.headerSubtitle}>Gestion des heures supplémentaires</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDate}>Édité le {todayStr}</Text>
          </View>
        </View>

        {/* Titre du document */}
        <Text style={styles.docTitle}>Récapitulatif mensuel des heures</Text>
        <Text style={styles.docSubtitle}>{monthLabel} {year}</Text>

        {/* Infos enseignant */}
        <View style={styles.infoBox}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Enseignant</Text>
            <Text style={styles.infoValue}>{teacherFullName}</Text>
            {teacher.inPacte && (
              <View style={styles.pacteBadge}>
                <Text style={styles.pacteBadgeText}>PACTE</Text>
              </View>
            )}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Discipline</Text>
            <Text style={styles.infoValue}>{teacher.subject || '—'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Période</Text>
            <Text style={styles.infoValue}>{monthLabel} {year}</Text>
          </View>
        </View>

        {/* Tableau des sessions */}
        {sortedSessions.length === 0 ? (
          <Text style={styles.emptyText}>Aucune session déclarée pour cette période.</Text>
        ) : (
          <View style={styles.table}>
            {/* En-tête du tableau */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
              <Text style={[styles.tableHeaderCell, styles.colSlot]}>Créneau</Text>
              <Text style={[styles.tableHeaderCell, styles.colType]}>Type</Text>
              <Text style={[styles.tableHeaderCell, styles.colDetail]}>Détail</Text>
              <Text style={[styles.tableHeaderCell, styles.colStatus]}>Statut</Text>
            </View>

            {/* Lignes */}
            {sortedSessions.map((session, idx) => (
              <View key={session.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                <View style={styles.colDate}>
                  <Text style={styles.tableCellBold}>{formatDate(session.date)}</Text>
                  <Text style={[styles.tableCell, { fontSize: 7, color: '#78716c' }]}>{getDayName(session.date)}</Text>
                </View>
                <Text style={[styles.tableCell, styles.colSlot]}>{SLOT_LABELS[session.timeSlot] || session.timeSlot}</Text>
                <Text style={[styles.tableCellBold, styles.colType]}>{TYPE_LABELS[session.type] || session.type}</Text>
                <Text style={[styles.tableCell, styles.colDetail]}>{getSessionDetail(session)}</Text>
                <Text style={[styles.tableCell, styles.colStatus]}>{STATUS_LABELS[session.status] || session.status}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Résumé */}
        {sortedSessions.length > 0 && (
          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{totalSessions}</Text>
              <Text style={styles.summaryLabel}>Total heures</Text>
            </View>
            {byType.RCD > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{byType.RCD}</Text>
                  <Text style={styles.summaryLabel}>RCD</Text>
                </View>
              </>
            )}
            {byType.DF > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{byType.DF}</Text>
                  <Text style={styles.summaryLabel}>Devoirs Faits</Text>
                </View>
              </>
            )}
            {byType.HSE > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{byType.HSE}</Text>
                  <Text style={styles.summaryLabel}>HSE</Text>
                </View>
              </>
            )}
            {byType.AUTRE > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNumber}>{byType.AUTRE}</Text>
                  <Text style={styles.summaryLabel}>Autre</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Zone de signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>Signature de l'enseignant</Text>
              <Text style={styles.signatureDateLine}>Date : _____ / _____ / ________</Text>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureHint}>Signature</Text>
              </View>
            </View>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>Visa du chef d'établissement</Text>
              <Text style={styles.signatureDateLine}>Date : _____ / _____ / ________</Text>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureHint}>Signature et cachet</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pied de page */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Collège Chaissac — SupChaissac</Text>
          <Text style={styles.footerText}>Document généré automatiquement</Text>
        </View>
      </Page>
    </Document>
  );
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Génère et télécharge le PDF récapitulatif
 */
export async function generateRecapPDF(
  teacher: TeacherForPDF,
  sessions: SessionForPDF[],
  month: number,
  year: number,
): Promise<void> {
  const monthLabel = MONTHS[month];
  const fileName = `Recap_${teacher.lastName}_${monthLabel}_${year}.pdf`;

  const blob = await pdf(
    <RecapitulatifDocument teacher={teacher} sessions={sessions} month={month} year={year} />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default RecapitulatifDocument;
