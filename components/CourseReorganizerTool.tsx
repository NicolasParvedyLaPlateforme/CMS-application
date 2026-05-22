"use client";

import { useState, useMemo } from "react";
import { useCourse } from "@/contexts/CourseContext";
import { Bot, Check, Copy, AlertCircle, ArrowRight, PlusCircle, MoveRight } from "lucide-react";
import { Lesson, Word, Phrase } from "@/types/course";

type TitleChange = { lessonId: string; oldTitle: string; newTitle: string; selected: boolean };
type NewLesson = { id: string; title: string; insertAfterId: string | null; selected: boolean };
type ItemMove = { itemId: string; itemType: "word" | "phrase"; th: string; fromLessonId: string; toLessonId: string; selected: boolean };

export default function CourseReorganizerTool() {
  const { course, setCourse } = useCourse();
  const [jsonInput, setJsonInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedLessonIds, setSelectedLessonIds] = useState<Set<string>>(new Set());
  const [titleChanges, setTitleChanges] = useState<TitleChange[]>([]);
  const [newLessons, setNewLessons] = useState<NewLesson[]>([]);
  const [itemMoves, setItemMoves] = useState<ItemMove[]>([]);
  const [analysisDone, setAnalysisDone] = useState(false);

  const getLessonName = (id: string) => course.lessons.find((l) => l.id === id)?.title || id;

  const prompt = useMemo(() => {
    const wordMaxLessonIndex = new Map<string, number>();

    course.lessons.forEach((l, idx) => {
      l.phrases.forEach(p => {
        p.components?.forEach(compId => {
          const currentMin = wordMaxLessonIndex.get(compId);
          if (currentMin === undefined || idx < currentMin) {
            wordMaxLessonIndex.set(compId, idx);
          }
        });
      });
    });

    const allTitles = course.lessons.map((l, idx) => ({
      index: idx + 1,
      id: l.id,
      title: l.title
    }));

    const selectedData = course.lessons
      .filter(l => selectedLessonIds.size === 0 || selectedLessonIds.has(l.id))
      .map(l => ({
        id: l.id,
        title: l.title,
        words: l.words.map(w => {
          const maxIdx = wordMaxLessonIndex.get(w.id);
          return { 
            id: w.id, 
            th: w.th,
            ...(maxIdx !== undefined ? { "lesson-max-index": maxIdx + 1 } : {})
          };
        }),
        phrases: l.phrases.map(p => ({ id: p.id, th: p.th, components: p.components }))
      }));

    return `Tu es un expert en conception de cours de langue (thaï pour francophones).
L'objectif est de réorganiser une partie de ce cours (niveau A1).

CONTEXTE COMPLET DU COURS (Titres et index de progression uniquement, pour référence globale) :
${JSON.stringify(allTitles, null, 2)}

LEÇONS CIBLES À RÉORGANISER (Détails) :
${JSON.stringify(selectedData, null, 2)}

CONSIGNES :
1. Améliore les titres pour qu'ils forment une progression propre.
2. Une leçon doit contenir 5 mots et 5 phrases environ (max 7).
3. Si une leçon contient trop d'éléments, crée de nouvelles leçons pour les séparer.
4. Règle absolue de progression : Ne déplace JAMAIS un mot vers une leçon située APRÈS une leçon qui utilise déjà ce mot dans l'une de ses phrases. Si un mot a la propriété "lesson-max-index" : X, il DOIT être placé dans une leçon dont l'index final est inférieur ou égal à X (donc dans une leçon placée avant ou sur la leçon X).
5. Pour les nouvelles leçons, donne un ID du type "l_nouveau_XXX".
6. Seules les leçons que tu modifies doivent être incluses dans ta réponse (pas besoin de renvoyer le cours entier si tout ne change pas).

STRUCTURE JSON ATTENDUE :
{
  "lessons": [
    {
      "id": "id_existant_ou_nouveau",
      "title": "Nouveau Titre",
      "wordsId": ["id_mot_1", "id_mot_2"],
      "phrasesId": ["id_phrase_1"]
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
        const match = jsonInput.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error("Impossible de trouver un JSON valide.");
        }
      }

      if (!parsed.lessons || !Array.isArray(parsed.lessons)) {
        throw new Error("Structure JSON invalide : doit contenir un tableau 'lessons'.");
      }

      const tChanges: TitleChange[] = [];
      const nLessons: NewLesson[] = [];
      const iMoves: ItemMove[] = [];

      const wordLocations = new Map<string, { lessonId: string, th: string }>();
      const phraseLocations = new Map<string, { lessonId: string, th: string }>();

      course.lessons.forEach(l => {
        l.words.forEach(w => wordLocations.set(w.id, { lessonId: l.id, th: w.th }));
        l.phrases.forEach(p => phraseLocations.set(p.id, { lessonId: l.id, th: p.th }));
      });

      parsed.lessons.forEach((aiLesson: any, index: number) => {
        const existingLesson = course.lessons.find(l => l.id === aiLesson.id);
        
        if (!existingLesson) {
          const prevAiLesson = index > 0 ? parsed.lessons[index - 1] : null;
          nLessons.push({
            id: aiLesson.id,
            title: aiLesson.title || "Nouvelle leçon",
            insertAfterId: prevAiLesson ? prevAiLesson.id : null,
            selected: true
          });
        } else {
          if (existingLesson.title !== aiLesson.title && aiLesson.title) {
            tChanges.push({
              lessonId: existingLesson.id,
              oldTitle: existingLesson.title,
              newTitle: aiLesson.title,
              selected: true
            });
          }
        }

        // Check word moves
        (aiLesson.wordsId || []).forEach((wId: string) => {
          const loc = wordLocations.get(wId);
          if (loc && loc.lessonId !== aiLesson.id) {
             iMoves.push({
               itemId: wId,
               itemType: "word",
               th: loc.th,
               fromLessonId: loc.lessonId,
               toLessonId: aiLesson.id,
               selected: true
             });
          }
        });

        // Check phrase moves
        (aiLesson.phrasesId || []).forEach((pId: string) => {
          const loc = phraseLocations.get(pId);
          if (loc && loc.lessonId !== aiLesson.id) {
             iMoves.push({
               itemId: pId,
               itemType: "phrase",
               th: loc.th,
               fromLessonId: loc.lessonId,
               toLessonId: aiLesson.id,
               selected: true
             });
          }
        });
      });

      setTitleChanges(tChanges);
      setNewLessons(nLessons);
      setItemMoves(iMoves);
      setAnalysisDone(true);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la lecture du JSON.");
    }
  };

  const handleApplySelected = () => {
    let updatedLessons = JSON.parse(JSON.stringify(course.lessons)) as Lesson[];

    // 1. Create new lessons
    newLessons.filter(n => n.selected).forEach(nl => {
        const newL: Lesson = {
            id: nl.id,
            title: nl.title,
            description: "",
            words: [],
            phrases: []
        };
        if (nl.insertAfterId) {
             const idx = updatedLessons.findIndex(l => l.id === nl.insertAfterId);
             if (idx !== -1) {
                 updatedLessons.splice(idx + 1, 0, newL);
             } else {
                 updatedLessons.push(newL);
             }
        } else {
             updatedLessons.unshift(newL);
        }
    });

    // 2. Apply title changes
    titleChanges.filter(t => t.selected).forEach(tc => {
        const lesson = updatedLessons.find(l => l.id === tc.lessonId);
        if (lesson) {
            lesson.title = tc.newTitle;
        }
    });

    // 3. Apply moves
    itemMoves.filter(m => m.selected).forEach(mv => {
        let removedItem: Word | Phrase | null = null;
        
        // Remove from source
        const fromL = updatedLessons.find(l => l.id === mv.fromLessonId);
        if (fromL) {
             if (mv.itemType === 'word') {
                 const idx = fromL.words.findIndex(w => w.id === mv.itemId);
                 if (idx !== -1) {
                     removedItem = fromL.words[idx];
                     fromL.words.splice(idx, 1);
                 }
             } else {
                 const idx = fromL.phrases.findIndex(p => p.id === mv.itemId);
                 if (idx !== -1) {
                     removedItem = fromL.phrases[idx];
                     fromL.phrases.splice(idx, 1);
                 }
             }
        }

        // Add to dest if it exists (might not exist if user unchecked a new lesson)
        if (removedItem) {
            const toL = updatedLessons.find(l => l.id === mv.toLessonId);
            if (toL) {
                if (mv.itemType === 'word') {
                    toL.words.push(removedItem as Word);
                } else {
                    toL.phrases.push(removedItem as Phrase);
                }
            } else if (fromL) {
                // If destination doesn't exist, revert
                if (mv.itemType === 'word') {
                    fromL.words.push(removedItem as Word);
                } else {
                    fromL.phrases.push(removedItem as Phrase);
                }
            }
        }
    });

    setCourse({ lessons: updatedLessons });
    setAnalysisDone(false);
    setTitleChanges([]);
    setNewLessons([]);
    setItemMoves([]);
    setJsonInput("");
  };

  const hasChanges = titleChanges.length > 0 || newLessons.length > 0 || itemMoves.length > 0;

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
        <Bot size={20} className="text-blue-500" />
        Réorganisation du Cours (Assistant IA)
      </h2>
      <p className="text-[12px] text-slate-500 mb-6">
        Générez un prompt, collez le JSON, puis choisissez précisément quelles modifications vous souhaitez appliquer. L'IA peut traiter votre cours par lots sans affecter les leçons qu'elle ne mentionne pas.
      </p>
      
      {!analysisDone ? (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold uppercase text-slate-500">
                Sélectionnez les leçons à réorganiser de fond en comble (laisser vide pour toutes les sélectionner)
              </label>
              <button onClick={handleToggleAll} className="text-[11px] text-blue-600 hover:underline">
                {selectedLessonIds.size > 0 ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded p-2 max-h-32 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
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
                1. Récupérer le Prompt (Allégé)
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
              Aucun changement détecté. Assurez-vous que l'IA a bien modifié des informations existantes.
            </div>
          ) : (
            <div className="space-y-6">
              {newLessons.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <PlusCircle size={16} className="text-green-600" /> Nouvelles leçons ({newLessons.length})
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                    {newLessons.map(nl => (
                      <label key={nl.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={nl.selected}
                          onChange={e => setNewLessons(prev => prev.map(n => n.id === nl.id ? { ...n, selected: e.target.checked } : n))}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-800">{nl.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {titleChanges.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <ArrowRight size={16} className="text-blue-600" /> Changements de titres ({titleChanges.length})
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                    {titleChanges.map(tc => (
                      <label key={tc.lessonId} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={tc.selected}
                          onChange={e => setTitleChanges(prev => prev.map(t => t.lessonId === tc.lessonId ? { ...t, selected: e.target.checked } : t))}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-slate-500 line-through">{tc.oldTitle}</span>
                          <ArrowRight size={14} className="text-slate-400" />
                          <span className="text-sm font-bold text-slate-800">{tc.newTitle}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {itemMoves.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <MoveRight size={16} className="text-orange-500" /> Déplacements ({itemMoves.length})
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                    {itemMoves.map((mv, idx) => (
                      <label key={idx} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={mv.selected}
                          onChange={e => setItemMoves(prev => {
                            const clone = [...prev];
                            clone[idx].selected = e.target.checked;
                            return clone;
                          })}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-800 bg-blue-50 px-2 py-0.5 rounded shrink-0">
                            {mv.th}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                            <span className="max-w-[120px] truncate" title={getLessonName(mv.fromLessonId)}>
                              {getLessonName(mv.fromLessonId)}
                            </span>
                            <MoveRight size={12} className="text-slate-400" />
                            <span className="max-w-[120px] truncate font-medium text-slate-700" title={getLessonName(mv.toLessonId) || newLessons.find(nl => nl.id === mv.toLessonId)?.title}>
                              {getLessonName(mv.toLessonId) || newLessons.find(nl => nl.id === mv.toLessonId)?.title || "Leçon inconnue"}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              onClick={() => {
                setAnalysisDone(false);
                setTitleChanges([]);
                setNewLessons([]);
                setItemMoves([]);
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