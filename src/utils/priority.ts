import { Content, Subject, Review, QuestionSession } from '../types';

export interface ScoredContent {
  content: Content;
  subject?: Subject;
  score: number;
  reasons: string[];
  isOverdueReview: boolean;
  isOverdueDate: boolean;
  averageAccuracy: number | null;
}

export function calculatePriorityScore(
  content: Content,
  subject: Subject | undefined,
  reviewsForContent: Review[],
  questionsForContent: QuestionSession[]
): ScoredContent {
  let score = 0;
  const reasons: string[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Subject Weight
  const weight = subject?.peso || 1;
  const weightScore = weight * 4;
  score += weightScore;
  reasons.push(`Peso da matéria: +${weightScore} pts`);

  // 2. Difficulty
  let diffScore = 0;
  if (content.dificuldade === 'Difícil') {
    diffScore = 20;
    score += diffScore;
    reasons.push("Nível Difícil: +20 pts");
  } else if (content.dificuldade === 'Médio') {
    diffScore = 10;
    score += diffScore;
    reasons.push("Nível Médio: +10 pts");
  }

  // 3. Status Rule
  if (content.status === 'Não iniciado') {
    score += 15;
    reasons.push("Status Não Iniciado: +15 pts");
  } else if (content.status === 'Resumo lido' || content.status === 'Aula vista') {
    score += 10;
    reasons.push("Início de aprendizado: +10 pts");
  } else if (content.status === 'Questões feitas' || content.status === 'Em revisão') {
    score += 5;
    reasons.push("Em progresso: +5 pts");
  } else if (content.status === 'Dominado') {
    score -= 25; // Dominados devem ter menor prioridade
    reasons.push("Dominado (Reduzido): -25 pts");
  }

  // 4. Deadline (data limite)
  let isOverdueDate = false;
  if (content.dataLimite) {
    if (content.dataLimite < todayStr) {
      score += 35;
      isOverdueDate = true;
      reasons.push("Prazo de estudo vencido: +35 pts");
    } else if (content.dataLimite === todayStr) {
      score += 25;
      reasons.push("Prazo de estudo é hoje: +25 pts");
    } else {
      // Calculate remaining days
      const daysLeft = Math.ceil(
        (new Date(content.dataLimite).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24)
      );
      if (daysLeft <= 3 && daysLeft > 0) {
        score += 15;
        reasons.push(`Prazo próximo (${daysLeft} dias): +15 pts`);
      } else if (daysLeft <= 7 && daysLeft > 3) {
        score += 5;
        reasons.push(`Prazo menor que 1 semana: +5 pts`);
      }
    }
  }

  // 5. Accuracy Rate (taxa de acerto baixa)
  let averageAccuracy: number | null = null;
  if (questionsForContent.length > 0) {
    const totalQObj = questionsForContent.reduce(
      (acc, curr) => ({
        total: acc.total + curr.totalQuestoes,
        acertos: acc.acertos + curr.acertos
      }),
      { total: 0, acertos: 0 }
    );
    if (totalQObj.total > 0) {
      averageAccuracy = Math.round((totalQObj.acertos / totalQObj.total) * 100);
      if (averageAccuracy < 60) {
        const accuracyPenalty = Math.round((60 - averageAccuracy) * 0.4) + 15;
        score += accuracyPenalty;
        reasons.push(`Taxa de acertos baixa (${averageAccuracy}%): +${accuracyPenalty} pts`);
      } else if (averageAccuracy < 80) {
        score += 8;
        reasons.push(`Taxa de acertos mediana (${averageAccuracy}%): +8 pts`);
      }
    }
  }

  // 6. Overdue repetition reviews (revisões pendentes atrasadas)
  let isOverdueReview = false;
  const pendingReviews = reviewsForContent.filter(r => r.status === 'Pendente');
  if (pendingReviews.length > 0) {
    const activeOverdues = pendingReviews.filter(r => r.dataPrevista <= todayStr);
    if (activeOverdues.length > 0) {
      score += 30;
      isOverdueReview = true;
      reasons.push("Revisão agendada vencida: +30 pts");
    } else {
      score += 5;
      reasons.push("Revisão agendada pendente breve: +5 pts");
    }
  }

  return {
    content,
    subject,
    score,
    reasons,
    isOverdueReview,
    isOverdueDate,
    averageAccuracy
  };
}
