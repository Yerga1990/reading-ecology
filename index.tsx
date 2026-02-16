import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  BookOpen, 
  Library, 
  Brain, 
  Check, 
  X, 
  Loader2, 
  RotateCcw, 
  GraduationCap, 
  FileQuestion, 
  Trophy, 
  Play, 
  WifiOff, 
  Sparkles
} from 'lucide-react';
import { PASSAGES, LOCAL_DICTIONARY } from './constants';
import { AppTab, Passage, Question, SavedWord, QuizItem } from './types';

// --- Helper: Spaced Repetition Logic (Leitner System) ---
const REVIEW_INTERVALS = [0, 1, 3, 7, 14, 30]; // Days for each box

const getNextReviewDate = (box: number): number => {
  const days = REVIEW_INTERVALS[Math.min(box, REVIEW_INTERVALS.length - 1)];
  return Date.now() + days * 24 * 60 * 60 * 1000;
};

// --- Helper: Text Processing ---
const splitParagraphIntoWords = (text: string) => {
  return text.split(/(\s+)/).map((segment, i) => {
    if (segment.trim() === '') return { text: segment, id: i, isWord: false };
    // Keep original text for display
    // Cleanup for lookup: lowercase, remove possessives ('s), remove surrounding punctuation
    const cleanWord = segment.toLowerCase().replace(/['’]s$/, '').replace(/^[^\wА-Яа-я]+|[^\wА-Яа-я]+$/g, ''); 
    return { text: segment, word: cleanWord, isWord: true, id: i };
  });
};

const App = () => {
  const [currentTab, setCurrentTab] = useState<AppTab>(AppTab.READING);
  const [activePassageId, setActivePassageId] = useState<number>(1);
  const [savedWords, setSavedWords] = useState<SavedWord[]>(() => {
    const saved = localStorage.getItem('ielts_vocab_words');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ielts_vocab_words', JSON.stringify(savedWords));
  }, [savedWords]);

  const activePassage = PASSAGES.find(p => p.id === activePassageId) || PASSAGES[0];

  const handleSaveWord = (newWord: SavedWord) => {
    setSavedWords(prev => {
      if (prev.some(w => w.word.toLowerCase() === newWord.word.toLowerCase())) return prev;
      return [...prev, newWord];
    });
  };

  const handleUpdateWordProgress = (id: string, success: boolean) => {
    setSavedWords(prev => prev.map(w => {
      if (w.id !== id) return w;
      let newBox = success ? Math.min(w.leitnerBox + 1, REVIEW_INTERVALS.length - 1) : 0;
      return { ...w, leitnerBox: newBox, nextReview: getNextReviewDate(newBox) };
    }));
  };

  const renderContent = () => {
    switch (currentTab) {
      case AppTab.READING:
        return (
          <ReadingView 
            passages={PASSAGES} 
            activePassage={activePassage} 
            onSelectPassage={setActivePassageId}
            onSaveWord={handleSaveWord}
          />
        );
      case AppTab.VOCABULARY:
        return (
          <VocabularyView 
            words={savedWords} 
            onUpdateProgress={handleUpdateWordProgress}
            onDeleteWord={(id) => setSavedWords(prev => prev.filter(w => w.id !== id))}
          />
        );
      case AppTab.QUIZ:
        return <QuizView passages={PASSAGES} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col overflow-x-hidden">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 w-full shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
            <span className="text-xl font-bold tracking-tight text-gray-900 hidden sm:inline">IELTS Prep</span>
          </div>
          <nav className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setCurrentTab(AppTab.READING)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentTab === AppTab.READING ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-indigo-500'}`}>
              <div className="flex items-center space-x-2"><BookOpen className="w-4 h-4" /><span>Reading</span></div>
            </button>
            <button onClick={() => setCurrentTab(AppTab.VOCABULARY)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentTab === AppTab.VOCABULARY ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-indigo-500'}`}>
              <div className="flex items-center space-x-2"><Brain className="w-4 h-4" /><span>My Vocab</span></div>
            </button>
            <button onClick={() => setCurrentTab(AppTab.QUIZ)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentTab === AppTab.QUIZ ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-indigo-500'}`}>
              <div className="flex items-center space-x-2"><FileQuestion className="w-4 h-4" /><span>AI Quiz</span></div>
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 overflow-y-visible">
        {renderContent()}
      </main>
    </div>
  );
};

const ReadingView = ({ passages, activePassage, onSelectPassage, onSaveWord }: any) => {
  const [selectedWordData, setSelectedWordData] = useState<any>(null);
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-fit">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-t-2xl">
          <select 
            value={activePassage.id} 
            onChange={(e) => onSelectPassage(Number(e.target.value))} 
            className="w-full sm:w-auto pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-50 outline-none"
          >
            {passages.map((p: any) => (<option key={p.id} value={p.id}>Passage {p.id}: {p.title}</option>))}
          </select>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border border-gray-100">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
             OFFLINE TRANSLATION ACTIVE
          </div>
        </div>
        <div className="p-8 md:p-12 leading-relaxed text-lg text-gray-800 font-serif select-none">
          <h1 className="text-4xl font-black mb-8 leading-tight tracking-tight text-gray-900">{activePassage.title}</h1>
          {activePassage.content.map((paragraph: string, pIdx: number) => (
            <p key={pIdx} className="mb-8 last:mb-0">
              {splitParagraphIntoWords(paragraph).map((item) => (
                <span 
                  key={item.id} 
                  className={item.isWord ? "cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-[0_0_0_2px_rgba(99,102,241,0.1)] rounded px-0.5 transition-all duration-150 active:scale-95 inline-block" : ""} 
                  onClick={() => item.isWord && setSelectedWordData({ word: item.word, context: paragraph })}
                >
                  {item.text}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>

      <div className="lg:w-[400px] lg:sticky lg:top-24 lg:self-start h-fit">
        <QuestionsPanel passage={activePassage} />
      </div>
      
      {selectedWordData && (
        <TranslationModal 
          word={selectedWordData.word} 
          context={selectedWordData.context} 
          onClose={() => setSelectedWordData(null)} 
          onSave={onSaveWord} 
        />
      )}
    </div>
  );
};

const QuestionsPanel = ({ passage }: { passage: Passage }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col lg:max-h-[calc(100vh-140px)]">
      <div className="p-5 border-b border-gray-200 bg-gray-50 font-bold text-gray-900 flex items-center gap-3">
        <Library className="w-5 h-5 text-indigo-600" />
        <span>Answer Sheet</span>
      </div>
      <div className="p-6 overflow-y-auto space-y-10 custom-scrollbar">
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-xs font-semibold text-indigo-700 italic leading-relaxed">
          {passage.questionInstruction}
        </div>
        {passage.questions.map((q) => (
          <div key={q.id} className="space-y-4">
            <div className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center text-xs font-black shadow-sm">{q.label}</span>
              <p className="text-gray-800 text-sm font-bold leading-snug">{q.text}</p>
            </div>
            <div className="ml-11">
              {q.type === 'TRUE_FALSE_NOT_GIVEN' || q.type === 'YES_NO_NOT_GIVEN' ? (
                <div className="flex flex-wrap gap-4">
                  {(q.type === 'TRUE_FALSE_NOT_GIVEN' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : ['YES', 'NO', 'NOT GIVEN']).map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer text-[11px] font-black text-gray-500 hover:text-indigo-600 transition-colors">
                      <input type="radio" name={q.id} className="w-4 h-4 text-indigo-600" /> {opt}
                    </label>
                  ))}
                </div>
              ) : q.type === 'MULTIPLE_CHOICE' || q.type === 'MATCHING' || q.type === 'CLASSIFICATION' ? (
                <div className="space-y-2">
                  {q.options?.map((opt, idx) => (
                    <label key={idx} className="flex items-start gap-3 cursor-pointer text-sm text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-50 group">
                      <input type="radio" name={q.id} className="mt-0.5 w-4 h-4 text-indigo-600" /> 
                      <span className="group-hover:translate-x-1 transition-transform">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input 
                  type="text" 
                  placeholder="Type your answer..." 
                  className="w-full border border-gray-200 rounded-xl text-sm p-3 focus:ring-2 focus:ring-indigo-50 outline-none bg-gray-50" 
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TranslationModal = ({ word, context, onClose, onSave }: any) => {
  const [saved, setSaved] = useState(false);
  
  // Strict cleanup for dictionary match: lowercase, remove possessives ('s), remove outer punctuation
  const cleanWord = word.toLowerCase().replace(/['’]s$/, '').replace(/^[^\wА-Яа-я]+|[^\wА-Яа-я]+$/g, '');
  const entry = LOCAL_DICTIONARY[cleanWord];
  
  const data = entry ? {
    translation: entry.t,
    definition: entry.d,
    synonyms: entry.s
  } : {
    // Fallback in case something is still missed, though user wants everything in base.
    translation: `Перевод для "${word}"`,
    definition: "Tap to save and review later.",
    synonyms: []
  };

  const isPrebaked = !!entry;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in-95 border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X size={20} />
        </button>
        <div className="flex items-center gap-4 mb-8">
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${isPrebaked ? 'bg-indigo-600' : 'bg-gray-400'}`}>
              <Library size={28} />
           </div>
           <div>
              <h3 className="text-3xl font-black capitalize tracking-tight text-gray-900 leading-none">{cleanWord}</h3>
              <div className="mt-2 flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm ${isPrebaked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {isPrebaked ? <Check size={12} /> : <WifiOff size={12} />}
                  {isPrebaked ? 'INSTANT OFFLINE' : 'OFFLINE MODE'}
                </span>
              </div>
           </div>
        </div>
        
        <div className="space-y-8">
          <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 shadow-inner">
            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-3">Russian Translation</label>
            <p className="text-3xl text-indigo-700 font-black leading-none">{data.translation}</p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Academic Meaning</label>
              <p className="text-gray-700 font-medium leading-relaxed">{data.definition}</p>
            </div>

            {data.synonyms && data.synonyms.length > 0 && (
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Synonyms</label>
                <div className="flex flex-wrap gap-2">
                  {data.synonyms.map((s: string, idx: number) => (
                    <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-black capitalize border border-gray-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => { 
              onSave({ 
                id: crypto.randomUUID(), 
                word: cleanWord, 
                translation: data.translation, 
                definition: data.definition, 
                synonyms: data.synonyms, 
                context, 
                timestamp: Date.now(), 
                leitnerBox: 0, 
                nextReview: Date.now() 
              }); 
              setSaved(true); 
              setTimeout(onClose, 800); 
            }} 
            disabled={saved} 
            className={`w-full py-6 rounded-2xl font-black text-lg transition-all transform active:scale-[0.98] shadow-xl ${saved ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
          >
            {saved ? 'Word Saved!' : 'Add to My Dictionary'}
          </button>
        </div>
      </div>
    </div>
  );
};

const QuizView = ({ passages }: { passages: Passage[] }) => {
  const [stage, setStage] = useState<'SETUP' | 'LOADING' | 'PLAYING' | 'RESULT'>('SETUP');
  const [selectedPassageId, setSelectedPassageId] = useState(passages[0].id);
  const [questions, setQuestions] = useState<QuizItem[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const autoNextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateQuiz = async () => {
    const passage = passages.find(p => p.id === selectedPassageId);
    if (!passage) return;
    setStage('LOADING');
    
    // Always use pre-baked offline quiz for instant response
    if (passage.offlineQuiz) {
      setQuestions([...passage.offlineQuiz].sort(() => 0.5 - Math.random()));
      setTimeout(() => {
        setStage('PLAYING');
        setCurrentQIndex(0); setScore(0); setSelectedOption(null); setIsAnswered(false);
      }, 500);
    }
  };

  const nextQuestion = () => {
    if (autoNextTimeoutRef.current) clearTimeout(autoNextTimeoutRef.current);
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setStage('RESULT');
    }
  };

  const handleSelectAnswer = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    const correct = idx === questions[currentQIndex].correctAnswerIndex;
    if (correct) setScore(s => s + 1);
    autoNextTimeoutRef.current = setTimeout(() => { nextQuestion(); }, 3000);
  };

  if (stage === 'SETUP') return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white p-10 md:p-16 rounded-[2.5rem] shadow-xl space-y-10 text-center border border-gray-100 flex flex-col items-center">
        <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl animate-bounce-slow">
           <Library size={48} />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">Vocabulary Quiz</h2>
          <p className="text-gray-500 font-medium text-lg max-w-sm mx-auto">Master high-level academic vocabulary from the official reading texts.</p>
        </div>
        <div className="w-full max-w-sm text-left space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Source Reading Text</label>
          <select 
            value={selectedPassageId} 
            onChange={(e) => setSelectedPassageId(Number(e.target.value))} 
            className="w-full p-5 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none bg-gray-50 font-bold text-gray-700 transition-all cursor-pointer"
          >
            {passages.map(p => <option key={p.id} value={p.id}>Passage {p.id}: {p.title}</option>)}
          </select>
        </div>
        <button 
          onClick={generateQuiz} 
          className="w-full max-w-sm py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-xl shadow-xl transform active:scale-[0.98] flex items-center justify-center gap-4 group"
        >
          <Play size={24} fill="currentColor" />
          START OFFLINE QUIZ
        </button>
      </div>
    </div>
  );

  if (stage === 'LOADING') return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center py-20">
      <Loader2 className="w-20 h-20 animate-spin text-indigo-600" />
      <h3 className="text-3xl font-black tracking-tight text-gray-900">Preparing Quiz...</h3>
    </div>
  );

  if (stage === 'RESULT') return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white p-12 md:p-16 rounded-[3rem] shadow-2xl text-center border border-gray-100">
        <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-8" />
        <h2 className="text-7xl font-black mb-4 text-gray-900 leading-none">{score} <span className="text-3xl text-gray-300 font-bold">/ {questions.length}</span></h2>
        <button onClick={() => setStage('SETUP')} className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xl shadow-xl transition-all">Try Another Quiz</button>
      </div>
    </div>
  );

  const curQ = questions[currentQIndex];
  const progress = ((currentQIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-10 space-y-5 px-2">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
             <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
               Question {currentQIndex + 1}
             </span>
             <h2 className="text-3xl font-black text-gray-900 tracking-tight">Define the Word</h2>
          </div>
          <div className="px-5 py-2 bg-green-500 text-white rounded-2xl text-xl font-black shadow-lg">
             {score}
          </div>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden p-1 shadow-inner">
          <div className="h-full bg-indigo-600 transition-all duration-700 ease-out rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-12 bg-indigo-800 text-white relative">
          <h3 className="text-5xl font-black mb-4 capitalize tracking-tighter leading-none">{curQ.word}</h3>
          <p className="text-indigo-100 text-2xl font-medium leading-relaxed max-w-xl">{curQ.question}</p>
        </div>

        <div className="p-10 md:p-14 grid grid-cols-1 md:grid-cols-2 gap-5">
          {curQ.options.map((opt, idx) => (
            <button key={idx} onClick={() => handleSelectAnswer(idx)} disabled={isAnswered} className={`w-full text-left p-6 rounded-3xl border-2 font-bold transition-all flex items-center gap-5 ${isAnswered ? (idx === curQ.correctAnswerIndex ? 'bg-green-50 border-green-500 text-green-700' : (idx === selectedOption ? 'bg-red-50 border-red-500 text-red-700' : 'opacity-20')) : 'border-gray-100 hover:border-indigo-400 hover:bg-indigo-50/20 active:scale-95'}`}>
              <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black border-2 ${isAnswered && idx === curQ.correctAnswerIndex ? 'bg-green-500 text-white border-green-500' : 'border-gray-100 text-gray-300'}`}>{String.fromCharCode(65 + idx)}</span>
              <span className="flex-1 text-lg leading-tight">{opt}</span>
            </button>
          ))}
        </div>

        {isAnswered && (
          <div className="px-10 md:px-14 py-10 bg-gray-50 border-t border-gray-100">
             <p className="text-gray-600 text-lg leading-relaxed font-medium"><strong>Context:</strong> {curQ.explanation}</p>
             <button onClick={nextQuestion} className="mt-8 w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-lg">Next Question</button>
          </div>
        )}
      </div>
    </div>
  );
};

const VocabularyView = ({ words, onUpdateProgress, onDeleteWord }: any) => {
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizWords, setQuizWords] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const due = words.filter((w: any) => w.nextReview <= Date.now());

  if (isQuizMode) {
    if (currentIdx >= quizWords.length) return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center bg-white rounded-[3rem] shadow-2xl flex flex-col items-center">
        <Trophy className="text-yellow-500 w-24 h-24 mb-8" />
        <h2 className="text-5xl font-black mb-4 tracking-tight leading-none text-gray-900">Session Complete</h2>
        <button onClick={() => setIsQuizMode(false)} className="px-16 py-6 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-xl">Back to Dictionary</button>
      </div>
    );
    const card = quizWords[currentIdx];
    return (
      <div className="max-w-xl mx-auto py-12 px-4 flex flex-col gap-10">
        <div className="aspect-[4/3] bg-white rounded-[3.5rem] shadow-2xl flex flex-col items-center justify-center p-12 cursor-pointer border-4 border-gray-50 hover:border-indigo-100 transition-all" onClick={() => setShowBack(!showBack)}>
          <h3 className="text-6xl font-black text-center leading-[1.1] tracking-tighter text-gray-900">{showBack ? card.word : card.translation}</h3>
          <p className="mt-12 text-indigo-600 font-black uppercase text-[10px] tracking-widest">{showBack ? card.definition : 'Tap to Flip'}</p>
        </div>
        {showBack && (
          <div className="flex gap-6">
            <button onClick={() => { onUpdateProgress(card.id, false); setCurrentIdx(i => i + 1); setShowBack(false); }} className="flex-1 py-8 bg-red-50 text-red-600 rounded-3xl font-black shadow-lg">FORGOT</button>
            <button onClick={() => { onUpdateProgress(card.id, true); setCurrentIdx(i => i + 1); setShowBack(false); }} className="flex-1 py-8 bg-green-50 text-green-600 rounded-3xl font-black shadow-lg">EASY</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="bg-indigo-800 p-12 md:p-16 rounded-[4rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-5 text-center md:text-left">
          <h2 className="text-5xl font-black tracking-tighter leading-none">My Dictionary</h2>
          <p className="text-indigo-100 font-bold text-xl">{due.length} words due for review.</p>
        </div>
        <button onClick={() => { setQuizWords([...words].sort(() => 0.5 - Math.random())); setIsQuizMode(true); }} disabled={words.length === 0} className="relative z-10 px-12 py-6 bg-white text-indigo-700 rounded-3xl font-black text-xl shadow-2xl disabled:opacity-50">START REVIEW</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {words.length === 0 ? (
          <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-gray-100 text-gray-300 text-2xl font-black">Your Dictionary is Empty</div>
        ) : (
          words.map((w: any) => (
            <div key={w.id} className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative group hover:shadow-2xl transition-all flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <h4 className="font-black text-3xl text-gray-900 capitalize leading-none tracking-tighter">{w.word}</h4>
                <div className="flex gap-2">
                   <button onClick={() => onDeleteWord(w.id)} className="text-gray-200 group-hover:text-red-500 transition-all p-2"><X size={18} /></button>
                </div>
              </div>
              <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 mb-6 mt-auto">
                 <p className="text-indigo-800 font-black text-2xl tracking-tight">{w.translation}</p>
              </div>
              <div className="space-y-3">
                <p className="text-xs text-gray-500 font-bold italic line-clamp-2">"{w.definition}"</p>
                {w.synonyms && w.synonyms.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {w.synonyms.slice(0, 3).map((s: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-50 text-[9px] font-black text-gray-400 border border-gray-100 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);