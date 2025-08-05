import { NextRequest, NextResponse } from "next/server";

interface FlashcardRequest {
  topic: string;
  count: number;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  attempts: number;
  correct: number;
}

export async function POST(request: NextRequest) {
  try {
    const { topic, count = 10 }: FlashcardRequest = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    // Generate flashcards using AI
    const flashcards = await generateFlashcardsWithAI(topic, count);

    return NextResponse.json({
      flashcards,
      topic,
      count: flashcards.length
    });

  } catch (error) {
    console.error("Error generating flashcards:", error);
    return NextResponse.json(
      { error: "Failed to generate flashcards" },
      { status: 500 }
    );
  }
}

async function generateFlashcardsWithAI(topic: string, count: number): Promise<Flashcard[]> {
  const prompt = `Generate ${count} medical flashcards for the topic "${topic}". 
  
  Create questions that test understanding of:
  - Key concepts and definitions
  - Clinical applications
  - Diagnostic criteria
  - Treatment protocols
  - Pharmacology mechanisms
  - Laboratory values and interpretations
  
  Vary the difficulty levels (Easy, Medium, Hard) and make questions clinically relevant.
  
  Return a JSON array of flashcards with this exact structure:
  [
    {
      "id": "unique_id",
      "question": "Clear, specific medical question",
      "answer": "Comprehensive but concise answer",
      "topic": "${topic}",
      "difficulty": "Easy|Medium|Hard",
      "attempts": 0,
      "correct": 0
    }
  ]
  
  Make sure answers are accurate and evidence-based. Include specific values, ranges, or criteria where applicable.`;

  try {
    // Try to use Together AI or Ollama for generation
    const response = await fetch(`${process.env.TOGETHER_BASE_URL || 'https://api.together.xyz'}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.TOGETHER_API_KEY && { 'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}` })
      },
      body: JSON.stringify({
        model: process.env.TOGETHER_MODEL || 'llama3.1:8b',
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2000,
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.response || data.choices?.[0]?.message?.content || '';
      
      // Extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const flashcards = JSON.parse(jsonMatch[0]);
        return flashcards.map((card: any, index: number) => ({
          ...card,
          id: card.id || `${Date.now()}_${index}`,
          attempts: 0,
          correct: 0
        }));
      }
    }
  } catch (error) {
    console.error("AI generation failed, using fallback:", error);
  }

  // Fallback to predefined flashcards based on topic
  return generateFallbackFlashcards(topic, count);
}

function generateFallbackFlashcards(topic: string, count: number): Flashcard[] {
  const fallbackTemplates: { [key: string]: Flashcard[] } = {
    cardiology: [
      {
        id: '1',
        question: 'What is the mechanism of action of ACE inhibitors?',
        answer: 'ACE inhibitors block the conversion of angiotensin I to angiotensin II by inhibiting the angiotensin-converting enzyme, leading to vasodilation, reduced aldosterone secretion, and decreased blood pressure.',
        topic: 'Cardiology',
        difficulty: 'Medium',
        attempts: 0,
        correct: 0
      },
      {
        id: '2',
        question: 'What are the classic ECG findings in acute MI?',
        answer: 'ST-segment elevation, T-wave inversion, and Q-wave development. STEMI shows ST elevation >1mm in limb leads or >2mm in precordial leads in contiguous leads.',
        topic: 'Cardiology',
        difficulty: 'Hard',
        attempts: 0,
        correct: 0
      },
      {
        id: '3',
        question: 'What is the normal ejection fraction range?',
        answer: 'Normal ejection fraction is 55-70%. Reduced EF is <40%, borderline is 40-49%, and preserved is ≥50%.',
        topic: 'Cardiology',
        difficulty: 'Easy',
        attempts: 0,
        correct: 0
      }
    ],
    pharmacology: [
      {
        id: '1',
        question: 'What are the major contraindications for warfarin?',
        answer: 'Active bleeding, severe liver disease, pregnancy, recent CNS surgery, severe hypertension, and inability to monitor INR regularly.',
        topic: 'Pharmacology',
        difficulty: 'Medium',
        attempts: 0,
        correct: 0
      },
      {
        id: '2',
        question: 'What is the target INR for atrial fibrillation on warfarin?',
        answer: 'Target INR is 2.0-3.0 for most patients with atrial fibrillation. Higher targets (2.5-3.5) may be used for mechanical heart valves.',
        topic: 'Pharmacology',
        difficulty: 'Easy',
        attempts: 0,
        correct: 0
      }
    ],
    general: [
      {
        id: '1',
        question: 'What are the normal ranges for basic metabolic panel?',
        answer: 'Sodium: 136-145 mEq/L, Potassium: 3.5-5.0 mEq/L, Chloride: 98-107 mEq/L, CO2: 22-29 mEq/L, BUN: 7-20 mg/dL, Creatinine: 0.6-1.3 mg/dL, Glucose: 70-100 mg/dL.',
        topic: 'Laboratory Values',
        difficulty: 'Medium',
        attempts: 0,
        correct: 0
      }
    ]
  };

  const topicKey = topic.toLowerCase().includes('cardio') ? 'cardiology' :
                   topic.toLowerCase().includes('pharmaco') ? 'pharmacology' : 'general';
  
  const templates = fallbackTemplates[topicKey] || fallbackTemplates.general;
  
  return templates.slice(0, Math.min(count, templates.length)).map((card, index) => ({
    ...card,
    id: `${Date.now()}_${index}`,
    topic: topic
  }));
}
