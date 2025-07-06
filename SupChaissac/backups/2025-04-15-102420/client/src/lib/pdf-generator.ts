import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatDate, stringToDate } from './dates';
import { formatStatus, formatSessionType, formatTimeSlot } from './utils';
import { Session, TIME_SLOTS, SESSION_TYPES, SESSION_STATUS } from '@shared/schema';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function generateSessionPDF(sessions: Session[], teacherName: string, signature?: string) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Déclaration d\'heures supplémentaires', 105, 20, { align: 'center' });
  
  // Add teacher information
  doc.setFontSize(12);
  doc.text(`Enseignant: ${teacherName}`, 14, 40);
  
  // Get current month and year
  const currentDate = new Date();
  const month = currentDate.toLocaleString('fr-FR', { month: 'long' });
  const year = currentDate.getFullYear();
  
  doc.text(`Période: ${month} ${year}`, 14, 50);
  
  // Create table with sessions
  const tableColumn = ["Date", "Créneau", "Type", "Détails", "Statut"];
  const tableRows = sessions.map(session => {
    const date = formatDate(stringToDate(session.date));
    const timeSlot = formatTimeSlot(session.timeSlot);
    const type = formatSessionType(session.type);
    
    // Format details based on session type
    let details = "";
    if (session.type === 'RCD') {
      details = `${session.replacedTeacherPrefix} ${session.replacedTeacherName} - ${session.className} - ${session.subject}`;
    } else if (session.type === 'DEVOIRS_FAITS') {
      details = `${session.studentCount} élèves - ${session.gradeLevel}`;
    } else {
      details = session.description || '';
    }
    
    const status = formatStatus(session.status);
    
    return [date, timeSlot, type, details, status];
  });
  
  // Generate the table
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 60,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] }, // primary-600
    alternateRowStyles: { fillColor: [239, 246, 255] } // primary-50
  });
  
  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  
  // Add signature section
  doc.text('Signature:', 14, finalY);
  
  if (signature) {
    // Add the signature image
    try {
      doc.addImage(signature, 'PNG', 14, finalY + 5, 50, 25);
    } catch (error) {
      console.error('Error adding signature to PDF:', error);
      doc.text('(Signature non disponible)', 14, finalY + 15);
    }
  } else {
    doc.text('(Signature non disponible)', 14, finalY + 15);
  }
  
  // Add date field
  const today = formatDate(new Date());
  doc.text(`Date: ${today}`, 150, finalY, { align: 'right' });
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} / ${pageCount}`, 195, 287, { align: 'right' });
    doc.text('TeacherHours - Déclaration d\'heures supplémentaires', 105, 287, { align: 'center' });
  }
  
  // Save the PDF
  doc.save(`declaration_heures_${teacherName.replace(/\s+/g, '_')}_${month}_${year}.pdf`);
  
  return doc;
}

export function generateSessionsSummaryPDF(sessions: Session[]) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Récapitulatif des heures supplémentaires', 105, 20, { align: 'center' });
  
  // Get current month and year
  const currentDate = new Date();
  const month = currentDate.toLocaleString('fr-FR', { month: 'long' });
  const year = currentDate.getFullYear();
  
  doc.setFontSize(12);
  doc.text(`Période: ${month} ${year}`, 14, 40);
  
  // Group sessions by teacher
  const sessionsByTeacher: Record<string, Session[]> = {};
  sessions.forEach(session => {
    if (!sessionsByTeacher[session.teacherName]) {
      sessionsByTeacher[session.teacherName] = [];
    }
    sessionsByTeacher[session.teacherName].push(session);
  });
  
  let yPosition = 50;
  
  // For each teacher, create a summary
  Object.entries(sessionsByTeacher).forEach(([teacherName, teacherSessions]) => {
    // Add teacher name
    doc.setFontSize(14);
    doc.text(`Enseignant: ${teacherName}`, 14, yPosition);
    yPosition += 10;
    
    // Create table with sessions
    const tableColumn = ["Date", "Créneau", "Type", "Détails", "Statut"];
    const tableRows = teacherSessions.map(session => {
      const date = formatDate(stringToDate(session.date));
      const timeSlot = formatTimeSlot(session.timeSlot);
      const type = formatSessionType(session.type);
      
      // Format details based on session type
      let details = "";
      if (session.type === 'RCD') {
        details = `${session.replacedTeacherPrefix} ${session.replacedTeacherName} - ${session.className} - ${session.subject}`;
      } else if (session.type === 'DEVOIRS_FAITS') {
        details = `${session.studentCount} élèves - ${session.gradeLevel}`;
      } else {
        details = session.description || '';
      }
      
      const status = formatStatus(session.status);
      
      return [date, timeSlot, type, details, status];
    });
    
    // Generate the table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: yPosition,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] }, // primary-600
      alternateRowStyles: { fillColor: [239, 246, 255] } // primary-50
    });
    
    // Get the final Y position after the table
    yPosition = (doc as any).lastAutoTable.finalY + 20;
    
    // Add a separator if not the last teacher
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
  });
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} / ${pageCount}`, 195, 287, { align: 'right' });
    doc.text('TeacherHours - Récapitulatif des heures supplémentaires', 105, 287, { align: 'center' });
  }
  
  // Save the PDF
  doc.save(`recapitulatif_heures_${month}_${year}.pdf`);
  
  return doc;
}
