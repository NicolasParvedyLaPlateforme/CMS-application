"use client";

import { useCourse } from "@/contexts/CourseContext";
import { useState, useMemo } from "react";
import { AlertCircle, Check, Copy, Bot } from "lucide-react";

export default function AIAssistantTool({ lessonId }: { lessonId: string }) {
  const { course, updateLesson } = useCourse();
  const [jsonInput, setJsonInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const lessonIndex = course.lessons.findIndex((l) => l.id === lessonId);
  const lesson = course.lessons[lessonIndex];

    const prompt = useMemo(() => {
    if (!lesson) return "";

    const previousWords = new Set<string>();
    const previousPhrases = new Set<string>();

    for (let i = 0; i < lessonIndex; i++) {
      course.lessons[i].words.forEach((w) => {
        if (w.th) previousWords.add(w.th);
      });
      course.lessons[i].phrases.forEach((p) => {
        if (p.th) previousPhrases.add(p.th);
      });
    }

    const currentWordsStr = JSON.stringify(lesson.words, null, 2);
    const currentPhrasesStr = JSON.stringify(lesson.phrases, null, 2);

    return `Tu es un expert en langue thaïlandaise et créateur de cours. Génère ou améliore le contenu de cette leçon intitulée "${lesson.title}".

L'objectif est de mettre à jour ou créer environ 5 mots et 5 phrases pertinents par rapport au titre de la leçon.

CONTRAINTES OBLIGATOIRES POUR LES MOTS :
1. Chaque mot doit comporter le texte en thaï, une transcription phonétique, une traduction française et une anglaise.
2. INTERDICTION de proposer comme nouveaux mots des mots déjà vus dans les leçons précédentes.
   - Liste des mots déjà connus (à ne pas recréer) : ${Array.from(previousWords).join(", ") || "Aucun pour le moment"}.

CONTRAINTES OBLIGATOIRES POUR LES PHRASES :
1. Chaque phrase doit avoir le texte thaï, la transcription phonétique, et les traductions française et anglaise.
2. Les phrases nouvellement créées DOIVENT être composées UNIQUEMENT de mots appartenant aux leçons précédentes (voir liste ci-dessus) ou aux nouveaux mots de la leçon actuelle.
3. INTERDICTION absolue d'utiliser un mot thaï dans une phrase s'il n'a pas été explicitement enseigné (soit dans la liste déjà connue, soit parmi les nouveaux mots générés pour cette leçon).
   - Ne pas recréer des phrases déjà existantes : ${Array.from(previousPhrases).join(", ") || "Aucune pour le moment"}.

AUTRES CONSIGNES :
1. Les IDs doivent être cohérents (ex: w_hello, w_apple, p_how_are_you).
2. Si des mots ou phrases sont déjà présents dans le contenu actuel de la leçon (voir ci-dessous), vérifie-les, corrige-les si besoin, ou complète-les pour atteindre le nombre recommandé.
3. Renvoie UNIQUEMENT un objet JSON (sans le bloc markdown au début ou à la fin).

STRUCTURE JSON ATTENDUE :
{
  "words": [
    { "id": "...", "th": "...", "phonetic": "...", "fr": "...", "en": "..." }
  ],
  "phrases": [
    { "id": "...", "th": "...", "phonetic": "...", "fr": "...", "en": "...", "components": ["id_word1", "id_word2"] }
  ]
}

CONTENU ACTUEL DE LA LEÇON À METTRE À JOUR :
Title: ${lesson.title}
Words:
${currentWordsStr}

Phrases:
${currentPhrasesStr}
`;
  }, [lesson, lessonIndex, course]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleApplyJson = () => {
    if (!jsonInput.trim()) {
      setError("Le champ JSON est vide.");
      return;
    }
    try {
      setError(null);
      setIsApplying(true);
      
      let parsed;
      try {
        parsed = JSON.parse(jsonInput);
      } catch (parseErr) {
        // Handle case where they pasted with markdown ticks despite instructions
        const cleaned = jsonInput.replace(/^```json/m, "").replace(/```$/m, "").trim();
        parsed = JSON.parse(cleaned);
      }

      if (!parsed.words || !parsed.phrases || !Array.isArray(parsed.words) || !Array.isArray(parsed.phrases)) {
        throw new Error("Structure JSON invalide : doit contenir 'words' et 'phrases' de type tableau.");
      }

      const updatedWords = parsed.words.map((w: any) => ({
        id: w.id || `w_${Math.random().toString(36).substr(2, 6)}`,
        th: w.th || "",
        phonetic: w.phonetic || "",
        fr: w.fr || "",
        en: w.en || "",
        allowIdenticalTranslation: w.allowIdenticalTranslation || false,
      }));

      const updatedPhrases = parsed.phrases.map((p: any) => ({
        id: p.id || `p_${Math.random().toString(36).substr(2, 6)}`,
        th: p.th || "",
        phonetic: p.phonetic || "",
        fr: p.fr || "",
        en: p.en || "",
        components: p.components && Array.isArray(p.components) ? p.components : [],
        allowIdenticalTranslation: p.allowIdenticalTranslation || false,
      }));

      updateLesson(
        lesson.id,
        {
          ...lesson,
          words: updatedWords,
          phrases: updatedPhrases,
        },
        "Mise à jour de la leçon via IA JSON"
      );

      setJsonInput(""); // success
    } catch (err: any) {
      setError(err.message || "Erreur de format du JSON.");
    } finally {
      setIsApplying(false);
    }
  };

  if (!lesson) return null;

  return (
    <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-indigo-100 p-6 mb-4 mt-6">
      <h2 className="text-[14px] font-bold text-indigo-900 m-0 mb-4 flex items-center gap-2">
        <Bot size={18} className="text-indigo-500" />
        Assistant IA (Gemini)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-[11px] font-semibold uppercase text-indigo-600 block mb-2">
            1. Copier le prompt pour Gemini
          </label>
          <div className="relative">
            <textarea
              readOnly
              value={prompt}
              className="w-full h-48 border border-indigo-200 rounded p-3 text-xs bg-white text-slate-600 font-mono resize-none focus:outline-none"
            />
            <button
              onClick={handleCopyPrompt}
              className="absolute top-2 right-2 flex items-center justify-center bg-white border border-indigo-200 rounded p-1.5 text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Copier le prompt"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
          <p className="text-[11px] text-indigo-700/70 mt-2 leading-tight">
            Copiez ce texte et collez-le dans Google Gemini. Il contient toutes les informations de votre leçon ainsi que les règles pour éviter les mots en double avec les leçons précédentes.
          </p>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase text-indigo-600 block mb-2">
            2. Coller le JSON généré
          </label>
          <div className="flex flex-col gap-2 h-full">
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="{\n  'words': [...],\n  'phrases': [...]\n}"
              className="w-full h-48 border border-indigo-200 rounded p-3 text-xs bg-white font-mono focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none resize-none transition-all"
            />
            
            {error && (
              <div className="text-[11px] text-red-600 flex items-start gap-1 bg-red-50 p-2 border border-red-100 rounded">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleApplyJson}
              disabled={isApplying || !jsonInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded text-sm disabled:opacity-50 transition-colors mt-auto flex justify-center items-center gap-2"
            >
              Appliquer les modifications
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
