"use client";

import { useState, useMemo } from "react";
import { useCourse } from "@/contexts/CourseContext";
import { Bot, Check, Copy, AlertCircle, ArrowRight, Save } from "lucide-react";
import { Lesson } from "@/types/course";

type MetaChange = {
  id: string;
  oldTitle: string;
  newTitle: string;
  oldTitleEn?: string;
  newTitleEn?: string;
  oldDesc: string;
  newDesc: string;
  oldDescEn?: string;
  newDescEn?: string;
  selected: boolean;
};

export default function LessonMetaTool() {
  const { course, setCourse } = useCourse();
  const [jsonInput, setJsonInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set());
  const [metaChanges, setMetaChanges] = useState<MetaChange[]>([]);
  const [analysisDone, setAnalysisDone] = useState(false);

  const getLessonName = (id: string) => course.lessons.find((l) => l.id === id)?.title || id;

  const prompt = useMemo(() => {
    const selectedData = course.lessons
      .filter(l => selectedLessonIds.size === 0 || selectedLessonIds.has(l.id))
      .map(l => ({
        id: l.id,
        title: l.title || "",
        titleEn: l.titleEn || "",
        description: l.description || "",
        descriptionEn: l.descriptionEn || ""
      }));

    return `Tu es un expert en conception bilingue de cours de langue (thaï).
L'objectif est de mettre à jour ou ajouter les informations manquantes (titres et descriptions) d'une sélection de leçons, en français et en anglais.

LEÇONS CIBLES :
${JSON.stringify(selectedData, null, 2)}

CONSIGNES :
1. Pour chaque leçon, vérifie que les champs "title", "titleEn", "description", et "descriptionEn" sont remplis, pertinents et cohérents.
2. Si un champ est manquant ("") ou incohérent, fournis une valeur appropriée.
3. Ne modifie pas l'ID de la leçon.
4. Rends uniquement les leçons que tu as modifiées ou complétées.

STRUCTURE JSON ATTENDUE :
{
  "lessons": [
    {
      "id": "id_de_la_lecon",
      "title": "Titre en français",
      "titleEn": "Title in English",
      "description": "Description courte en français",
      "descriptionEn": "Short description in English"
    }
  ]
}`;
  }, [course, selectedLessonIds]);

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
    setError(null);
    try {
      // Allow single quotes or non-strict JSON slightly if possible, but JSON.parse expects strict.
      // Often AI uses markdown formatting like ```json ... ```
      const cleanedInput = jsonInput.replace(/^`+json\s*/i, "").replace(/`+$/g, "").trim();
      const parsed = JSON.parse(cleanedInput);
      
      if (!parsed.lessons || !Array.isArray(parsed.lessons)) {
        throw new Error("Structure JSON invalide : doit contenir un tableau 'lessons'.");
      }

      const mChanges: MetaChange[] = [];

      parsed.lessons.forEach((aiLesson: any) => {
        const existingLesson = course.lessons.find(l => l.id === aiLesson.id);
        
        if (existingLesson) {
          const titleChanged = existingLesson.title !== aiLesson.title && aiLesson.title;
          const titleEnChanged = existingLesson.titleEn !== aiLesson.titleEn && aiLesson.titleEn;
          const descChanged = existingLesson.description !== aiLesson.description && aiLesson.description;
          const descEnChanged = existingLesson.descriptionEn !== aiLesson.descriptionEn && aiLesson.descriptionEn;

          if (titleChanged || titleEnChanged || descChanged || descEnChanged) {
            mChanges.push({
              id: existingLesson.id,
              oldTitle: existingLesson.title,
              newTitle: aiLesson.title || existingLesson.title,
              oldTitleEn: existingLesson.titleEn,
              newTitleEn: aiLesson.titleEn || existingLesson.titleEn,
              oldDesc: existingLesson.description,
              newDesc: aiLesson.description || existingLesson.description,
              oldDescEn: existingLesson.descriptionEn,
              newDescEn: aiLesson.descriptionEn || existingLesson.descriptionEn,
              selected: true
            });
          }
        }
      });

      setMetaChanges(mChanges);
      setAnalysisDone(true);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la lecture du JSON.");
    }
  };

  const handleApplySelected = () => {
    let updatedLessons = JSON.parse(JSON.stringify(course.lessons)) as Lesson[];

    metaChanges.filter(m => m.selected).forEach(mc => {
        const lesson = updatedLessons.find(l => l.id === mc.id);
        if (lesson) {
            lesson.title = mc.newTitle;
            lesson.titleEn = mc.newTitleEn;
            lesson.description = mc.newDesc;
            lesson.descriptionEn = mc.newDescEn;
        }
    });

    setCourse({ lessons: updatedLessons });
    setAnalysisDone(false);
    setMetaChanges([]);
    setJsonInput("");
  };

  const hasChanges = metaChanges.length > 0;

  const handleToggleAll = () => {
    if (selectedLessonIds.size === course.lessons.length || (selectedLessonIds.size > 0 && selectedLessonIds.size !== course.lessons.length)) {
      setSelectedLessonIds(new Set());
    } else {
      setSelectedLessonIds(new Set(course.lessons.map(l => l.id)));
    }
  };

  const handleToggleLesson = (id: string) => {
    const next = new Set(selectedLessonIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLessonIds(next);
  };

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm mb-8">
      <h2 className="text-[16px] font-bold text-slate-800 m-0 mb-2 flex items-center gap-2">
        <Bot size={18} className="text-blue-500" />
        Assistant Métadonnées (Titres & Descriptions)
      </h2>
      <p className="text-[12px] text-slate-500 mb-6">
        Générez un prompt pour demander à l'IA de compléter ou corriger les titres et descriptions (FR/EN) de vos leçons.
      </p>
      
      {!analysisDone ? (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold uppercase text-slate-500">
                Sélectionnez les leçons à analyser (laisser vide pour toutes les transmettre)
              </label>
              <button onClick={handleToggleAll} className="text-[11px] text-blue-600 hover:underline">
                {selectedLessonIds.size > 0 ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-2 max-h-[600px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
              {course.lessons.map((l) => (
                <label key={l.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-white rounded p-1">
                  <input 
                    type="checkbox" 
                    checked={selectedLessonIds.has(l.id)} 
                    onChange={() => handleToggleLesson(l.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="truncate" title={l.title}>{l.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[11px] font-semibold uppercase text-slate-500 block mb-2">
                1. Récupérer le Prompt
              </label>
            <div className="relative">
              <textarea
                readOnly
                value={prompt}
                className="w-full h-48 border border-slate-200 rounded p-3 text-xs bg-slate-50 text-slate-600 font-mono resize-none focus:outline-none"
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

          <div>
            <label className="text-[11px] font-semibold uppercase text-slate-500 block mb-2">
              2. Coller la réponse JSON
            </label>
            <div className="flex flex-col gap-2 h-full">
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="{\n  'lessons': [...]\n}"
                className="w-full h-48 border border-slate-200 rounded p-3 text-xs bg-white font-mono focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none resize-none transition-all"
              />
              
              {error && (
                <div className="text-[11px] text-red-600 flex items-start gap-1 bg-red-50 p-2 border border-red-100 rounded">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleAnalyzeJson}
                disabled={!jsonInput.trim()}
                className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-4 rounded text-[13px] disabled:opacity-50 transition-colors mt-auto flex justify-center items-center gap-2"
              >
                Analyser les changements
              </button>
            </div>
          </div>
        </div>
        </>
      ) : (
        <div className="mt-4">
          {!hasChanges ? (
            <div className="bg-slate-50 border border-slate-200 rounded p-6 text-center text-slate-500">
              Aucun changement détecté.
            </div>
          ) : (
            <div className="space-y-6">
              {metaChanges.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Save size={16} className="text-blue-600" /> Informations à mettre à jour ({metaChanges.length})
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-4">
                    {metaChanges.map((mc, idx) => {
                      const titleChanged = mc.oldTitle !== mc.newTitle;
                      const titleEnChanged = mc.oldTitleEn !== mc.newTitleEn;
                      const descChanged = mc.oldDesc !== mc.newDesc;
                      const descEnChanged = mc.oldDescEn !== mc.newDescEn;

                      return (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded">
                          <input 
                            type="checkbox" 
                            checked={mc.selected}
                            onChange={e => setMetaChanges(prev => {
                              const clone = [...prev];
                              clone[idx].selected = e.target.checked;
                              return clone;
                            })}
                            className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0 space-y-2">
                            <h4 className="text-sm font-bold text-slate-800">Leçon : {getLessonName(mc.id)}</h4>
                            
                            {(titleChanged || titleEnChanged) && (
                              <div className="text-xs space-y-1">
                                {titleChanged && (
                                  <div className="flex items-center gap-2 flex-wrap text-slate-600">
                                    <span className="font-semibold w-12 text-slate-400">FR</span>
                                    <span className="line-through">{mc.oldTitle || "(vide)"}</span>
                                    <ArrowRight size={12} className="text-slate-400 mx-1" />
                                    <span className="font-bold text-blue-700">{mc.newTitle}</span>
                                  </div>
                                )}
                                {titleEnChanged && (
                                  <div className="flex items-center gap-2 flex-wrap text-slate-600">
                                    <span className="font-semibold w-12 text-slate-400">EN</span>
                                    <span className="line-through">{mc.oldTitleEn || "(vide)"}</span>
                                    <ArrowRight size={12} className="text-slate-400 mx-1" />
                                    <span className="font-bold text-blue-700">{mc.newTitleEn}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {(descChanged || descEnChanged) && (
                              <div className="text-xs space-y-1 mt-2 pt-2 border-t border-slate-100">
                                {descChanged && (
                                  <div className="flex items-start gap-2 text-slate-600">
                                    <span className="font-semibold w-12 text-slate-400 mt-0.5">Desc FR</span>
                                    <div className="flex-1">
                                      <div className="text-slate-400 line-through mb-1">{mc.oldDesc || "(vide)"}</div>
                                      <div className="font-medium text-slate-800">{mc.newDesc}</div>
                                    </div>
                                  </div>
                                )}
                                {descEnChanged && (
                                  <div className="flex items-start gap-2 text-slate-600 mt-2">
                                    <span className="font-semibold w-12 text-slate-400 mt-0.5">Desc EN</span>
                                    <div className="flex-1">
                                      <div className="text-slate-400 line-through mb-1">{mc.oldDescEn || "(vide)"}</div>
                                      <div className="font-medium text-slate-800">{mc.newDescEn}</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              onClick={() => {
                setAnalysisDone(false);
                setMetaChanges([]);
              }}
              className="px-4 py-2 text-[13px] font-semibold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
               disabled={!hasChanges}
              onClick={handleApplySelected}
              className="px-4 py-2 text-[13px] font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              Appliquer la sélection
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
