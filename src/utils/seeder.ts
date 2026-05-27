import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Subject, Content } from '../types';

export const DEFAULT_SUBJECTS = [
  { nome: "Matemática", peso: 3, prioridade: "Alta" as const, cor: "#EF4444" },
  { nome: "Física", peso: 3, prioridade: "Alta" as const, cor: "#F59E0B" },
  { nome: "Química", peso: 3, prioridade: "Alta" as const, cor: "#10B981" },
  { nome: "Biologia", peso: 3, prioridade: "Alta" as const, cor: "#3B82F6" },
  { nome: "História", peso: 2, prioridade: "Média" as const, cor: "#8B5CF6" },
  { nome: "Geografia", peso: 2, prioridade: "Média" as const, cor: "#EC4899" },
  { nome: "Linguagens", peso: 2, prioridade: "Média" as const, cor: "#6B7280" },
  { nome: "Redação", peso: 3, prioridade: "Alta" as const, cor: "#06B6D4" },
  { nome: "Filosofia/Sociologia", peso: 1, prioridade: "Baixa" as const, cor: "#14B8A6" },
  { nome: "Inglês", peso: 1, prioridade: "Baixa" as const, cor: "#6366F1" },
  { nome: "Espanhol", peso: 1, prioridade: "Baixa" as const, cor: "#A855F7" },
];

export const DEFAULT_CONTENTS: { [key: string]: string[] } = {
  "Matemática": [
    "Conjuntos",
    "Conjuntos Numéricos",
    "Dízimas Periódicas",
    "Potenciação",
    "Radiciação",
    "Porcentagem",
    "Juros"
  ],
  "Física": [
    "Princípios de Pascal"
  ],
  "Química": [
    "Separação de misturas"
  ],
  "Biologia": [
    "Membrana celular"
  ],
  "História": [
    "União Ibérica",
    "Invasões estrangeiras"
  ],
  "Geografia": [
    "Movimentos da Terra"
  ]
};

export async function seedUserDataIfEmpty(userId: string) {
  try {
    // Check if subjects collection already has some items for this user
    const subjectsSnap = await getDocs(collection(db, "users", userId, "subjects"));
    const userSubjects = subjectsSnap.docs;

    if (userSubjects.length > 0) {
      // User already has some data, don't overwrite/reseed
      return;
    }

    console.log("Seeding initial medical subjects/contents for user:", userId);
    
    // Create subjects
    const batch = writeBatch(db);
    const subjectIdMap = new Map<string, string>();
    const now = new Date().toISOString();

    for (const sub of DEFAULT_SUBJECTS) {
      const newId = `sub_${Math.random().toString(36).substring(2, 11)}`;
      const subDocRef = doc(db, "users", userId, "subjects", newId);
      
      const subjectData: Subject = {
        id: newId,
        userId,
        nome: sub.nome,
        peso: sub.peso,
        prioridade: sub.prioridade,
        cor: sub.cor,
        createdAt: now,
        updatedAt: now
      };

      batch.set(subDocRef, subjectData);
      subjectIdMap.set(sub.nome, newId);
    }

    // Create default contents linked to those subjects
    for (const [subNome, contentsList] of Object.entries(DEFAULT_CONTENTS)) {
      const subId = subjectIdMap.get(subNome);
      if (!subId) continue;

      for (const contentNome of contentsList) {
        const contentId = `cont_${Math.random().toString(36).substring(2, 11)}`;
        const contentDocRef = doc(db, "users", userId, "contents", contentId);
        
        // Give some initial offset days for realistic scheduling deadlines
        const randomDaysOffset = Math.floor(Math.random() * 20) + 1;
        const targetDate = new Date(Date.now() + randomDaysOffset * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const contentData: Content = {
          id: contentId,
          userId,
          materiaId: subId,
          nome: contentNome,
          bloco: "Módulo Básico 01",
          status: "Não iniciado",
          dificuldade: "Médio",
          prioridade: "Média",
          dataLimite: targetDate,
          observacoes: "Conteúdo pré-vestibular sugerido para Medicina.",
          createdAt: now,
          updatedAt: now
        };

        batch.set(contentDocRef, contentData);
      }
    }

    await batch.commit();
    console.log("Seeding complete!");
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "seeding");
  }
}
