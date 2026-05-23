"use client";

import { useState, useMemo, useEffect } from "react";
import { useCourse } from "@/contexts/CourseContext";
import { Bot, Check, Copy, AlertCircle, Save, Layers } from "lucide-react";
import { Unit, Lesson } from "@/types/course";

export default function UnitReorganizerTool() {
  const { course, setCourse } = useCourse();
  const [jsonInput, setJsonInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [previewUnits, setPreviewUnits] = useState<Unit[]>([]);
  const [previewLessons, setPreviewLessons] = useState<any[]>([]);

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
    return l.title.toLowerCase().includes("bilan") || l.id.toLowerCase().includes("bilan");
  };

  const prompt = useMemo(() => {
    if (!isLoaded) return "";

    const simplifiedLessons = course.lessons.map((l, i) => ({
      order: i + 1,
      id: l.id,
      title: l.title,
      isBilan: isBilan(l)
    }));

    return `Tu es un expert en conception de cours de langue (thaï pour francophones).
L'objectif est de réorganiser les UNITÉS ainsi que le placement des "BILANS" d'un cours.
L'application groupe automatiquement les leçons par unité en comprenant qu'un bilan souvent marque la fin d'une étape ou d'une unité. Certains bilans sont mal placés, provoquant des unités d'une vingtaine de leçons et d'autres de 5.

Voici l'état actuel des unités:
${JSON.stringify(units, null, 2)}

Voici la liste de toutes les leçons (ainsi que les bilans actuels) actuellement dans l'ordre:
${JSON.stringify(simplifiedLessons, null, 2)}

CONSIGNES IMPORTANTES:
1. Mets à jour, crée ou supprime des unités (ajoute "id", "title", "titleEn", "description", "colorClass", "shades", etc.) pour avoir une taille d'environ 5 à 10 leçons par unité). Sois créatif sur les classes tailwind si tu crées des unités.
2. Pour équilibrer ces unités, déplace, ajoute ou modifie des leçons "bilan". Les bilans testent les connaissances des leçons précédentes.
3. RÈGLE ABSOLUE : Tu ne peux ABSOLUMENT PAS modifier l'ordre des leçons d'apprentissage (celles dont "isBilan": false) entre elles. Leur séquence est immuable et tu ne peux ni les supprimer ni les déplacer par rapport aux autres. Par exemple, tu ne peux pas lire une leçon 3 avant une leçon 1. Tu peux uniquement INTERCALER des bilans entre ces leçons, et retirer les anciens bilans mal placés.
4. Les propriétés "isBilan" servent de repères.
5. Produit UNIQUEMENT une réponse en format JSON pur respectant la forme définie :

STRUCTURE JSON ATTENDUE:
{
  "units": [
    // tableau complet des unités mises à jour
  ],
  "lessons": [
    // Le tableau de toutes les leçons (anciennes non-bilans incluses et intouchées dans leur ordre relatif) plus les bilans réorganisés.
    { "id": "id-existante", "title": "titre", "isBilan": false },
    { "id": "nouveau-bilan-1", "title": "Bilan de l'unité 1", "isBilan": true }
  ]
}`;
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
        const match = jsonInput.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error("Impossible de trouver un JSON valide.");
        }
      }

      if (!parsed.units || !Array.isArray(parsed.units)) {
        throw new Error("Structure JSON invalide : doit contenir un tableau 'units'.");
      }
      if (!parsed.lessons || !Array.isArray(parsed.lessons)) {
        throw new Error("Structure JSON invalide : doit contenir un tableau 'lessons'.");
      }

      // Check validation length of learning lessons: do we have all non-bilan lessons from original?
      const originalLearnLessons = course.lessons.filter(l => !isBilan(l));
      const newLearnLessons = parsed.lessons.filter((l: any) => !l.isBilan);

      if (originalLearnLessons.length !== newLearnLessons.length) {
        // Just a warning or strict error? 
        console.warn("Attention: le nombre de leçons d'apprentissage non-bilan a changé !");
      }

      setPreviewUnits(parsed.units);
      setPreviewLessons(parsed.lessons);
      setAnalysisDone(true);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la lecture du JSON.");
    }
  };

  const handleApplyAll = () => {
    // 1. Save new units
    localStorage.setItem("th-units-draft", JSON.stringify(previewUnits));
    setUnits(previewUnits); // update local state so prompt regenerates properly if needed

    // 2. Map new lessons to actual course update
    const newCourseLessons: Lesson[] = [];

    previewLessons.forEach((aiLesson: any) => {
      // Find existing by ID
      const existingLesson = course.lessons.find(l => l.id === aiLesson.id);

      if (existingLesson) {
        // Modifying only the title in case of renamed bilan
        // Note: For regular lessons, the AI might have accidentally tweaked title, we optionally accept it.
        newCourseLessons.push({
          ...existingLesson,
          title: aiLesson.title || existingLesson.title
        });
      } else {
        // If it's a new item, it's a new Bilan
        newCourseLessons.push({
          id: aiLesson.id || `bilan-${Date.now()}`,
          title: aiLesson.title || "Nouveau Bilan",
          description: "",
          words: [],
          phrases: [],
        });
      }
    });

    setCourse({ lessons: newCourseLessons });

    setAnalysisDone(false);
    setJsonInput("");
    setPreviewUnits([]);
    setPreviewLessons([]);
  };

  if (!isLoaded) return null;

  return (
    <div className="flex h-full -mx-6 md:-mx-8 -my-6 md:-my-8 bg-slate-50 text-slate-900 overflow-hidden">
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="p-6 max-w-5xl mx-auto h-full flex flex-col pt-8">
          <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm mb-8">
            <h2 className="text-[18px] font-bold text-slate-800 m-0 mb-2 flex items-center gap-2">
              <Layers size={22} className="text-blue-500" />
              Réorganisation des Unités et Bilans
            </h2>
            <p className="text-[13px] text-slate-500 mb-6">
              Ce puissant outil IA vous permet de réorganiser complètement la structure globale du cours. L'IA va équilibrer la taille de chaque unité et déplacer ou créer les bilans correspondants à chaque palier.
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
                      placeholder="{\n  'units': [...],\n  'lessons': [...]\n}"
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
                      Analyser les changements
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 tracking-tight">Prévisualisation des changements</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-500 mb-3 border-b pb-2">Unités ({previewUnits.length})</h4>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {previewUnits.map(pu => (
                          <div key={pu.id} className="p-2 bg-white border border-slate-200 rounded shadow-sm">
                            <div className="text-sm font-bold text-slate-800">{pu.title}</div>
                            <div className="text-[11px] text-slate-500">{pu.id}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-500 mb-3 border-b pb-2">Ordre des Leçons & Bilans</h4>
                      <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2">
                        {previewLessons.map((pl, i) => (
                          <div key={pl.id} className={`p-1.5 px-3 border rounded text-sm flex gap-2 items-center ${pl.isBilan ? 'bg-orange-50 border-orange-200 font-semibold text-orange-900' : 'bg-white border-slate-200 text-slate-700'}`}>
                            <span className="text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-400 font-mono w-6 text-center">{i + 1}</span>
                            <span>{pl.title}</span>
                            {pl.isBilan && <span className="ml-auto text-[9px] uppercase font-bold text-orange-500 tracking-wider">BILAN</span>}
                          </div>
                        ))}
                      </div>
                    </div>
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
                    <Save size={16} /> Enregistrer et Appliquer
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
