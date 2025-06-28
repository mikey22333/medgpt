"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type Citation } from "@/lib/types/chat";
import { BookOpen, RotateCcw, Check, X, Brain, Star, ArrowRight } from "lucide-react";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  citation?: Citation;
  attempts: number;
  correct: number;
  lastReviewed?: Date;
  nextReview?: Date;
}

interface FlashcardModeProps {
  onClose: () => void;
  initialTopic?: string;
}

export function FlashcardMode({ onClose, initialTopic }: FlashcardModeProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [mode, setMode] = useState<'study' | 'quiz'>('study');
  const [stats, setStats] = useState({
    totalCards: 0,
    studiedToday: 0,
    accuracy: 0,
    streak: 0
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate flashcards based on topic
  const generateFlashcards = async (topic: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count: 10 })
      });

      if (response.ok) {
        const data = await response.json();
        setFlashcards(data.flashcards);
        if (data.flashcards.length > 0) {
          setCurrentCard(data.flashcards[0]);
        }
      }
    } catch (error) {
      console.error('Failed to generate flashcards:', error);
      // Fallback to sample flashcards
      generateSampleFlashcards(topic);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate sample flashcards as fallback
  const generateSampleFlashcards = (topic: string) => {
    const sampleCards: Flashcard[] = [
      {
        id: '1',
        question: 'What is the mechanism of action of ACE inhibitors?',
        answer: 'ACE inhibitors block the conversion of angiotensin I to angiotensin II by inhibiting the angiotensin-converting enzyme, leading to vasodilation and reduced blood pressure.',
        topic: 'Cardiology',
        difficulty: 'Medium',
        attempts: 0,
        correct: 0
      },
      {
        id: '2',
        question: 'What are the major contraindications for warfarin therapy?',
        answer: 'Major contraindications include active bleeding, severe liver disease, pregnancy, recent CNS surgery, and patients with high bleeding risk who cannot be adequately monitored.',
        topic: 'Pharmacology',
        difficulty: 'Hard',
        attempts: 0,
        correct: 0
      },
      {
        id: '3',
        question: 'What is the normal range for serum creatinine in adults?',
        answer: 'Normal serum creatinine ranges: Males 0.7-1.3 mg/dL (62-115 μmol/L), Females 0.6-1.1 mg/dL (53-97 μmol/L)',
        topic: 'Laboratory Values',
        difficulty: 'Easy',
        attempts: 0,
        correct: 0
      }
    ];

    setFlashcards(sampleCards);
    setCurrentCard(sampleCards[0]);
  };

  useEffect(() => {
    if (initialTopic) {
      generateFlashcards(initialTopic);
    } else {
      generateSampleFlashcards('General Medicine');
    }
  }, [initialTopic]);

  const handleAnswer = (isCorrect: boolean) => {
    if (!currentCard) return;

    const updatedCard = {
      ...currentCard,
      attempts: currentCard.attempts + 1,
      correct: currentCard.correct + (isCorrect ? 1 : 0),
      lastReviewed: new Date(),
      nextReview: new Date(Date.now() + (isCorrect ? 3 : 1) * 24 * 60 * 60 * 1000) // Spaced repetition
    };

    setFlashcards(prev => prev.map(card => 
      card.id === currentCard.id ? updatedCard : card
    ));

    // Move to next card
    setTimeout(() => {
      const currentIndex = flashcards.findIndex(card => card.id === currentCard.id);
      const nextIndex = (currentIndex + 1) % flashcards.length;
      setCurrentCard(flashcards[nextIndex]);
      setShowAnswer(false);
      setUserAnswer("");
    }, 1500);
  };

  const flipCard = () => {
    setShowAnswer(!showAnswer);
  };

  const nextCard = () => {
    const currentIndex = flashcards.findIndex(card => card.id === currentCard?.id);
    const nextIndex = (currentIndex + 1) % flashcards.length;
    setCurrentCard(flashcards[nextIndex]);
    setShowAnswer(false);
    setUserAnswer("");
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <h2 className="text-xl font-bold">Flashcard Study Mode</h2>
            </div>
            <Button variant="outline" onClick={onClose} size="sm">
              Close
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{flashcards.length}</div>
              <div className="text-xs text-muted-foreground">Total Cards</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.studiedToday}</div>
              <div className="text-xs text-muted-foreground">Studied Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.accuracy}%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.streak}</div>
              <div className="text-xs text-muted-foreground">Streak</div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={mode === 'study' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('study')}
            >
              <Brain className="h-4 w-4 mr-2" />
              Study Mode
            </Button>
            <Button
              variant={mode === 'quiz' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('quiz')}
            >
              <Star className="h-4 w-4 mr-2" />
              Quiz Mode
            </Button>
          </div>

          {isGenerating ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Generating flashcards...</p>
            </div>
          ) : currentCard ? (
            <div className="space-y-4">
              {/* Current Card */}
              <Card className="p-6 min-h-[300px] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentCard.difficulty)}`}>
                    {currentCard.difficulty}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {currentCard.topic}
                  </span>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">
                    {showAnswer ? 'Answer' : 'Question'}
                  </h3>
                  
                  <div className="text-base leading-relaxed mb-6 min-h-[100px] flex items-center justify-center">
                    {showAnswer ? currentCard.answer : currentCard.question}
                  </div>

                  {mode === 'quiz' && !showAnswer && (
                    <div className="mb-4">
                      <Input
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-center gap-2">
                {!showAnswer ? (
                  <Button onClick={flipCard} className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Show Answer
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleAnswer(false)}
                      className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                      Incorrect
                    </Button>
                    <Button
                      onClick={() => handleAnswer(true)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                      Correct
                    </Button>
                  </div>
                )}
                
                <Button variant="outline" onClick={nextCard}>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{flashcards.findIndex(card => card.id === currentCard.id) + 1} / {flashcards.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((flashcards.findIndex(card => card.id === currentCard.id) + 1) / flashcards.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Card Stats */}
              {currentCard.attempts > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  Accuracy: {Math.round((currentCard.correct / currentCard.attempts) * 100)}% 
                  ({currentCard.correct}/{currentCard.attempts})
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p>No flashcards available. Try generating some based on a medical topic.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
