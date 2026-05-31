"use client";

import React, { useState, useEffect, useRef } from "react";
import { Quest, QuestsData } from "@/types/quests";
import { Loader2, Save, Upload, Download, Plus, Trash2, Edit } from "lucide-react";

const defaultQuests: QuestsData = { learn: [], alphabet: [] };

export function QuestsClient() {
  const [questsData, setQuestsData] = useState<QuestsData>(defaultQuests);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("learn");
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("th-quests-draft");
    if (saved) {
      try {
        setQuestsData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse quests draft", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Debounced auto-save
  useEffect(() => {
    if (!isLoaded) return;
    setSaveStatus("saving");
    const timer = setTimeout(() => {
      localStorage.setItem("th-quests-draft", JSON.stringify(questsData));
      setSaveStatus("saved");
      const hideTimer = setTimeout(() => setSaveStatus("idle"), 3000);
      return () => clearTimeout(hideTimer);
    }, 3000);
    return () => clearTimeout(timer);
  }, [questsData, isLoaded]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string) as QuestsData;
        if (!importedData.learn) importedData.learn = [];
        if (!importedData.alphabet) importedData.alphabet = [];
        setQuestsData(importedData);
        setSelectedQuestId(null);
      } catch (error) {
        console.error("Failed to parse quests file", error);
        alert("Erreur lors de l'importation du fichier.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questsData, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "quests.json");
    dlAnchorElem.click();
  };

  // Find the selected quest across all categories
  let selectedQuest: Quest | null = null;
  let selectedQuestCategory: string | null = null;
  
  if (selectedQuestId) {
    for (const [category, quests] of Object.entries(questsData)) {
      const q = quests.find(q => q.id === selectedQuestId);
      if (q) {
        selectedQuest = q;
        selectedQuestCategory = category;
        break;
      }
    }
  }

  const updateSelectedQuest = (field: keyof Quest, value: any) => {
    if (!selectedQuestCategory || !selectedQuestId) return;
    
    setQuestsData(prev => {
      const updatedCategory = prev[selectedQuestCategory as string].map(q => 
        q.id === selectedQuestId ? { ...q, [field]: value } : q
      );
      return { ...prev, [selectedQuestCategory as string]: updatedCategory };
    });
  };

  const handleAddQuest = (category: string) => {
    const prefix = category === "learn" ? "l_" : "a_";
    const newQuest: Quest = {
      // eslint-disable-next-line react-hooks/purity
      id: `${prefix}quest_${Date.now()}`,
      type: "lessons",
      target: 1,
      rewardXp: 10,
      titleEn: "New Quest",
      titleFr: "Nouvelle quête",
    };
    
    setQuestsData(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), newQuest]
    }));
    setSelectedQuestId(newQuest.id);
  };

  const handleDeleteQuest = (id: string, category: string) => {
    setQuestsData(prev => ({
      ...prev,
      [category]: prev[category].filter(q => q.id !== id)
    }));
    if (selectedQuestId === id) setSelectedQuestId(null);
  };

  if (!isLoaded) return <div className="p-8"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="flex h-full -mx-6 md:-mx-8 -my-6 md:-my-8 bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-[300px] bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-200 sticky top-0 bg-white z-10 flex flex-col gap-3">
          <h2 className="font-bold text-lg">Quêtes</h2>
          <div className="flex gap-2">
            <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleImport} />
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-colors">
              <Upload size={14} /> Importer
            </button>
            <button onClick={handleExport} className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-colors">
              <Download size={14} /> Exporter
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {Object.entries(questsData).map(([category, quests]) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{category === 'learn' ? 'Parcours (Learn)' : 'Alphabet'}</h3>
                <button 
                  onClick={() => handleAddQuest(category)}
                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title={`Ajouter une quête à ${category}`}
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="space-y-1">
                {quests.map(quest => (
                  <div 
                    key={quest.id}
                    onClick={() => setSelectedQuestId(quest.id)}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors flex justify-between items-center group ${selectedQuestId === quest.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-slate-100'}`}
                  >
                    <div className="truncate pr-2">
                      <div className={`text-sm font-semibold ${selectedQuestId === quest.id ? 'text-blue-900' : 'text-slate-800'} truncate`}>{quest.titleFr}</div>
                      <div className="text-xs text-slate-500 truncate">{quest.id}</div>
                    </div>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteQuest(quest.id, category); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {quests.length === 0 && (
                  <div className="text-xs text-slate-400 py-2 text-center border border-dashed border-slate-200 rounded">
                    Aucune quête
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="p-6 max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Éditeur de Quête</h1>
            <div className="flex items-center gap-2 text-sm font-medium">
              {saveStatus === 'saving' && <span className="text-slate-500 flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Sauvegarde...</span>}
              {saveStatus === 'saved' && <span className="text-green-600 flex items-center gap-1"><Save size={14} /> Sauvegardé</span>}
            </div>
          </div>

          {selectedQuest ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-semibold uppercase tracking-wider">
                  Catégorie : {selectedQuestCategory}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">ID de la quête</label>
                  <input 
                    type="text" 
                    value={selectedQuest.id || ''} 
                    onChange={(e) => updateSelectedQuest('id', e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Type d'objectif</label>
                  <select 
                    value={selectedQuest.type || ''} 
                    onChange={(e) => updateSelectedQuest('type', e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800"
                  >
                    <option value="lessons">Leçons complétées</option>
                    <option value="xp">XP gagné</option>
                    <option value="perfect_lesson">Niveau(x) parfait(s)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Cible (Target)</label>
                  <input 
                    type="number" 
                    value={selectedQuest.target || 0} 
                    onChange={(e) => updateSelectedQuest('target', parseInt(e.target.value, 10))}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Récompense (XP)</label>
                  <input 
                    type="number" 
                    value={selectedQuest.rewardXp || 0} 
                    onChange={(e) => updateSelectedQuest('rewardXp', parseInt(e.target.value, 10))}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800"
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Titre (FR)</label>
                  <input 
                    type="text" 
                    value={selectedQuest.titleFr || ''} 
                    onChange={(e) => updateSelectedQuest('titleFr', e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Titre (EN)</label>
                  <input 
                    type="text" 
                    value={selectedQuest.titleEn || ''} 
                    onChange={(e) => updateSelectedQuest('titleEn', e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 border border-slate-200 border-dashed rounded-xl p-12 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center flex-1">
              <Edit className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-lg font-medium">Sélectionnez une quête pour l'éditer</p>
              <p className="text-sm mt-1">Vous pouvez aussi en ajouter une ou importer un fichier quests.json.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
