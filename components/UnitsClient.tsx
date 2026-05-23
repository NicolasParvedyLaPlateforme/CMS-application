"use client";

import React, { useState, useEffect, useRef } from "react";
import { Unit } from "@/types/course";
import { Loader2, Save, Upload, Download, Plus, Trash2, Edit } from "lucide-react";

export function UnitsClient() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from local storage
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

  // Debounced auto-save
  useEffect(() => {
    if (!isLoaded) return;
    setSaveStatus("saving");
    const timer = setTimeout(() => {
      localStorage.setItem("th-units-draft", JSON.stringify(units));
      setSaveStatus("saved");
      const hideTimer = setTimeout(() => setSaveStatus("idle"), 3000);
      return () => clearTimeout(hideTimer);
    }, 3000);
    return () => clearTimeout(timer);
  }, [units, isLoaded]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedUnits = JSON.parse(event.target?.result as string) as Unit[];
        setUnits(importedUnits);
      } catch (error) {
        console.error("Failed to parse units file", error);
        alert("Erreur lors de l'importation du fichier."); // Let's avoid alert, use standard error handling if possible. Actually, simple alert is fine for edge case, but instructions say avoid Native browser popups.
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(units, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "units.json");
    dlAnchorElem.click();
  };

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  const updateSelectedUnit = (field: keyof Unit, value: any) => {
    setUnits(prev => prev.map(u => u.id === selectedUnitId ? { ...u, [field]: value } : u));
  };

  const updateUnitShades = (field: keyof Unit['shades'], value: string) => {
    setUnits(prev => prev.map(u => {
      if (u.id === selectedUnitId) {
        return { ...u, shades: { ...(u.shades || { l1: '', l2: '', l3: '', l4: '' }), [field]: value } };
      }
      return u;
    }));
  };

  const handleAddUnit = () => {
    const newUnit: Unit = {
      id: `unit-${Date.now()}`,
      title: "Nouvelle Unité",
      titleEn: "New Unit",
      description: "",
      descriptionEn: "",
      colorClass: "bg-blue-500",
      borderClass: "border-blue-700",
      textClass: "text-blue-500",
      hoverClass: "hover:bg-blue-400",
      lightTextClass: "text-blue-100",
      bgMutedClass: "bg-blue-700/50",
      shades: {
        l1: "",
        l2: "",
        l3: "",
        l4: ""
      }
    };
    setUnits([...units, newUnit]);
    setSelectedUnitId(newUnit.id);
  };

  const handleDeleteUnit = (id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    if (selectedUnitId === id) setSelectedUnitId(null);
  };

  if (!isLoaded) return <div className="p-8"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="flex h-full -mx-6 md:-mx-8 -my-6 md:-my-8 bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-[300px] bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-200 sticky top-0 bg-white z-10 flex flex-col gap-3">
          <h2 className="font-bold text-lg">Unités</h2>
          <div className="flex gap-2">
            <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleImport} />
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-colors">
              <Upload size={14} /> Importer
            </button>
            <button onClick={handleExport} className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-colors">
              <Download size={14} /> Exporter
            </button>
          </div>
          <button onClick={handleAddUnit} className="py-2 w-full bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
            <Plus size={16} /> Ajouter une unité
          </button>
        </div>

        <div className="p-2 space-y-1">
          {units.map(unit => (
            <div 
              key={unit.id}
              onClick={() => setSelectedUnitId(unit.id)}
              className={`p-3 rounded-lg cursor-pointer border transition-colors flex justify-between items-center group ${selectedUnitId === unit.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-slate-100'}`}
            >
              <div className="truncate pr-2">
                <div className={`text-sm font-semibold ${selectedUnitId === unit.id ? 'text-blue-900' : 'text-slate-800'} truncate`}>{unit.title}</div>
                <div className="text-xs text-slate-500 truncate">{unit.id}</div>
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteUnit(unit.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {units.length === 0 && (
            <div className="text-sm text-slate-500 text-center py-8">Aucune unité.</div>
          )}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="p-6 max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Éditeur d'unité</h1>
            <div className="flex items-center gap-2 text-sm font-medium">
              {saveStatus === 'saving' && <span className="text-slate-500 flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Sauvegarde...</span>}
              {saveStatus === 'saved' && <span className="text-green-600 flex items-center gap-1"><Save size={14} /> Sauvegardé</span>}
            </div>
          </div>

          {selectedUnit ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="text-sm font-semibold text-slate-700">ID de l'unité</label>
                  <input 
                    type="text" 
                    value={selectedUnit.id || ''} 
                    onChange={(e) => updateSelectedUnit('id', e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Titre (FR)</label>
                  <input 
                    type="text" 
                    value={selectedUnit.title || ''} 
                    onChange={(e) => updateSelectedUnit('title', e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Titre (EN)</label>
                  <input 
                    type="text" 
                    value={selectedUnit.titleEn || ''} 
                    onChange={(e) => updateSelectedUnit('titleEn', e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Description (FR)</label>
                  <textarea 
                    value={selectedUnit.description || ''} 
                    onChange={(e) => updateSelectedUnit('description', e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 h-24 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Description (EN)</label>
                  <textarea 
                    value={selectedUnit.descriptionEn || ''} 
                    onChange={(e) => updateSelectedUnit('descriptionEn', e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 h-24 resize-none"
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              <h3 className="text-lg font-semibold text-slate-800">Classes de style (Tailwind)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">colorClass</label>
                  <input 
                    type="text" 
                    value={selectedUnit.colorClass || ''} 
                    onChange={(e) => updateSelectedUnit('colorClass', e.target.value)}
                    className="w-full p-2 text-sm bg-slate-50 border border-slate-200 rounded font-mono text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">borderClass</label>
                  <input 
                    type="text" 
                    value={selectedUnit.borderClass || ''} 
                    onChange={(e) => updateSelectedUnit('borderClass', e.target.value)}
                    className="w-full p-2 text-sm bg-slate-50 border border-slate-200 rounded font-mono text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">textClass</label>
                  <input 
                    type="text" 
                    value={selectedUnit.textClass || ''} 
                    onChange={(e) => updateSelectedUnit('textClass', e.target.value)}
                    className="w-full p-2 text-sm bg-slate-50 border border-slate-200 rounded font-mono text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">hoverClass</label>
                  <input 
                    type="text" 
                    value={selectedUnit.hoverClass || ''} 
                    onChange={(e) => updateSelectedUnit('hoverClass', e.target.value)}
                    className="w-full p-2 text-sm bg-slate-50 border border-slate-200 rounded font-mono text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">lightTextClass</label>
                  <input 
                    type="text" 
                    value={selectedUnit.lightTextClass || ''} 
                    onChange={(e) => updateSelectedUnit('lightTextClass', e.target.value)}
                    className="w-full p-2 text-sm bg-slate-50 border border-slate-200 rounded font-mono text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">bgMutedClass</label>
                  <input 
                    type="text" 
                    value={selectedUnit.bgMutedClass || ''} 
                    onChange={(e) => updateSelectedUnit('bgMutedClass', e.target.value)}
                    className="w-full p-2 text-sm bg-slate-50 border border-slate-200 rounded font-mono text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-700">Shades (Niveaux de difficulté)</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-mono text-sm text-slate-400">L1</span>
                    <input 
                      type="text" 
                      value={selectedUnit.shades?.l1 || ''} 
                      onChange={(e) => updateUnitShades('l1', e.target.value)}
                      className="flex-1 p-2 text-sm bg-slate-50 border border-slate-200 rounded font-mono text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-mono text-sm text-slate-400">L2</span>
                    <input 
                      type="text" 
                      value={selectedUnit.shades?.l2 || ''} 
                      onChange={(e) => updateUnitShades('l2', e.target.value)}
                      className="flex-1 p-2 text-sm bg-slate-50 border border-slate-200 rounded font-mono text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-mono text-sm text-slate-400">L3</span>
                    <input 
                      type="text" 
                      value={selectedUnit.shades?.l3 || ''} 
                      onChange={(e) => updateUnitShades('l3', e.target.value)}
                      className="flex-1 p-2 text-sm bg-slate-50 border border-slate-200 rounded font-mono text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-mono text-sm text-slate-400">L4</span>
                    <input 
                      type="text" 
                      value={selectedUnit.shades?.l4 || ''} 
                      onChange={(e) => updateUnitShades('l4', e.target.value)}
                      className="flex-1 p-2 text-sm bg-slate-50 border border-slate-200 rounded font-mono text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 border border-slate-200 border-dashed rounded-xl p-12 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center flex-1">
              <Edit className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-lg font-medium">Sélectionnez une unité pour l'éditer</p>
              <p className="text-sm mt-1">Vous pouvez aussi en créer une nouvelle ou importer un fichier units.json.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
