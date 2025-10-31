import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookText, Brain, Layers, Save, Check, X } from "lucide-react";
import { useState } from "react";

interface Quiz {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Flashcard {
  question: string;
  answer: string;
}

interface ResultsSectionProps {
  topics: string[];
  notes: string;
  quiz: Quiz[];
  flashcards: Flashcard[];
  onSave: () => void;
  saving: boolean;
}

export const ResultsSection = ({
  topics,
  notes,
  quiz,
  flashcards,
  onSave,
  saving,
}: ResultsSectionProps) => {
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: string }>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const handleQuizAnswer = (questionIndex: number, answer: string) => {
    setQuizAnswers({ ...quizAnswers, [questionIndex]: answer });
  };

  const checkQuizAnswers = () => {
    setShowQuizResults(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Generated Study Materials</h2>
        <Button onClick={onSave} disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      {topics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Key Topics
            </CardTitle>
            <CardDescription>Main concepts identified from your material</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic, index) => (
                <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="notes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notes">
            <BookText className="w-4 h-4 mr-2" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="quiz">
            <Brain className="w-4 h-4 mr-2" />
            Quiz
          </TabsTrigger>
          <TabsTrigger value="flashcards">
            <Layers className="w-4 h-4 mr-2" />
            Flashcards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Study Notes</CardTitle>
              <CardDescription>Comprehensive summary of your material</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                {notes}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz">
          <Card>
            <CardHeader>
              <CardTitle>Practice Quiz</CardTitle>
              <CardDescription>Test your understanding with these questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {quiz.map((q, index) => (
                <div key={index} className="space-y-3 p-4 rounded-lg bg-muted/50">
                  <p className="font-semibold">
                    {index + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((option, optIndex) => {
                      const optionLetter = String.fromCharCode(65 + optIndex);
                      const isSelected = quizAnswers[index] === optionLetter;
                      const isCorrect = q.correctAnswer === optionLetter;
                      const showFeedback = showQuizResults && isSelected;

                      return (
                        <Button
                          key={optIndex}
                          variant={isSelected ? "default" : "outline"}
                          className={`w-full justify-start text-left h-auto py-3 ${
                            showFeedback
                              ? isCorrect
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-red-500 hover:bg-red-600"
                              : ""
                          }`}
                          onClick={() => !showQuizResults && handleQuizAnswer(index, optionLetter)}
                          disabled={showQuizResults}
                        >
                          <span className="mr-2 font-semibold">{optionLetter}.</span>
                          {option}
                          {showFeedback && (
                            <span className="ml-auto">
                              {isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                  {showQuizResults && (
                    <div className="mt-2 p-3 bg-primary/10 rounded-md">
                      <p className="text-sm font-medium">Explanation:</p>
                      <p className="text-sm text-muted-foreground">{q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
              {!showQuizResults && (
                <Button onClick={checkQuizAnswers} className="w-full" size="lg">
                  Check Answers
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flashcards">
          <Card>
            <CardHeader>
              <CardTitle>Flashcards</CardTitle>
              <CardDescription>
                Click cards to flip • {currentFlashcard + 1} of {flashcards.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="relative min-h-[300px] cursor-pointer perspective-1000"
                onClick={() => setShowAnswer(!showAnswer)}
              >
                <div
                  className={`absolute inset-0 transition-all duration-500 transform-style-3d ${
                    showAnswer ? "rotate-y-180" : ""
                  }`}
                >
                  <div className="absolute inset-0 backface-hidden">
                    <div className="h-full flex items-center justify-center p-8 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border-2 border-primary">
                      <p className="text-xl text-center font-medium">
                        {flashcards[currentFlashcard]?.question}
                      </p>
                    </div>
                  </div>
                  <div className="absolute inset-0 backface-hidden rotate-y-180">
                    <div className="h-full flex items-center justify-center p-8 bg-gradient-to-br from-accent/10 to-primary/10 rounded-lg border-2 border-accent">
                      <p className="text-lg text-center">
                        {flashcards[currentFlashcard]?.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentFlashcard(Math.max(0, currentFlashcard - 1));
                    setShowAnswer(false);
                  }}
                  disabled={currentFlashcard === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentFlashcard(
                      Math.min(flashcards.length - 1, currentFlashcard + 1)
                    );
                    setShowAnswer(false);
                  }}
                  disabled={currentFlashcard === flashcards.length - 1}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};