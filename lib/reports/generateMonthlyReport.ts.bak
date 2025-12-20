// Use dynamic imports to avoid build-time issues
import type { Student, WorkoutSession, WorkoutSessionExercise } from '@/lib/types';

// Lazy load jsPDF to avoid CSS file access during build
// Use Function constructor to prevent static analysis
let jsPDFModule: any = null;
let autoTableModule: any = null;

async function loadJsPDF() {
  if (!jsPDFModule) {
    // Use Function constructor to prevent webpack from analyzing during build
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    const jsPDFImport = await dynamicImport('jspdf');
    const autoTableImport = await dynamicImport('jspdf-autotable');
    jsPDFModule = jsPDFImport.default || jsPDFImport;
    autoTableModule = autoTableImport.default || autoTableImport;
  }
  return { jsPDF: jsPDFModule, autoTable: autoTableModule };
}

interface SessionWithExercises extends WorkoutSession {
  workout_session_exercises: (WorkoutSessionExercise & { exercise: any })[];
}

interface ReportData {
  student: Student;
  personalName: string;
  sessions: SessionWithExercises[];
  periodStart: Date;
  periodEnd: Date;
}

interface PersonalRecord {
  exercise_name: string;
  max_load: number;
  date: string;
  reps: string;
}

export async function generateMonthlyReport(data: ReportData): Promise<any> {
  const { jsPDF: jsPDFClass, autoTable: autoTableFn } = await loadJsPDF();
  const doc = new jsPDFClass();
  const { student, personalName, sessions, periodStart, periodEnd } = data;

  // Colors
  const primaryColor: [number, number, number] = [99, 102, 241]; // Indigo
  const secondaryColor: [number, number, number] = [124, 58, 237]; // Purple
  const textColor: [number, number, number] = [31, 41, 55]; // Gray-800
  const lightGray: [number, number, number] = [243, 244, 246]; // Gray-100

  let yPosition = 20;

  // ===== HEADER =====
  // Logo/Title
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('FitCoach Pro', 105, 18, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório Mensal de Performance', 105, 28, { align: 'center' });

  yPosition = 50;

  // ===== STUDENT INFO =====
  doc.setTextColor(...textColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Aluno: ${student.student_name}`, 20, yPosition);
  
  yPosition += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Email: ${student.student_email}`, 20, yPosition);
  
  yPosition += 6;
  doc.text(
    `Período: ${periodStart.toLocaleDateString('pt-BR')} - ${periodEnd.toLocaleDateString('pt-BR')}`,
    20,
    yPosition
  );
  
  yPosition += 6;
  doc.text(`Data do relatório: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPosition);

  yPosition += 12;

  // ===== METRICS SECTION =====
  doc.setFillColor(...lightGray);
  doc.rect(20, yPosition, 170, 8, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('📊 Resumo de Desempenho', 25, yPosition + 6);

  yPosition += 15;

  // Calculate metrics
  const totalSessions = sessions.length;
  const totalExercises = sessions.reduce((sum, s) => sum + s.workout_session_exercises.length, 0);
  const avgExercisesPerSession = totalSessions > 0 ? Math.round(totalExercises / totalSessions) : 0;
  
  const durationsWithValues = sessions
    .map(s => s.duration_minutes)
    .filter((d): d is number => d !== null && d > 0);
  const avgDuration = durationsWithValues.length > 0
    ? Math.round(durationsWithValues.reduce((sum, d) => sum + d, 0) / durationsWithValues.length)
    : 0;

  // Weekly adherence (4 weeks)
  const weeksData = [];
  const now = periodEnd;
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);

    const weekSessions = sessions.filter(s => {
      const date = new Date(s.session_date);
      return date >= weekStart && date < weekEnd;
    });

    weeksData.push({
      week: `Semana ${4 - i}`,
      count: weekSessions.length,
    });
  }

  // Metrics boxes
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);

  const metricsData = [
    { label: 'Treinos Completados', value: totalSessions.toString(), x: 20 },
    { label: 'Exercícios Totais', value: totalExercises.toString(), x: 70 },
    { label: 'Média por Treino', value: avgExercisesPerSession.toString(), x: 120 },
    { label: 'Duração Média', value: `${avgDuration}min`, x: 170 },
  ];

  metricsData.forEach((metric, index) => {
    const x = 20 + index * 42.5;
    
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.rect(x, yPosition, 38, 18, 'FD');
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(metric.value, x + 19, yPosition + 8, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text(metric.label, x + 19, yPosition + 14, { align: 'center' });
  });

  yPosition += 25;

  // ===== WEEKLY ADHERENCE =====
  doc.setFillColor(...lightGray);
  doc.rect(20, yPosition, 170, 8, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('📅 Aderência Semanal', 25, yPosition + 6);

  yPosition += 15;

  // Bar chart (text-based)
  weeksData.forEach((week, index) => {
    const x = 30;
    const y = yPosition + index * 10;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text(`${week.week}:`, x, y);
    
    // Bar
    const barWidth = week.count * 15;
    doc.setFillColor(...primaryColor);
    doc.rect(x + 25, y - 3, barWidth, 5, 'F');
    
    // Value
    doc.setFont('helvetica', 'bold');
    doc.text(`${week.count} treino${week.count !== 1 ? 's' : ''}`, x + 30 + barWidth, y);
  });

  yPosition += 50;

  // ===== PERSONAL RECORDS =====
  if (yPosition > 220) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFillColor(...lightGray);
  doc.rect(20, yPosition, 170, 8, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('🏆 Personal Records (PRs)', 25, yPosition + 6);

  yPosition += 12;

  // Calculate PRs
  const exerciseMaxLoads = new Map<string, PersonalRecord>();
  sessions.forEach(session => {
    session.workout_session_exercises.forEach(ex => {
      if (ex.actual_load && ex.actual_load > 0) {
        const exerciseName = ex.exercise?.name || 'Exercício Desconhecido';
        const current = exerciseMaxLoads.get(exerciseName);
        if (!current || ex.actual_load > current.max_load) {
          exerciseMaxLoads.set(exerciseName, {
            exercise_name: exerciseName,
            max_load: ex.actual_load,
            date: session.session_date,
            reps: ex.actual_reps,
          });
        }
      }
    });
  });

  const personalRecords = Array.from(exerciseMaxLoads.values())
    .sort((a, b) => b.max_load - a.max_load)
    .slice(0, 10);

  if (personalRecords.length > 0) {
    autoTableFn(doc, {
      startY: yPosition,
      head: [['Exercício', 'Carga Máxima', 'Reps', 'Data']],
      body: personalRecords.map(pr => [
        pr.exercise_name,
        `${pr.max_load}kg`,
        pr.reps,
        new Date(pr.date).toLocaleDateString('pt-BR'),
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      margin: { left: 20, right: 20 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(107, 114, 128);
    doc.text('Nenhum PR registrado neste período.', 25, yPosition);
    yPosition += 15;
  }

  // ===== STREAK INFO =====
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFillColor(...lightGray);
  doc.rect(20, yPosition, 170, 8, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('🔥 Consistência e Motivação', 25, yPosition + 6);

  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);

  doc.text(`Sequência atual: ${student.current_streak} dia${student.current_streak !== 1 ? 's' : ''} seguido${student.current_streak !== 1 ? 's' : ''}`, 25, yPosition);
  yPosition += 7;
  doc.text(`Melhor sequência: ${student.longest_streak} dia${student.longest_streak !== 1 ? 's' : ''}`, 25, yPosition);
  yPosition += 7;
  doc.text(`Total de treinos completados: ${student.total_workouts_completed}`, 25, yPosition);

  yPosition += 15;

  // Motivation message
  const motivationMessages = [
    'Continue assim! Sua dedicação está fazendo a diferença! 💪',
    'Parabéns pelo compromisso com seus objetivos! 🎯',
    'Resultados incríveis vêm de consistência. Você está no caminho certo! 🚀',
    'Cada treino te aproxima dos seus objetivos. Continue firme! ⚡',
  ];
  const randomMessage = motivationMessages[Math.floor(Math.random() * motivationMessages.length)];

  doc.setFillColor(254, 249, 195); // Yellow-100
  doc.setDrawColor(251, 191, 36); // Yellow-400
  doc.setLineWidth(0.5);
  doc.rect(20, yPosition, 170, 12, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...textColor);
  doc.text(randomMessage, 105, yPosition + 7, { align: 'center' });

  yPosition += 20;

  // ===== FOOTER =====
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, 280, 190, 280);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(`Personal Trainer: ${personalName}`, 20, 285);
    doc.text(`Página ${i} de ${pageCount}`, 190, 285, { align: 'right' });
    
    doc.setFontSize(8);
    doc.text('Gerado por FitCoach Pro', 105, 290, { align: 'center' });
  }

  return doc;
}
