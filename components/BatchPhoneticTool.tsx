"use client";

import React, { useState, useMemo } from "react";
import { useCourse } from "@/contexts/CourseContext";
import { Sparkles, CheckSquare, Square, Loader2, Play } from "lucide-react";

type MissingItem = {
  lessonId: string;
  itemId: string;
  type: "word" | "phrase";
  th: string;
};

export default function BatchPhoneticTool() {
  const { course, setCourse } = useCourse();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorText, setErrorText] = useState("");

  const missingItems = useMemo(() => {
    const items: MissingItem[] = [];
    course.lessons.forEach((lesson) => {
      lesson.words.forEach((word) => {
        if (!word.phonetic?.trim() && word.th?.trim()) {
          items.push({
            lessonId: lesson.id,
            itemId: word.id,
            type: "word",
            th: word.th,
          });
        }
      });
      lesson.phrases.forEach((phrase) => {
        if (!phrase.phonetic?.trim() && phrase.th?.trim()) {
          items.push({
            lessonId: lesson.id,
            itemId: phrase.id,
            type: "phrase",
            th: phrase.th,
          });
        }
      });
    });
    return items;
  }, [course]);

  const toggleSelection = (itemId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    setSelectedIds(new Set(missingItems.map((item) => item.itemId)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBatchGenerate = async () => {
    if (selectedIds.size === 0) return;
    setIsGenerating(true);
    setErrorText("");

    const itemsToProcess = missingItems.filter((item) =>
      selectedIds.has(item.itemId),
    );
    const thInputs = itemsToProcess.map((item) => item.th);

    try {
      const res = await fetch("/api/generate-phonetic-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: thInputs }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to batch generate");
      }

      const data = await res.json();
      const results = data.results;

      if (!Array.isArray(results) || results.length !== thInputs.length) {
        throw new Error("Invalid response format from API");
      }

      // Update the course state
      const updatedLessons = course.lessons.map((lesson) => {
        const newWords = lesson.words.map((word) => {
          const index = itemsToProcess.findIndex(
            (it) => it.itemId === word.id && it.type === "word",
          );
          if (index !== -1 && results[index]) {
            return { ...word, phonetic: results[index] };
          }
          return word;
        });

        const newPhrases = lesson.phrases.map((phrase) => {
          const index = itemsToProcess.findIndex(
            (it) => it.itemId === phrase.id && it.type === "phrase",
          );
          if (index !== -1 && results[index]) {
            return { ...phrase, phonetic: results[index] };
          }
          return phrase;
        });

        return { ...lesson, words: newWords, phrases: newPhrases };
      });

      setCourse({ lessons: updatedLessons });
      // Reset selection after success
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "An error occurred during generation");
    } finally {
      setIsGenerating(false);
    }
  };

  if (missingItems.length === 0) {
    return null; // Don't show if nothing is missing
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
            <Sparkles size={16} className="text-blue-500" />
            Génération de Phonétique en Masse
          </h2>
          <p className="text-[12px] text-slate-500 mt-1">
            {missingItems.length} élément(s) sans phonétique trouvé(s).
          </p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size === missingItems.length ? (
            <button
              onClick={deselectAll}
              className="px-3 py-1.5 min-w-[80px] text-[12px] font-semibold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-1.5 justify-center"
            >
              <Square size={14} /> Aucun
            </button>
          ) : (
            <button
              onClick={selectAll}
              className="px-3 py-1.5 min-w-[80px] text-[12px] font-semibold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-1.5 justify-center"
            >
              <CheckSquare size={14} /> Tous
            </button>
          )}
          <button
            onClick={handleBatchGenerate}
            disabled={selectedIds.size === 0 || isGenerating}
            className="px-4 py-1.5 bg-blue-600 text-white text-[12px] font-bold rounded shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isGenerating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            Générer ({selectedIds.size})
          </button>
        </div>
      </div>

      {errorText && (
        <div className="p-3 mx-4 mt-4 bg-red-50 text-red-600 text-[12px] font-semibold border border-red-200 rounded">
          {errorText}
        </div>
      )}

      <div className="p-4 max-h-[600px] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {missingItems.map((item) => (
            <div
              key={item.itemId}
              onClick={() => toggleSelection(item.itemId)}
              className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${selectedIds.has(item.itemId) ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200 hover:border-slate-300"}`}
            >
              <div className="shrink-0 flex items-center">
                {selectedIds.has(item.itemId) ? (
                  <CheckSquare size={18} className="text-blue-500" />
                ) : (
                  <Square size={18} className="text-slate-300" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-slate-800 truncate">
                  {item.th}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
                  {item.type === "word" ? "Mot" : "Phrase"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
