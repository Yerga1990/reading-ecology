
export interface Question {
  id: string;
  type: 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN' | 'MULTIPLE_CHOICE' | 'MATCHING' | 'GAP_FILL' | 'CLASSIFICATION';
  text: string;
  label: string;
  options?: string[]; // For multiple choice
}

export interface Passage {
  id: number;
  title: string;
  content: string[]; // Array of paragraphs
  questions: Question[];
  questionInstruction: string;
  offlineQuiz?: QuizItem[]; // Pre-baked questions for offline mode
}

export interface SavedWord {
  id: string;
  word: string;
  translation: string;
  context: string; // The sentence it appeared in
  definition?: string;
  synonyms?: string[];
  timestamp: number;
  // Spaced Repetition (Leitner System)
  leitnerBox: number; // 0-5
  nextReview: number; // Timestamp when this word should be reviewed next
}

export enum AppTab {
  READING = 'READING',
  VOCABULARY = 'VOCABULARY',
  QUIZ = 'QUIZ'
}

export interface QuizItem {
  word: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  synonyms?: string[];
}
