import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BookText, Brain, Layers, Save, Check, X, Code, Lightbulb, Eye } from "lucide-react";
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

interface CodingExercise {
  title: string;
  difficulty: string;
  description: string;
  starterCode: string;
  solution: string;
  hints: string[];
}

interface ResultsSectionProps {
  topics: string[];
  notes: string;
  quiz: Quiz[];
  flashcards: Flashcard[];
  codingExercises?: CodingExercise[];
  onSave: () => void;
  saving: boolean;
}

export const ResultsSection = ({
  topics,
  notes,
  quiz,
  flashcards,
  codingExercises = [],
  onSave,
  saving,
}: ResultsSectionProps) => {
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: string }>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userCode, setUserCode] = useState<{ [key: number]: string }>({});
  const [showHints, setShowHints] = useState<{ [key: number]: boolean }>({});
  const [showSolution, setShowSolution] = useState<{ [key: number]: boolean }>({});

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
        <TabsList className={`grid w-full ${codingExercises.length > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
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
          {codingExercises.length > 0 && (
            <TabsTrigger value="coding">
              <Code className="w-4 h-4 mr-2" />
              Coding
            </TabsTrigger>
          )}
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
                className="relative min-h-[300px] cursor-pointer"
                onClick={() => setShowAnswer(!showAnswer)}
              >
                {!showAnswer ? (
                  <div className="h-[300px] flex items-center justify-center p-8 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border-2 border-primary animate-fade-in">
                    <div className="w-full overflow-y-auto max-h-[250px]">
                      <p className="text-xl text-center font-medium break-words">
                        {flashcards[currentFlashcard]?.question}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center p-8 bg-gradient-to-br from-accent/10 to-primary/10 rounded-lg border-2 border-accent animate-fade-in">
                    <div className="w-full overflow-y-auto max-h-[250px]">
                      <p className="text-lg text-center break-words">
                        {flashcards[currentFlashcard]?.answer}
                      </p>
                    </div>
                  </div>
                )}
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

        {codingExercises.length > 0 && (
          <TabsContent value="coding">
            <Card>
              <CardHeader>
                <CardTitle>Coding Practice</CardTitle>
                <CardDescription>
                  Exercise {currentExercise + 1} of {codingExercises.length}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {codingExercises[currentExercise] && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          {codingExercises[currentExercise].title}
                        </h3>
                        <Badge 
                          variant={
                            codingExercises[currentExercise].difficulty === 'easy' 
                              ? 'default' 
                              : codingExercises[currentExercise].difficulty === 'medium'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {codingExercises[currentExercise].difficulty}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {codingExercises[currentExercise].description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Code</label>
                      <Textarea
                        value={userCode[currentExercise] || codingExercises[currentExercise].starterCode}
                        onChange={(e) => setUserCode({ ...userCode, [currentExercise]: e.target.value })}
                        rows={12}
                        className="font-mono text-sm"
                        placeholder="Write your code here..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowHints({ ...showHints, [currentExercise]: !showHints[currentExercise] })}
                      >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        {showHints[currentExercise] ? 'Hide Hints' : 'Show Hints'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowSolution({ ...showSolution, [currentExercise]: !showSolution[currentExercise] })}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {showSolution[currentExercise] ? 'Hide Solution' : 'Show Solution'}
                      </Button>
                    </div>

                    {showHints[currentExercise] && (
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <p className="font-medium">Hints:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {codingExercises[currentExercise].hints.map((hint, i) => (
                            <li key={i} className="text-sm text-muted-foreground">{hint}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {showSolution[currentExercise] && (
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <p className="font-medium">Solution:</p>
                        <pre className="text-sm font-mono overflow-x-auto p-3 bg-background rounded">
                          {codingExercises[currentExercise].solution}
                        </pre>
                      </div>
                    )}

                    <div className="flex gap-2 justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentExercise(Math.max(0, currentExercise - 1))}
                        disabled={currentExercise === 0}
                      >
                        Previous Exercise
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentExercise(Math.min(codingExercises.length - 1, currentExercise + 1))}
                        disabled={currentExercise === codingExercises.length - 1}
                      >
                        Next Exercise
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};