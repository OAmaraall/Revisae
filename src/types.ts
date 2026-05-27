export interface Subject {
  id: string;
  userId: string;
  nome: string;
  peso: number;
  prioridade: "Alta" | "Média" | "Baixa";
  cor: string;
  createdAt: string;
  updatedAt: string;
}

export type ContentStatus = "Não iniciado" | "Resumo lido" | "Aula vista" | "Questões feitas" | "Em revisão" | "Dominado";
export type DifficultyLevel = "Fácil" | "Médio" | "Difícil";
export type PriorityLevel = "Alta" | "Média" | "Baixa";

export interface Content {
  id: string;
  userId: string;
  materiaId: string;
  nome: string;
  bloco: string;
  status: ContentStatus;
  dificuldade: DifficultyLevel;
  prioridade: PriorityLevel;
  dataLimite: string; // YYYY-MM-DD
  observacoes: string;
  createdAt: string;
  updatedAt: string;
}

export type StudyMethod = 
  | "Questão antes da aula"
  | "Aula/resumo"
  | "Questões depois da aula"
  | "Revisão curta"
  | "Revisão profunda"
  | "Caderno de erros";

export interface StudySession {
  id: string;
  userId: string;
  data: string; // YYYY-MM-DD
  materiaId: string;
  conteudoId: string;
  metodo: StudyMethod;
  minutosEstudados: number;
  questoesFeitas: number;
  acertos: number;
  dificuldadePercebida: DifficultyLevel;
  observacao: string;
  createdAt: string;
}

export type ReviewStatus = "Pendente" | "Feita" | "Atrasada";
export type ReviewPerformance = "Ruim" | "Médio" | "Bom";

export interface Review {
  id: string;
  userId: string;
  conteudoId: string;
  materiaId: string;
  dataPrevista: string; // YYYY-MM-DD
  tipoRevisao: string; // D1, D7, D15, D30, D60, D120, D240, or adapting days like "+2d", "+7d"
  status: ReviewStatus;
  desempenho?: ReviewPerformance; // only after done
  dataFeita?: string; // YYYY-MM-DD
  createdAt: string;
}

export interface QuestionSession {
  id: string;
  userId: string;
  data: string; // YYYY-MM-DD
  materiaId: string;
  conteudoId: string;
  fonte: string;
  totalQuestoes: number;
  acertos: number;
  erros: number;
  taxaAcerto: number; // 0 - 100
  createdAt: string;
}

export type ErrorStatus = "aberto" | "revisado" | "resolvido";

export interface ErrorEntry {
  id: string;
  userId: string;
  data: string; // YYYY-MM-DD
  materiaId: string;
  conteudoId: string;
  descricaoErro: string;
  explicacaoCorreta: string;
  comoEvitar: string;
  status: ErrorStatus;
  createdAt: string;
}

export interface PlannerItem {
  id: string;
  diaSemana: "Segunda" | "Terça" | "Quarta" | "Quinta" | "Sexta" | "Sábado" | "Domingo";
  materiaId: string;
  conteudoId: string;
  concluido: boolean;
  estudadoEm?: string; // YYYY-MM-DD
}

export interface WeeklyPlanner {
  id: string;
  userId: string;
  titulo: string; // E.g., "Meta da Semana"
  itens: PlannerItem[];
  createdAt: string;
}

