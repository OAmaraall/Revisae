import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, loginWithGoogle, logoutUser } from '../firebase';
import { 
  Subject, 
  Content, 
  StudySession, 
  Review, 
  QuestionSession, 
  ErrorEntry,
  ContentStatus,
  DifficultyLevel,
  PriorityLevel,
  ReviewPerformance,
  ReviewStatus,
  ErrorStatus,
  WeeklyPlanner
} from '../types';

interface DataContextType {
  user: User | null;
  authLoading: boolean;
  subjects: Subject[];
  contents: Content[];
  studies: StudySession[];
  reviews: Review[];
  questions: QuestionSession[];
  errors: ErrorEntry[];
  weeklyPlanners: WeeklyPlanner[];
  dbLoading: boolean;
  
  // Auth actions
  login: () => Promise<User>;
  logout: () => Promise<void>;

  // Subject Actions
  saveSubject: (subject: Omit<Subject, 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  // Content Actions
  saveContent: (content: Omit<Content, 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;

  // Study Actions
  saveStudySession: (session: Omit<StudySession, 'id' | 'userId' | 'createdAt'>, createAutoReviews: boolean) => Promise<void>;
  deleteStudySession: (id: string) => Promise<void>;

  // Weekly Planner Actions
  saveWeeklyPlanner: (planner: Omit<WeeklyPlanner, 'userId' | 'createdAt'>) => Promise<void>;
  deleteWeeklyPlanner: (id: string) => Promise<void>;

  // Review Actions
  completeReview: (reviewId: string, performance: ReviewPerformance) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  scheduleCustomReview: (conteudoId: string, materiaId: string, daysAhead: number, label: string) => Promise<void>;

  // Question Actions
  saveQuestionSession: (session: Omit<QuestionSession, 'id' | 'userId' | 'createdAt' | 'taxaAcerto'>) => Promise<void>;
  deleteQuestionSession: (id: string) => Promise<void>;

  // Error Actions
  saveErrorEntry: (errorEntry: Omit<ErrorEntry, 'userId' | 'createdAt'>) => Promise<void>;
  toggleErrorStatus: (id: string, newStatus: ErrorStatus) => Promise<void>;
  deleteErrorEntry: (id: string) => Promise<void>;

  // Admin Actions
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => Promise<void>;
  clearAllUserData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dbLoading, setDbLoading] = useState(false);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [studies, setStudies] = useState<StudySession[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<QuestionSession[]>([]);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [weeklyPlanners, setWeeklyPlanners] = useState<WeeklyPlanner[]>([]);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
        setDbLoading(true);
        try {
          // Save user basic info in users/{uid}
          await setDoc(doc(db, "users", currentUser.uid), {
            uid: currentUser.uid,
            nome: currentUser.displayName || "",
            email: currentUser.email || "",
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.error("Failed saving user data:", e);
        } finally {
          setDbLoading(false);
        }
      } else {
        // Clear components states
        setSubjects([]);
        setContents([]);
        setStudies([]);
        setReviews([]);
        setQuestions([]);
        setErrors([]);
        setWeeklyPlanners([]);
      }
    });
    return unsubscribe;
  }, []);

  // 2. Realtime Sync Listeners
  useEffect(() => {
    if (!user) return;

    const uId = user.uid;

    const unsubSubjects = onSnapshot(collection(db, "users", uId, "subjects"), (snap) => {
      const list = snap.docs
        .map(d => d.data() as Subject);
      setSubjects(list.sort((a, b) => a.nome.localeCompare(b.nome)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "subjects");
    });

    const unsubContents = onSnapshot(collection(db, "users", uId, "contents"), (snap) => {
      const list = snap.docs
        .map(d => d.data() as Content);
      setContents(list.sort((a, b) => a.nome.localeCompare(b.nome)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "contents");
    });

    const unsubStudies = onSnapshot(collection(db, "users", uId, "studies"), (snap) => {
      const list = snap.docs
        .map(d => d.data() as StudySession);
      setStudies(list.sort((a, b) => b.data.localeCompare(a.data)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "studies");
    });

    const unsubReviews = onSnapshot(collection(db, "users", uId, "reviews"), (snap) => {
      const list = snap.docs
        .map(d => d.data() as Review);
      setReviews(list.sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "reviews");
    });

    const unsubQuestions = onSnapshot(collection(db, "users", uId, "questions"), (snap) => {
      const list = snap.docs
        .map(d => d.data() as QuestionSession);
      setQuestions(list.sort((a, b) => b.data.localeCompare(a.data)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "questions");
    });

    const unsubErrors = onSnapshot(collection(db, "users", uId, "errors"), (snap) => {
      const list = snap.docs
        .map(d => d.data() as ErrorEntry);
      setErrors(list.sort((a, b) => b.data.localeCompare(a.data)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "errors");
    });

    const unsubWeeklyPlanners = onSnapshot(collection(db, "users", uId, "weeklyPlanner"), (snap) => {
      const list = snap.docs
        .map(d => d.data() as WeeklyPlanner);
      setWeeklyPlanners(list.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "weeklyPlanner");
    });

    return () => {
      unsubSubjects();
      unsubContents();
      unsubStudies();
      unsubReviews();
      unsubQuestions();
      unsubErrors();
      unsubWeeklyPlanners();
    };
  }, [user]);

  // Auth operations
  const login = async () => {
    return await loginWithGoogle();
  };

  const logout = async () => {
    await logoutUser();
  };

  // SUBJECT CRUD
  const saveSubject = async (subject: Omit<Subject, 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const nowStr = new Date().toISOString();
    const id = subject.id || `sub_${Math.random().toString(36).substring(2, 11)}`;
    const path = `users/${user.uid}/subjects/${id}`;
    
    try {
      const docRef = doc(db, "users", user.uid, "subjects", id);
      const isNew = !subject.id;
      const data: Subject = {
        id,
        userId: user.uid,
        nome: subject.nome,
        peso: Number(subject.peso),
        prioridade: subject.prioridade,
        cor: subject.cor,
        createdAt: isNew ? nowStr : (subjects.find(s => s.id === id)?.createdAt || nowStr),
        updatedAt: nowStr
      };
      await setDoc(docRef, data);
    } catch (e) {
      handleFirestoreError(e, subject.id ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const deleteSubject = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/subjects/${id}`;
    try {
      await deleteDoc(doc(db, "users", user.uid, "subjects", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  // CONTENT CRUD
  const saveContent = async (content: Omit<Content, 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const nowStr = new Date().toISOString();
    const id = content.id || `cont_${Math.random().toString(36).substring(2, 11)}`;
    const path = `users/${user.uid}/contents/${id}`;
    
    try {
      const docRef = doc(db, "users", user.uid, "contents", id);
      const isNew = !content.id;
      const data: Content = {
        ...content,
        id,
        userId: user.uid,
        status: content.status as ContentStatus,
        dificuldade: content.dificuldade as DifficultyLevel,
        prioridade: content.prioridade as PriorityLevel,
        createdAt: isNew ? nowStr : (contents.find(c => c.id === id)?.createdAt || nowStr),
        updatedAt: nowStr
      } as Content;
      await setDoc(docRef, data);
    } catch (e) {
      handleFirestoreError(e, content.id ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const deleteContent = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/contents/${id}`;
    try {
      await deleteDoc(doc(db, "users", user.uid, "contents", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  // STUDY CRUD + Interval Generator Options
  const saveStudySession = async (
    session: Omit<StudySession, 'id' | 'userId' | 'createdAt'>, 
    createAutoReviews: boolean
  ) => {
    if (!user) return;
    const nowStr = new Date().toISOString();
    const id = `study_${Math.random().toString(36).substring(2, 11)}`;
    const path = `users/${user.uid}/studies/${id}`;
    
    try {
      const batch = writeBatch(db);
      
      // 1. Save study session
      const studyDocRef = doc(db, "users", user.uid, "studies", id);
      const studyData: StudySession = {
        ...session,
        id,
        userId: user.uid,
        minutosEstudados: Number(session.minutosEstudados),
        questoesFeitas: Number(session.questoesFeitas),
        acertos: Number(session.acertos),
        createdAt: nowStr
      };
      batch.set(studyDocRef, studyData);

      // 2. Adjust or update Content status if study metadata is changed
      const contentDocRef = doc(db, "users", user.uid, "contents", session.conteudoId);
      const foundContent = contents.find(c => c.id === session.conteudoId);
      if (foundContent) {
        // Automatically elevate status based on study actions if logical
        let updatedStatus = foundContent.status;
        if (session.metodo === "Aula/resumo" && foundContent.status === "Não iniciado") {
          updatedStatus = "Aula vista";
        } else if (session.metodo === "Questões depois da aula") {
          updatedStatus = "Questões feitas";
        } else if (session.metodo === "Revisão curta" || session.metodo === "Revisão profunda") {
          updatedStatus = "Em revisão";
        } else if (session.metodo === "Caderno de erros" && session.acertos === session.questoesFeitas && session.questoesFeitas > 0) {
          updatedStatus = "Dominado";
        }
        
        batch.update(contentDocRef, {
          status: updatedStatus,
          updatedAt: nowStr
        });
      }

      // 3. Spaced Repeat scheduler triggers if checked
      if (createAutoReviews) {
        const intervals = [
          { label: "D1", days: 1 },
          { label: "D7", days: 7 },
          { label: "D15", days: 15 },
          { label: "D30", days: 30 },
          { label: "D60", days: 60 },
          { label: "D120", days: 120 },
          { label: "D240", days: 240 }
        ];

        const baseTime = new Date(session.data + 'T12:00:00').getTime(); // Use study session date as timeline origin

        for (const item of intervals) {
          const reviewId = `rev_${Math.random().toString(36).substring(2, 11)}`;
          const revDocRef = doc(db, "users", user.uid, "reviews", reviewId);
          
          const scheduledTime = new Date(baseTime + item.days * 24 * 60 * 60 * 1000);
          const predStr = scheduledTime.toISOString().split('T')[0];

          const reviewData: Review = {
            id: reviewId,
            userId: user.uid,
            conteudoId: session.conteudoId,
            materiaId: session.materiaId,
            dataPrevista: predStr,
            tipoRevisao: item.label,
            status: "Pendente",
            createdAt: nowStr
          };
          
          batch.set(revDocRef, reviewData);
        }
      }

      // 4. Automatically complete any pending reviews for this content since the user just studied/revised it
      const pendingReviewsForContent = reviews.filter(
        r => r.conteudoId === session.conteudoId && r.status === "Pendente"
      );
      for (const r of pendingReviewsForContent) {
        const revDocRef = doc(db, "users", user.uid, "reviews", r.id);
        const mappedPerf: ReviewPerformance = 
          session.dificuldadePercebida === "Fácil" ? "Bom" :
          session.dificuldadePercebida === "Médio" ? "Médio" : "Ruim";
        
        batch.update(revDocRef, {
          status: "Feita" as ReviewStatus,
          dataFeita: session.data,
          desempenho: mappedPerf
        });
      }

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  };

  const deleteStudySession = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/studies/${id}`;
    try {
      await deleteDoc(doc(db, "users", user.uid, "studies", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  // WEEKLY PLANNER CRUD
  const saveWeeklyPlanner = async (planner: Omit<WeeklyPlanner, "userId" | "createdAt">) => {
    if (!user) return;
    const nowStr = new Date().toISOString();
    const id = planner.id || `week_${Math.random().toString(36).substring(2, 11)}`;
    const path = `users/${user.uid}/weeklyPlanner/${id}`;
    
    try {
      const docRef = doc(db, "users", user.uid, "weeklyPlanner", id);
      const isNew = !planner.id;
      const data: WeeklyPlanner = {
        ...planner,
        id,
        userId: user.uid,
        createdAt: isNew ? nowStr : (weeklyPlanners.find(wp => wp.id === id)?.createdAt || nowStr),
      };
      await setDoc(docRef, data);
    } catch (e) {
      handleFirestoreError(e, planner.id ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const deleteWeeklyPlanner = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/weeklyPlanner/${id}`;
    try {
      await deleteDoc(doc(db, "users", user.uid, "weeklyPlanner", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  // REVIEW ACTIONS + PERFORMANCE ADAPTATION
  const completeReview = async (reviewId: string, performance: ReviewPerformance) => {
    if (!user) return;
    const nowStr = new Date().toISOString();
    const todayStr = nowStr.split('T')[0];
    const path = `users/${user.uid}/reviews/${reviewId}`;

    try {
      const batch = writeBatch(db);
      const reviewDocRef = doc(db, "users", user.uid, "reviews", reviewId);
      const targetReview = reviews.find(r => r.id === reviewId);
      if (!targetReview) return;

      // Update current review
      batch.update(reviewDocRef, {
        status: "Feita" as ReviewStatus,
        desempenho: performance,
        dataFeita: todayStr
      });

      // Special adaptation algorithms requested:
      // "Se desempenho for Ruim, criar nova revisão em 2 dias."
      // "Se desempenho for Médio, criar nova revisão em 7 dias."
      // "Se desempenho for Bom, manter o fluxo normal."
      if (performance === "Ruim") {
        const nextId = `rev_${Math.random().toString(36).substring(2, 11)}`;
        const nextDocRef = doc(db, "users", user.uid, "reviews", nextId);
        
        const nextTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        const nextDateStr = nextTime.toISOString().split('T')[0];

        const adaptiveReview: Review = {
          id: nextId,
          userId: user.uid,
          conteudoId: targetReview.conteudoId,
          materiaId: targetReview.materiaId,
          dataPrevista: nextDateStr,
          tipoRevisao: "Adap. Ruim",
          status: "Pendente",
          createdAt: nowStr
        };
        batch.set(nextDocRef, adaptiveReview);
      } else if (performance === "Médio") {
        const nextId = `rev_${Math.random().toString(36).substring(2, 11)}`;
        const nextDocRef = doc(db, "users", user.uid, "reviews", nextId);
        
        const nextTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const nextDateStr = nextTime.toISOString().split('T')[0];

        const adaptiveReview: Review = {
          id: nextId,
          userId: user.uid,
          conteudoId: targetReview.conteudoId,
          materiaId: targetReview.materiaId,
          dataPrevista: nextDateStr,
          tipoRevisao: "Adap. Média",
          status: "Pendente",
          createdAt: nowStr
        };
        batch.set(nextDocRef, adaptiveReview);
      }

      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/reviews/${reviewId}`;
    try {
      await deleteDoc(doc(db, "users", user.uid, "reviews", reviewId));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  const scheduleCustomReview = async (conteudoId: string, materiaId: string, daysAhead: number, label: string) => {
    if (!user) return;
    const nowStr = new Date().toISOString();
    const id = `rev_${Math.random().toString(36).substring(2, 11)}`;
    const path = `users/${user.uid}/reviews/${id}`;

    try {
      const scheduledTime = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
      const dateStr = scheduledTime.toISOString().split('T')[0];

      const reviewData: Review = {
        id,
        userId: user.uid,
        conteudoId,
        materiaId,
        dataPrevista: dateStr,
        tipoRevisao: label,
        status: "Pendente",
        createdAt: nowStr
      };

      await setDoc(doc(db, "users", user.uid, "reviews", id), reviewData);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  };

  // QUESTION LIST CRUD
  const saveQuestionSession = async (session: Omit<QuestionSession, 'id' | 'userId' | 'createdAt' | 'taxaAcerto'>) => {
    if (!user) return;
    const nowStr = new Date().toISOString();
    const id = `q_${Math.random().toString(36).substring(2, 11)}`;
    const path = `users/${user.uid}/questions/${id}`;

    try {
      const total = Number(session.totalQuestoes);
      const hits = Number(session.acertos);
      const fails = Number(session.erros);
      const scoreRate = total > 0 ? Math.round((hits / total) * 100) : 0;

      const qData: QuestionSession = {
        ...session,
        id,
        userId: user.uid,
        totalQuestoes: total,
        acertos: hits,
        erros: fails,
        taxaAcerto: scoreRate,
        createdAt: nowStr
      };

      await setDoc(doc(db, "users", user.uid, "questions", id), qData);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  };

  const deleteQuestionSession = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/questions/${id}`;
    try {
      await deleteDoc(doc(db, "users", user.uid, "questions", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  // ERROR HANDLER & ERROR ENTRY SPECIALISTS
  const saveErrorEntry = async (errorEntry: Omit<ErrorEntry, 'userId' | 'createdAt'>) => {
    if (!user) return;
    const nowStr = new Date().toISOString();
    const id = errorEntry.id || `err_${Math.random().toString(36).substring(2, 11)}`;
    const path = `users/${user.uid}/errors/${id}`;

    try {
      const isNew = !errorEntry.id;
      const data: ErrorEntry = {
        ...errorEntry,
        id,
        userId: user.uid,
        status: errorEntry.status as ErrorStatus,
        createdAt: isNew ? nowStr : (errors.find(e => e.id === id)?.createdAt || nowStr),
      };
      await setDoc(doc(db, "users", user.uid, "errors", id), data);
    } catch (e) {
      handleFirestoreError(e, errorEntry.id ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const toggleErrorStatus = async (id: string, newStatus: ErrorStatus) => {
    if (!user) return;
    const path = `users/${user.uid}/errors/${id}`;
    try {
      await updateDoc(doc(db, "users", user.uid, "errors", id), { status: newStatus });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  const deleteErrorEntry = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/errors/${id}`;
    try {
      await deleteDoc(doc(db, "users", user.uid, "errors", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  // EXPORT / IMPORT / RESET ENGINE (JSON backend backup)
  const exportDataJSON = () => {
    const dataObj = {
      app: "Revisae",
      exportDate: new Date().toISOString(),
      subjects,
      contents,
      studies,
      reviews,
      questions,
      errors,
      weeklyPlanners
    };
    return JSON.stringify(dataObj, null, 2);
  };

  const importDataJSON = async (jsonStr: string) => {
    if (!user) throw new Error("Apenas usuários logados podem importar dados.");
    
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.app !== "Revisae") {
        throw new Error("Arquivo JSON inválido. Verifique se é uma exportação oficial do Revisae.");
      }

      console.log("Importing JSON dataset into Firestore...");
      const batch = writeBatch(db);
      const uid = user.uid;

      // Import subjects
      if (Array.isArray(parsed.subjects)) {
        parsed.subjects.forEach((sub: any) => {
          if (sub.id && sub.nome) {
            const docRef = doc(db, "users", uid, "subjects", sub.id);
            batch.set(docRef, {
              id: sub.id,
              userId: uid,
              nome: sub.nome,
              peso: Number(sub.peso || 1),
              prioridade: sub.prioridade || "Média",
              cor: sub.cor || "#6B7280",
              createdAt: sub.createdAt || new Date().toISOString(),
              updatedAt: sub.updatedAt || new Date().toISOString()
            });
          }
        });
      }

      // Import contents
      if (Array.isArray(parsed.contents)) {
        parsed.contents.forEach((cont: any) => {
          if (cont.id && cont.nome && cont.materiaId) {
            const docRef = doc(db, "users", uid, "contents", cont.id);
            batch.set(docRef, {
              id: cont.id,
              userId: uid,
              materiaId: cont.materiaId,
              nome: cont.nome,
              bloco: cont.bloco || "Geral",
              status: cont.status || "Não iniciado",
              dificuldade: cont.dificuldade || "Médio",
              prioridade: cont.prioridade || "Média",
              dataLimite: cont.dataLimite || new Date().toISOString().split('T')[0],
              observacoes: cont.observacoes || "",
              createdAt: cont.createdAt || new Date().toISOString(),
              updatedAt: cont.updatedAt || new Date().toISOString()
            });
          }
        });
      }

      // Import studies
      if (Array.isArray(parsed.studies)) {
        parsed.studies.forEach((st: any) => {
          if (st.id && st.materiaId && st.conteudoId) {
            const docRef = doc(db, "users", uid, "studies", st.id);
            batch.set(docRef, {
              id: st.id,
              userId: uid,
              data: st.data || new Date().toISOString().split('T')[0],
              materiaId: st.materiaId,
              conteudoId: st.conteudoId,
              metodo: st.metodo || "Aula/resumo",
              minutosEstudados: Number(st.minutosEstudados || 0),
              questoesFeitas: Number(st.questoesFeitas || 0),
              acertos: Number(st.acertos || 0),
              dificuldadePercebida: st.dificuldadePercebida || "Médio",
              observacao: st.observacao || "",
              createdAt: st.createdAt || new Date().toISOString()
            });
          }
        });
      }

      // Import reviews
      if (Array.isArray(parsed.reviews)) {
        parsed.reviews.forEach((rv: any) => {
          if (rv.id && rv.conteudoId && rv.materiaId) {
            const docRef = doc(db, "users", uid, "reviews", rv.id);
            batch.set(docRef, {
              id: rv.id,
              userId: uid,
              materiaId: rv.materiaId,
              conteudoId: rv.conteudoId,
              dataPrevista: rv.dataPrevista || new Date().toISOString().split('T')[0],
              tipoRevisao: rv.tipoRevisao || "D1",
              status: rv.status || "Pendente",
              desempenho: rv.desempenho || null,
              dataFeita: rv.dataFeita || null,
              createdAt: rv.createdAt || new Date().toISOString()
            });
          }
        });
      }

      // Import questions
      if (Array.isArray(parsed.questions)) {
        parsed.questions.forEach((q: any) => {
          if (q.id && q.materiaId && q.conteudoId) {
            const docRef = doc(db, "users", uid, "questions", q.id);
            batch.set(docRef, {
              id: q.id,
              userId: uid,
              data: q.data || new Date().toISOString().split('T')[0],
              materiaId: q.materiaId,
              conteudoId: q.conteudoId,
              fonte: q.fonte || "Geral",
              totalQuestoes: Number(q.totalQuestoes || 0),
              acertos: Number(q.acertos || 0),
              erros: Number(q.erros || 0),
              taxaAcerto: Number(q.taxaAcerto || 0),
              createdAt: q.createdAt || new Date().toISOString()
            });
          }
        });
      }

      // Import errors
      if (Array.isArray(parsed.errors)) {
        parsed.errors.forEach((err: any) => {
          if (err.id && err.materiaId && err.conteudoId) {
            const docRef = doc(db, "users", uid, "errors", err.id);
            batch.set(docRef, {
              id: err.id,
              userId: uid,
              data: err.data || new Date().toISOString().split('T')[0],
              materiaId: err.materiaId,
              conteudoId: err.conteudoId,
              descricaoErro: err.descricaoErro || "",
              explicacaoCorreta: err.explicacaoCorreta || "",
              comoEvitar: err.comoEvitar || "",
              status: err.status || "aberto",
              createdAt: err.createdAt || new Date().toISOString()
            });
          }
        });
      }

      // Import weekly planners
      if (Array.isArray(parsed.weeklyPlanners)) {
        parsed.weeklyPlanners.forEach((wp: any) => {
          if (wp.id && wp.titulo) {
            const docRef = doc(db, "users", uid, "weeklyPlanner", wp.id);
            batch.set(docRef, {
              id: wp.id,
              userId: uid,
              titulo: wp.titulo,
              itens: Array.isArray(wp.itens) ? wp.itens : [],
              createdAt: wp.createdAt || new Date().toISOString()
            });
          }
        });
      }

      await batch.commit();
      console.log("JSON import successful!");
    } catch (e) {
      console.error("Failed importing JSON:", e);
      throw new Error("Erro ao importar JSON. Verifique a formatação do arquivo.");
    }
  };

  const clearAllUserData = async () => {
    if (!user) return;
    console.log("Wiping all cloud database registries for user:", user.uid);
    
    try {
      const collectionsToWipe = ["subjects", "contents", "studies", "reviews", "questions", "errors", "weeklyPlanner"];
      
      for (const colName of collectionsToWipe) {
        const snap = await getDocs(collection(db, "users", user.uid, colName));
        const userDocs = snap.docs;
        if (userDocs.length === 0) continue;

        // Perform parallel batch deletes
        const batch = writeBatch(db);
        userDocs.forEach(d => {
          batch.delete(doc(db, "users", user.uid, colName, d.id));
        });
        await batch.commit();
      }
      
      console.log("Wipe completed successfully.");
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, "wipe_all");
    }
  };

  return (
    <DataContext.Provider value={{
      user,
      authLoading,
      subjects,
      contents,
      studies,
      reviews,
      questions,
      errors,
      weeklyPlanners,
      dbLoading,
      login,
      logout,
      saveSubject,
      deleteSubject,
      saveContent,
      deleteContent,
      saveStudySession,
      deleteStudySession,
      saveWeeklyPlanner,
      deleteWeeklyPlanner,
      completeReview,
      deleteReview,
      scheduleCustomReview,
      saveQuestionSession,
      deleteQuestionSession,
      saveErrorEntry,
      toggleErrorStatus,
      deleteErrorEntry,
      exportDataJSON,
      importDataJSON,
      clearAllUserData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
