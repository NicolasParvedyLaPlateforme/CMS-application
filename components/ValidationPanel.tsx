"use client";

import { useCourse } from "@/contexts/CourseContext";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";

function getCategory(msg: string) {
  const lower = msg.toLowerCase();
  if (lower.includes("duplicated")) return "ID Dupliqué";
  if (lower.includes("maximum allowed")) return "Limite Dépassée (Mots)";
  if (lower.includes("exactly 5")) return "Quantité Invalide (Phrases)";
  if (lower.includes("phonetic cannot be empty")) return "Phonétique Manquante";
  if (lower.includes("identical")) return "Traductions Identiques";
  if (lower.includes("gender marker mismatch")) return "Incohérence de Genre";
  if (lower.includes("future lesson")) return "Dépendance Future";
  if (lower.includes("does not exist")) return "Mot Introuvable";
  if (lower.includes("thai construction mismatch")) return "Construction Thaï Invalide";
  if (lower.includes("image url manquante") || lower.includes("image de la leçon est manquante")) return "Images vides";
  return "Autre";
}

function getWarningCategory(msg: string) {
  if (msg.toLowerCase().includes("ghost word")) return "Mot Fantôme";
  return "Autre";
}

export function ValidationPanel({ standalone = true }: { standalone?: boolean }) {
  const { report } = useCourse();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedWarningCategory, setSelectedWarningCategory] = useState<string>("All");

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    report.errors.forEach(e => cats.add(getCategory(e.message)));
    return Array.from(cats).sort();
  }, [report.errors]);

  const availableWarningCategories = useMemo(() => {
    const cats = new Set<string>();
    report.warnings.forEach(w => cats.add(getWarningCategory(w.message)));
    return Array.from(cats).sort();
  }, [report.warnings]);

  useEffect(() => {
    if (selectedCategory !== "All" && !availableCategories.includes(selectedCategory)) setSelectedCategory("All");
  }, [availableCategories, selectedCategory]);

  useEffect(() => {
    if (selectedWarningCategory !== "All" && !availableWarningCategories.includes(selectedWarningCategory)) setSelectedWarningCategory("All");
  }, [availableWarningCategories, selectedWarningCategory]);

  const filteredErrors = useMemo(() => {
    if (selectedCategory === "All") return report.errors;
    return report.errors.filter(e => getCategory(e.message) === selectedCategory);
  }, [report.errors, selectedCategory]);

  const filteredWarnings = useMemo(() => {
    if (selectedWarningCategory === "All") return report.warnings;
    return report.warnings.filter(w => getWarningCategory(w.message) === selectedWarningCategory);
  }, [report.warnings, selectedWarningCategory]);

  return (
    <div className={`bg-white text-left flex flex-col h-full shrink-0 ${standalone ? 'border border-slate-200 rounded-lg shadow-sm' : ''}`}>
      <header className={`p-4 border-b border-slate-200 bg-slate-50 ${standalone ? 'rounded-t-lg' : ''}`}>
        <h2 className="m-0 text-[14px] font-bold text-slate-800">Validation en temps réel</h2>
      </header>
      
      <div className="p-4 overflow-y-auto flex-1">
        {report.errors.length > 0 && (
          <div className="mb-5">
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold uppercase text-slate-700">ERREURS ({report.errors.length})</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-red-100 text-red-700">Bloquant</span>
              </div>
              {availableCategories.length > 0 && (
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-[11px] border border-slate-200 rounded px-2 py-1.5 bg-slate-50 text-slate-700 outline-none w-full font-medium focus:border-red-300 transition-shadow cursor-pointer"
                >
                  <option value="All">Tout afficher ({report.errors.length})</option>
                  {availableCategories.map(c => (
                    <option key={c} value={c}>{c} ({report.errors.filter(e => getCategory(e.message) === c).length})</option>
                  ))}
                </select>
              )}
            </div>
            {filteredErrors.map((err, idx) => (
              <Link 
                href={err.actionUrl || (err.lessonId ? `/lessons/${err.lessonId}${err.itemId ? `#${err.itemId}` : ''}` : '#')} 
                key={`err-${idx}`} 
                className="block text-[12px] text-slate-600 border-l-[2px] border-red-500 pl-3 mb-3 py-1 hover:bg-slate-50 transition-colors"
                title="Cliquer pour corriger"
              >
                <strong className="text-red-700">{err.lessonId || 'Global'} {err.itemId && `(${err.itemId})`}:</strong> {err.message}
              </Link>
            ))}
          </div>
        )}

        {report.warnings.length > 0 && (
          <div className="mb-5">
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-bold uppercase text-slate-700">AVERTISSEMENTS ({report.warnings.length})</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-amber-100 text-amber-800">Info</span>
              </div>
              {availableWarningCategories.length > 0 && (
                <select 
                  value={selectedWarningCategory} 
                  onChange={(e) => setSelectedWarningCategory(e.target.value)}
                  className="text-[11px] border border-slate-200 rounded px-2 py-1.5 bg-slate-50 text-slate-700 outline-none w-full font-medium focus:border-amber-300 transition-shadow cursor-pointer"
                >
                  <option value="All">Tout afficher ({report.warnings.length})</option>
                  {availableWarningCategories.map(c => (
                    <option key={c} value={c}>{c} ({report.warnings.filter(w => getWarningCategory(w.message) === c).length})</option>
                  ))}
                </select>
              )}
            </div>
            {filteredWarnings.map((warn, idx) => (
              <Link 
                href={warn.actionUrl || (warn.lessonId ? `/lessons/${warn.lessonId}${warn.itemId ? `#${warn.itemId}` : ''}` : '#')} 
                key={`warn-${idx}`} 
                className="block text-[12px] text-slate-600 border-l-[2px] border-amber-500 pl-3 mb-3 py-1 hover:bg-slate-50 transition-colors"
                title="Cliquer pour corriger"
              >
                <strong className="text-amber-700">{warn.lessonId || 'Global'} {warn.itemId && `(${warn.itemId})`}:</strong> {warn.message}
              </Link>
            ))}
          </div>
        )}

        {report.isValid && report.warnings.length === 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-[11px] text-green-800 font-bold mb-1">SUCCÈS</div>
            <div className="text-[12px] text-green-800">
              Toutes les dépendances d'ID sont valides. Aucun mot fantôme détecté. La leçon est valide.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
