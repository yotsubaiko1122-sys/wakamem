/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, RotateCcw, Check, X, BookOpen, GraduationCap, Settings2 } from 'lucide-react';
import { POEMS, Poem } from './poems';

type LearningMode = 'kaminoku_to_shimonoku' | 'modern_to_waka' | 'kimariji_to_full';

interface HistoryRecord {
  poemId: string;
  status: 'know' | 'dont_know';
  timestamp: number;
}

export default function App() {
  const [view, setView] = useState<'menu' | 'flashcard' | 'history_view' | 'result'>('menu');
  const [selectedRange, setSelectedRange] = useState<[number, number]>([1, 5]);
  const [mode, setMode] = useState<LearningMode>('modern_to_waka');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [sessionDontKnowIds, setSessionDontKnowIds] = useState<string[]>([]);
  const [customActivePoemIds, setCustomActivePoemIds] = useState<string[] | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('hyakunin_isshu_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('hyakunin_isshu_history', JSON.stringify(history));
  }, [history]);

  const currentPoems = useMemo(() => {
    if (customActivePoemIds) {
      // Maintain the order of IDs if possible, or just filter
      return POEMS.filter(p => customActivePoemIds.includes(p.id));
    }
    return POEMS.filter((_, i) => (i + 1) >= selectedRange[0] && (i + 1) <= selectedRange[1]);
  }, [selectedRange, customActivePoemIds]);

  const currentPoem = currentPoems[currentIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    const status = direction === 'right' ? 'know' : 'dont_know';
    const newRecord: HistoryRecord = {
      poemId: currentPoem.id,
      status,
      timestamp: Date.now(),
    };
    setHistory(prev => [...prev, newRecord]);

    if (status === 'dont_know') {
      setSessionDontKnowIds(prev => Array.from(new Set([...prev, currentPoem.id])));
    }

    if (currentIndex < currentPoems.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      // End of range
      setView('result');
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  };

  const ranges = useMemo(() => {
    const r = [];
    for (let i = 1; i <= POEMS.length; i += 5) {
      r.push([i, Math.min(i + 4, POEMS.length)] as [number, number]);
    }
    return r;
  }, []);

  const getStats = (range: [number, number]) => {
    const rangePoemIds = POEMS.slice(range[0] - 1, range[1]).map(p => p.id);
    const rangeHistory = history.filter(h => rangePoemIds.includes(h.poemId));
    
    // Get latest status for each poem in range
    const latestStatus: Record<string, 'know' | 'dont_know'> = {};
    rangeHistory.forEach(h => {
      latestStatus[h.poemId] = h.status;
    });

    const knownCount = Object.values(latestStatus).filter(s => s === 'know').length;
    return { knownCount, total: rangePoemIds.length };
  };

  const getPoemStats = (poemId: string) => {
    const poemHistory = history.filter(h => h.poemId === poemId);
    const knowCount = poemHistory.filter(h => h.status === 'know').length;
    const dontKnowCount = poemHistory.filter(h => h.status === 'dont_know').length;
    const total = knowCount + dontKnowCount;
    const percentage = total > 0 ? Math.round((knowCount / total) * 100) : null;
    return { knowCount, dontKnowCount, total, percentage };
  };

  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] p-6 font-sans">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-serif font-bold mb-2 tracking-tight leading-tight">
            百人一首を<br />
            <span className="text-red-600">完全暗記</span>する
          </h1>
          <p className="text-sm text-stone-500 uppercase tracking-widest">フラッシュカード</p>
        </header>

        <section className="max-w-md mx-auto space-y-8">
          <div className="flex gap-3">
            <button
              onClick={() => setView('history_view')}
              className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-stone-200 hover:border-[#5A5A40] transition-all flex items-center justify-center gap-2 font-bold text-stone-600"
            >
              <RotateCcw size={18} className="rotate-180" />
              学習履歴を確認
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
            <div className="flex items-center gap-2 mb-4 text-stone-600">
              <Settings2 size={18} />
              <h2 className="text-sm font-bold uppercase tracking-wider">学習モード</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setMode('kaminoku_to_shimonoku')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  mode === 'kaminoku_to_shimonoku' 
                    ? 'border-[#5A5A40] bg-[#5A5A40]/5 text-[#5A5A40]' 
                    : 'border-stone-100 hover:border-stone-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={20} />
                  <span className="font-medium">上の句 → 下の句</span>
                </div>
                {mode === 'kaminoku_to_shimonoku' && <Check size={18} />}
              </button>
              <button
                onClick={() => setMode('modern_to_waka')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  mode === 'modern_to_waka' 
                    ? 'border-[#5A5A40] bg-[#5A5A40]/5 text-[#5A5A40]' 
                    : 'border-stone-100 hover:border-stone-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={20} />
                  <span className="font-medium">現代語訳 → 和歌</span>
                </div>
                {mode === 'modern_to_waka' && <Check size={18} />}
              </button>
              <button
                onClick={() => setMode('kimariji_to_full')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  mode === 'kimariji_to_full' 
                    ? 'border-[#5A5A40] bg-[#5A5A40]/5 text-[#5A5A40]' 
                    : 'border-stone-100 hover:border-stone-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GraduationCap size={20} />
                  <span className="font-medium">決まり字 → 全文</span>
                </div>
                {mode === 'kimariji_to_full' && <Check size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2 text-stone-600">
              <h2 className="text-sm font-bold uppercase tracking-wider">範囲を選択</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {ranges.map((range, idx) => {
                const stats = getStats(range);
                const isCompleted = stats.knownCount === stats.total;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedRange(range);
                      setCustomActivePoemIds(null);
                      setSessionDontKnowIds([]);
                      setView('flashcard');
                      setCurrentIndex(0);
                    }}
                    className="group relative bg-white p-5 rounded-3xl shadow-sm border border-stone-200 hover:border-[#5A5A40] hover:shadow-md transition-all text-left"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-mono text-stone-400 block mb-1">範囲 {String(idx + 1).padStart(2, '0')}</span>
                        <span className="text-lg font-serif font-bold">{range[0]} 〜 {range[1]}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-stone-500 mb-1">
                          {stats.knownCount} / {stats.total}
                        </div>
                        <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-[#5A5A40]'}`}
                            style={{ width: `${(stats.knownCount / stats.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button 
            onClick={() => {
              if (confirm('学習履歴をリセットしますか？')) {
                setHistory([]);
                localStorage.removeItem('hyakunin_isshu_history');
              }
            }}
            className="w-full py-4 text-stone-400 text-sm font-medium hover:text-red-500 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} />
            学習履歴をリセット
          </button>
        </section>
      </div>
    );
  }

  if (view === 'result') {
    const correctCount = currentPoems.length - sessionDontKnowIds.length;
    return (
      <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] p-6 flex flex-col items-center justify-center font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-xl border border-stone-200 text-center space-y-8"
        >
          <div>
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-3xl font-serif font-bold mb-2">学習完了</h2>
            <p className="text-stone-500">今回の学習結果です</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
              <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">わかる</span>
              <span className="text-2xl font-mono font-bold text-emerald-500">{correctCount}</span>
            </div>
            <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
              <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">わからない</span>
              <span className="text-2xl font-mono font-bold text-red-400">{sessionDontKnowIds.length}</span>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            {sessionDontKnowIds.length > 0 && (
              <button
                onClick={() => {
                  setCustomActivePoemIds(sessionDontKnowIds);
                  setSessionDontKnowIds([]);
                  setCurrentIndex(0);
                  setView('flashcard');
                }}
                className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-bold shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                「わからない」を復習する
              </button>
            )}
            <button
              onClick={() => {
                setCustomActivePoemIds(null);
                setSessionDontKnowIds([]);
                setCurrentIndex(0);
                setView('flashcard');
              }}
              className="w-full py-4 bg-white text-stone-600 border border-stone-200 rounded-2xl font-bold hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              同じ範囲をもう一度学習する
            </button>
            <button
              onClick={() => {
                setCustomActivePoemIds(null);
                setSessionDontKnowIds([]);
                setView('menu');
              }}
              className="w-full py-4 bg-white text-stone-600 border border-stone-200 rounded-2xl font-bold hover:bg-stone-50 transition-all"
            >
              メニューに戻る
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === 'history_view') {
    return (
      <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] p-6 font-sans">
        <header className="mb-8 flex items-center gap-4">
          <button 
            onClick={() => setView('menu')}
            className="p-2 hover:bg-stone-200 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-serif font-bold">学習履歴一覧</h1>
        </header>

        <div className="max-w-2xl mx-auto space-y-4">
          {POEMS.map((poem) => {
            const stats = getPoemStats(poem.id);
            return (
              <div key={poem.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-4">
                <div className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center text-xs font-mono text-stone-400 border border-stone-100 shrink-0">
                  {poem.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-serif font-bold text-sm truncate">{poem.author}</h3>
                    {stats.percentage !== null && (
                      <span className={`text-xs font-mono font-bold ${stats.percentage >= 80 ? 'text-emerald-500' : stats.percentage >= 50 ? 'text-amber-500' : 'text-red-400'}`}>
                        {stats.percentage}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 truncate mb-2">{poem.original}</p>
                  <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    <span className="flex items-center gap-1"><Check size={10} className="text-emerald-500" /> {stats.knowCount}</span>
                    <span className="flex items-center gap-1"><X size={10} className="text-red-400" /> {stats.dontKnowCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED] flex flex-col font-sans overflow-hidden touch-none">
      <header className="p-6 flex items-center justify-between">
        <button 
          onClick={() => setView('menu')}
          className="p-2 hover:bg-stone-200 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <span className="text-xs font-mono text-stone-400 block uppercase tracking-tighter">進捗</span>
          <span className="text-sm font-bold">{currentIndex + 1} / {currentPoems.length}</span>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPoem.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100) handleSwipe('right');
              else if (info.offset.x < -100) handleSwipe('left');
            }}
            className="w-full max-w-sm aspect-[3/4] relative cursor-pointer perspective-1000"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <motion.div
              className="w-full h-full relative preserve-3d"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* Front Side */}
              <div className="absolute inset-0 backface-hidden bg-white rounded-[2rem] shadow-xl border border-stone-200 p-8 flex flex-col items-center justify-center text-center overflow-hidden select-none">
                <span className="absolute top-8 left-8 text-xs font-mono text-stone-300">#{currentPoem.id}</span>
                {(() => {
                  const stats = getPoemStats(currentPoem.id);
                  return stats.percentage !== null && (
                    <div className="absolute top-8 right-8 text-right">
                      <span className="text-[10px] font-bold text-stone-400 uppercase block">正解率</span>
                      <span className={`text-sm font-mono font-bold ${stats.percentage >= 80 ? 'text-emerald-500' : stats.percentage >= 50 ? 'text-amber-500' : 'text-red-400'}`}>
                        {stats.percentage}%
                      </span>
                    </div>
                  );
                })()}
                <div className="space-y-6 w-full">
                  {mode === 'kaminoku_to_shimonoku' ? (
                    <p className="text-2xl font-serif font-bold text-stone-800 leading-relaxed">
                      {currentPoem.original.split(' ').slice(0, 3).join(' ')}
                    </p>
                  ) : mode === 'modern_to_waka' ? (
                    <p className="text-xl font-serif leading-relaxed text-stone-800">
                      {currentPoem.modern}
                    </p>
                  ) : (
                    <p className="text-3xl font-serif font-bold text-[#5A5A40] tracking-widest">
                      {currentPoem.kimariji}
                    </p>
                  )}
                  <p className="text-xs text-stone-400 uppercase tracking-widest mt-4">タップで裏返す</p>
                </div>
              </div>

              {/* Back Side */}
              <div 
                className="absolute inset-0 backface-hidden bg-white rounded-[2rem] shadow-xl border border-stone-200 p-8 flex flex-col items-center justify-start text-center overflow-y-auto"
                style={{ transform: 'rotateY(180deg)' }}
              >
                <div className="space-y-6 w-full my-auto py-4">
                  <div>
                    <p className="text-sm font-bold text-[#5A5A40] mb-4 uppercase tracking-widest border-b border-stone-100 pb-2 inline-block">
                      {currentPoem.author}
                    </p>
                    {mode === 'kaminoku_to_shimonoku' ? (
                      <div className="space-y-4">
                        <p className="text-2xl font-serif font-bold leading-relaxed text-stone-900 break-keep">
                          {currentPoem.original.split(' ').slice(3).join(' ')}
                        </p>
                        <div className="pt-4 border-t border-stone-50">
                          <p className="text-xs text-stone-400 mb-1 uppercase tracking-widest">現代語訳</p>
                          <p className="text-sm font-serif text-stone-500 leading-relaxed">
                            {currentPoem.modern}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-2xl font-serif font-bold leading-relaxed text-stone-900 break-keep">
                        {currentPoem.original}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-stone-400 font-serif italic leading-relaxed">
                    {currentPoem.reading}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Swipe Indicators */}
            <div className="absolute -bottom-20 left-0 right-0 flex justify-between px-4 opacity-50">
              <div className="flex flex-col items-center gap-2 text-red-400">
                <div className="w-12 h-12 rounded-full border-2 border-red-400 flex items-center justify-center">
                  <X size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">わからない</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-emerald-500">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                  <Check size={24} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">わかる</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="p-10 text-center">
        <p className="text-xs text-stone-400 font-medium uppercase tracking-[0.2em]">
          左右にスワイプして仕分け
        </p>
      </footer>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  );
}
