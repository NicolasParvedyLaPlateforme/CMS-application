"use client";

import { useState, useMemo, useEffect } from "react";
import { useCourse } from "@/contexts/CourseContext";
import { Copy, AlertCircle, Save, Check, FileText } from "lucide-react";
import { Unit, Lesson } from "@/types/course";

export default function BilanUpdaterTool() {
  const { course, setCourse } = useCourse();
  const [jsonInput, setJsonInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [previewBilans, setPreviewBilans] = useState<any[]>([]);

  // Load units from local storage
  useEffect(() => {
    const saved = localStorage.getItem("th-units-draft");
    if (saved) {
      try {
        setUnits(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse units draft", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const isBilan = (l: Lesson) => {
    return l.isReview || l.title.toLowerCase().includes("bilan") || l.id.toLowerCase().includes("bilan");
  };

  const prompt = useMemo(() => {
    if (!isLoaded) return "";

    const contextData: any[] = [];
    let currentLessons: any[] = [];
    let unitIndex = 0;

    course.lessons.forEach(lesson => {
      if (!isBilan(lesson)) {
        currentLessons.push({ id: lesson.id, title: lesson.title });
      } else {
        contextData.push({
          relatedUnit: units[unitIndex] ? { id: units[unitIndex].id, title: units[unitIndex].title } : null,
          previousLessons: [...currentLessons],
          bilan: {
            id: lesson.id,
            title: lesson.title,
            description: lesson.description || "",
            titleEn: lesson.titleEn || "",
            descriptionEn: lesson.descriptionEn || "",
            imageUrl: lesson.imageUrl || "",
            isReview: true
          }
        });
        currentLessons = [];
        unitIndex++;
      }
    });

    return `Tu es un expert en conception de cours de langue (thaï pour francophones).
L'objectif est d'actualiser les informations de tous les bilans (évaluations) du cours.

Voici la liste des bilans actuels. Pour chacun, tu as les informations de l'unité à laquelle il est rattaché et les titres des leçons qu'il est censé évaluer (les leçons vues juste avant ce bilan) :
${JSON.stringify(contextData, null, 2)}

CONSIGNES IMPORTANTES:
1. Mets à jour UNIQUEMENT les métadonnées des bilans : title, description, titleEn, descriptionEn, isReview (doit être true) et imageUrl.
2. Inspire-toi des leçons précédentes (previousLessons) et de l'unité (relatedUnit) pour rédiger une description accrocheuse.
3. Conserve IMPÉRATIVEMENT les "id" des bilans tels qu'ils sont.
4. Format d'imageUrl attendu : "/images/default-lesson.svg" (ou une variante si pertinente).
5. Tu dois renvoyer UNIQUEMENT un tableau JSON contenant les objets bilans mis à jour.

STRUCTURE JSON ATTENDUE:
[
  {
    "id": "lesson-10",
    "title": "Bilan Unité 1",
    "description": "Révision globale (30 questions)",
    "titleEn": "Unit 1 assessment",
    "descriptionEn": "Global review (30 questions)",
    "isReview": true,
    "imageUrl": "/images/default-lesson.svg"
  }
]`;
  }, [course, units, isLoaded]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleAnalyzeJson = () => {
    if (!jsonInput.trim()) {
      setError("Le champ JSON est vide.");
      return;
    }
    try {
      setError(null);
      let parsed;
      try {
        parsed = JSON.parse(jsonInput);
      } catch (e) {
        const match = jsonInput.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error("Impossible de trouver un JSON array valide.");
        }
      }

      if (!Array.isArray(parsed)) {
        throw new Error("Structure JSON invalide : doit être un tableau d'objets bilans.");
      }

      setPreviewBilans(parsed);
      setAnalysisDone(true);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la lecture du JSON.");
    }
  };

  const handleApplyAll = () => {
    const newCourseLessons = [...course.lessons];

    previewBilans.forEach(newBilan => {
      const index = newCourseLessons.findIndex(l => l.id === newBilan.id);
      if (index !== -1) {
        newCourseLessons[index] = {
          ...newCourseLessons[index],
          title: newBilan.title || newCourseLessons[index].title,
          description: newBilan.description || newCourseLessons[index].description,
          titleEn: newBilan.titleEn || newCourseLessons[index].titleEn,
          descriptionEn: newBilan.descriptionEn || newCourseLessons[index].descriptionEn,
          imageUrl: newBilan.imageUrl || newCourseLessons[index].imageUrl,
          isReview: newBilan.isReview !== undefined ? newBilan.isReview : true
        };
      }
    });

    setCourse({ lessons: newCourseLessons });

    setAnalysisDone(false);
    setJsonInput("");
    setPreviewBilans([]);
  };

  if (!isLoaded) return null;

  return (
    <div className="flex h-full -mx-6 md:-mx-8 -my-6 md:-my-8 bg-slate-50 text-slate-900 overflow-hidden">
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="p-6 max-w-5xl mx-auto h-full flex flex-col pt-8">
          <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm mb-8">
            <h2 className="text-[18px] font-bold text-slate-800 m-0 mb-2 flex items-center gap-2">
              <FileText size={22} className="text-blue-500" />
              Mise à jour des Bilans
            </h2>
            <p className="text-[13px] text-slate-500 mb-6">
              Cet outil permet de générer un prompt contenant les informations de vos bilans pour qu'une IA produise des descriptions et des traductions cohérentes en fonction de l'unité et des leçons associées.
            </p>
            
            {!analysisDone ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label className="text-[11px] font-semibold uppercase text-slate-500 block mb-2">
                    1. Récupérer le Prompt structuré
                  </label>
                  <div className="relative flex-1 flex flex-col">
                    <textarea
                      readOnly
                      value={prompt}
                      className="w-full flex-1 min-h-[350px] border border-slate-200 rounded p-3 text-xs bg-slate-50 text-slate-600 font-mono resize-none focus:outline-none"
                    />
                    <button
                      onClick={handleCopyPrompt}
                      className="absolute top-2 right-2 flex items-center justify-center bg-white border border-slate-200 rounded p-1.5 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                      title="Copier le prompt"
                    >
                      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[11px] font-semibold uppercase text-slate-500 block mb-2">
                    2. Coller la réponse JSON
                  </label>
                  <div className="flex flex-col gap-2 flex-1">
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder="[\n  {\n    'id': '...', \n    'title': '...'\n  }\n]"
                      className="w-full flex-1 min-h-[350px] border border-slate-200 rounded p-3 text-xs bg-white font-mono focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none resize-none transition-all"
                    />
                    
                    {error && (
                      <div className="text-[11px] text-red-600 flex items-start gap-1 bg-red-50 p-2 border border-red-100 rounded mt-2">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      onClick={handleAnalyzeJson}
                      disabled={!jsonInput.trim()}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded text-[13px] disabled:opacity-50 transition-colors mt-2 flex justify-center items-center gap-2 shadow-sm"
                    >
                      Analyser les informations
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 tracking-tight">Prévisualisation des Bilans</h3>
                  
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {previewBilans.map(pb => (
                      <div key={pb.id} className="p-4 bg-white border border-slate-200 rounded shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-bold text-slate-800">{pb.title}</div>
                            <div className="text-xs text-slate-500 italic mt-0.5">{pb.titleEn}</div>
                          </div>
                          <div className="text-[10px] bg-blue-100 text-blue-700 font-mono px-2 py-1 rounded">
                            {pb.id}
                          </div>
                        </div>
                        <div className="mt-2 text-[13px] text-slate-600">
                          <strong>FR:</strong> {pb.description}
                        </div>
                        <div className="text-[13px] text-slate-600">
                          <strong>EN:</strong> {pb.descriptionEn}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-2">Image: {pb.imageUrl} | isReview: {pb.isReview ? 'true' : 'false'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
                  <button
                    onClick={() => {
                      setAnalysisDone(false);
                      setJsonInput("");
                      setError(null);
                    }}
                    className="px-5 py-2.5 text-[13px] font-semibold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleApplyAll}
                    className="px-5 py-2.5 text-[13px] font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Save size={16} /> Mettre à jour les Bilans
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
