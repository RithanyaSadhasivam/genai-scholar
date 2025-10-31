import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { Header } from "@/components/Header";
import { UploadSection } from "@/components/UploadSection";
import { ResultsSection } from "@/components/ResultsSection";
import { SavedMaterials } from "@/components/SavedMaterials";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Library } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  
  const [topics, setTopics] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [quiz, setQuiz] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentMaterialId, setCurrentMaterialId] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleContentSubmit = async (content: string, title: string) => {
    setLoading(true);
    try {
      // Save material to database
      const { data: materialData, error: materialError } = await supabase
        .from("study_materials")
        .insert({
          user_id: user.id,
          title,
          content,
          file_type: "text",
        })
        .select()
        .single();

      if (materialError) throw materialError;
      setCurrentMaterialId(materialData.id);

      // Generate topics
      const topicsResponse = await supabase.functions.invoke("generate-study-content", {
        body: { content, type: "topics" },
      });
      if (topicsResponse.error) throw topicsResponse.error;
      const generatedTopics = topicsResponse.data.result;
      setTopics(generatedTopics);

      // Generate notes
      const notesResponse = await supabase.functions.invoke("generate-study-content", {
        body: { content, type: "notes" },
      });
      if (notesResponse.error) throw notesResponse.error;
      setNotes(notesResponse.data.result);

      // Generate quiz
      const quizResponse = await supabase.functions.invoke("generate-study-content", {
        body: { content, type: "quiz" },
      });
      if (quizResponse.error) throw quizResponse.error;
      setQuiz(quizResponse.data.result);

      // Generate flashcards
      const flashcardsResponse = await supabase.functions.invoke("generate-study-content", {
        body: { content, type: "flashcards" },
      });
      if (flashcardsResponse.error) throw flashcardsResponse.error;
      setFlashcards(flashcardsResponse.data.result);

      toast({
        title: "Success!",
        description: "Study materials generated successfully.",
      });

      setActiveTab("results");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate study materials.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentMaterialId) return;
    
    setSaving(true);
    try {
      // Save generated content to database
      const contentTypes = [
        { type: "notes", content: { notes } },
        { type: "quiz", content: { quiz } },
        { type: "flashcards", content: { flashcards } },
      ];

      for (const item of contentTypes) {
        await supabase.from("generated_content").insert({
          material_id: currentMaterialId,
          user_id: user.id,
          content_type: item.type,
          content: item.content,
          topics,
        });
      }

      toast({
        title: "Saved!",
        description: "All study materials have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleViewMaterial = async (materialId: string) => {
    try {
      // Fetch the material and its generated content
      const { data: contentData, error } = await supabase
        .from("generated_content")
        .select("*")
        .eq("material_id", materialId);

      if (error) throw error;

      // Organize the content by type
      contentData.forEach((item) => {
        if (item.content_type === "notes") {
          const content = item.content as { notes: string };
          setNotes(content.notes);
          setTopics(item.topics || []);
        } else if (item.content_type === "quiz") {
          const content = item.content as { quiz: any[] };
          setQuiz(content.quiz);
        } else if (item.content_type === "flashcards") {
          const content = item.content as { flashcards: any[] };
          setFlashcards(content.flashcards);
        }
      });

      setCurrentMaterialId(materialId);
      setActiveTab("results");
    } catch (error: any) {
      toast({
        title: "Error loading material",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Header />
      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              Create New
            </TabsTrigger>
            <TabsTrigger value="library">
              <Library className="w-4 h-4 mr-2" />
              My Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <UploadSection onContentSubmit={handleContentSubmit} loading={loading} />
          </TabsContent>

          <TabsContent value="library">
            <SavedMaterials onViewMaterial={handleViewMaterial} />
          </TabsContent>

          <TabsContent value="results">
            {(topics.length > 0 || notes || quiz.length > 0 || flashcards.length > 0) && (
              <ResultsSection
                topics={topics}
                notes={notes}
                quiz={quiz}
                flashcards={flashcards}
                onSave={handleSave}
                saving={saving}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;