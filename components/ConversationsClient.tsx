"use client";

import React, { useState, useEffect, useRef } from "react";
import { Conversation, Dialog } from "@/types/course";
import { Loader2, Save, Upload, Download, Plus, Trash2, Edit, GripVertical } from "lucide-react";

export function ConversationsClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("th-conversations-draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setConversations(parsed);
        } else {
          console.warn("Saved data is not an array, resetting options.");
          setConversations([]);
        }
      } catch (e) {
        console.error("Failed to parse conversations draft", e);
        setConversations([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // Debounced auto-save
  useEffect(() => {
    if (!isLoaded) return;
    setSaveStatus("saving");
    const timer = setTimeout(() => {
      localStorage.setItem("th-conversations-draft", JSON.stringify(conversations));
      setSaveStatus("saved");
      const hideTimer = setTimeout(() => setSaveStatus("idle"), 3000);
      return () => clearTimeout(hideTimer);
    }, 3000);
    return () => clearTimeout(timer);
  }, [conversations, isLoaded]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setConversations(imported);
        } else if (imported && typeof imported === 'object' && Array.isArray(imported.conversations)) {
          setConversations(imported.conversations);
        } else if (imported && typeof imported === 'object' && imported.id && Array.isArray(imported.dialogs)) {
          // Si c'est une seule conversation (objet)
          setConversations(prev => {
            const exists = prev.some(c => c.id === imported.id);
            if (exists) {
              return prev.map(c => c.id === imported.id ? imported as Conversation : c);
            }
            return [...prev, imported as Conversation];
          });
        } else {
          console.error("Le fichier importé n'est pas un format de conversation valide.");
        }
      } catch (error) {
        console.error("Failed to parse file", error);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset file input
  };

  const handleExport = () => {
    const exportData = { conversations: conversations };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "conversations.json");
    dlAnchorElem.click();
  };

  const selectedConv = conversations.find(c => c.id === selectedConvId);

  const updateSelectedConv = (field: keyof Conversation, value: any) => {
    setConversations(prev => prev.map(c => c.id === selectedConvId ? { ...c, [field]: value } : c));
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAddConversation = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      unitId: "",
      title: "Nouvelle Conversation",
      titleEn: "New Conversation",
      level: 1,
      dialogs: []
    };
    setConversations([...conversations, newConv]);
    setSelectedConvId(newConv.id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (selectedConvId === id) setSelectedConvId(null);
    setConfirmDeleteId(null);
  };

  const addDialog = () => {
    if (!selectedConv) return;
    const newDialog: Dialog = { speaker: "A", th: "", phonetic: "", fr: "", en: "" };
    updateSelectedConv("dialogs", [...selectedConv.dialogs, newDialog]);
  };

  const updateDialog = (index: number, field: keyof Dialog, value: string) => {
    if (!selectedConv) return;
    const newDialogs = [...selectedConv.dialogs];
    newDialogs[index] = { ...newDialogs[index], [field]: value };
    updateSelectedConv("dialogs", newDialogs);
  };

  const deleteDialog = (index: number) => {
    if (!selectedConv) return;
    const newDialogs = selectedConv.dialogs.filter((_, i) => i !== index);
    updateSelectedConv("dialogs", newDialogs);
  };

  const [draggedDialogIndex, setDraggedDialogIndex] = useState<number | null>(null);
  const [dragOverDialogIndex, setDragOverDialogIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedDialogIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverDialogIndex !== index) {
      setDragOverDialogIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedDialogIndex(null);
    setDragOverDialogIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedDialogIndex === null) return;
    if (draggedDialogIndex !== index && selectedConv) {
      const newDialogs = [...selectedConv.dialogs];
      const draggedItem = newDialogs.splice(draggedDialogIndex, 1)[0];
      newDialogs.splice(index, 0, draggedItem);
      updateSelectedConv("dialogs", newDialogs);
    }
    setDraggedDialogIndex(null);
    setDragOverDialogIndex(null);
  };

  if (!isLoaded) return <div className="p-8"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="flex h-full -mx-6 md:-mx-8 -my-6 md:-my-8 bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-[300px] bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-slate-200 sticky top-0 bg-white z-10 flex flex-col gap-3">
          <h2 className="font-bold text-lg">Conversations</h2>
          <div className="flex gap-2">
            <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={handleImport} />
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-colors">
              <Upload size={14} /> Importer
            </button>
            <button onClick={handleExport} className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-colors">
              <Download size={14} /> Exporter
            </button>
          </div>
          <button onClick={handleAddConversation} className="py-2 w-full bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
            <Plus size={16} /> Nouvelle
          </button>
        </div>

        <div className="p-2 space-y-1">
          {conversations.map(conv => (
            <div 
              key={conv.id}
              onClick={() => setSelectedConvId(conv.id)}
              className={`p-3 rounded-lg cursor-pointer border transition-colors flex justify-between items-start group ${selectedConvId === conv.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-slate-100'}`}
            >
              <div className="truncate pr-2">
                <div className={`text-sm font-semibold ${selectedConvId === conv.id ? 'text-blue-900' : 'text-slate-800'} truncate`}>{conv.title}</div>
                <div className="text-xs text-slate-500 truncate mt-0.5">{conv.dialogs.length} dialogs • Unit: {conv.unitId || '?'}</div>
              </div>
              
              {confirmDeleteId === conv.id ? (
                <div className="flex flex-col gap-1 items-end shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] text-red-500 font-bold uppercase">Sûr ?</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleDeleteConversation(conv.id)} className="p-1 min-w-[28px] bg-red-500 hover:bg-red-600 text-white rounded font-bold text-xs">Oui</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs">Non</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-sm text-slate-500 text-center py-8">Aucune conversation.</div>
          )}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="p-6 max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Éditeur de Conversation</h1>
            <div className="flex items-center gap-2 text-sm font-medium">
              {saveStatus === 'saving' && <span className="text-slate-500 flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Sauvegarde...</span>}
              {saveStatus === 'saved' && <span className="text-green-600 flex items-center gap-1"><Save size={14} /> Sauvegardé</span>}
            </div>
          </div>

          {selectedConv ? (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">ID de la conversation</label>
                    <input 
                      type="text" 
                      value={selectedConv.id} 
                      onChange={(e) => updateSelectedConv('id', e.target.value)}
                      className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">ID de l'unité (unitId)</label>
                    <input 
                      type="text" 
                      value={selectedConv.unitId} 
                      onChange={(e) => updateSelectedConv('unitId', e.target.value)}
                      className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Niveau (level)</label>
                    <input 
                      type="number" 
                      value={selectedConv.level} 
                      onChange={(e) => updateSelectedConv('level', parseInt(e.target.value) || 1)}
                      className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Titre (FR)</label>
                    <input 
                      type="text" 
                      value={selectedConv.title} 
                      onChange={(e) => updateSelectedConv('title', e.target.value)}
                      className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Titre (EN)</label>
                    <input 
                      type="text" 
                      value={selectedConv.titleEn} 
                      onChange={(e) => updateSelectedConv('titleEn', e.target.value)}
                      className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dialogs List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-800">Dialogues ({selectedConv.dialogs.length})</h2>
                  <button 
                    onClick={addDialog}
                    className="py-1.5 px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus size={16} /> Ajouter une réplique
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedConv.dialogs.map((dialog, index) => (
                    <div 
                      key={index} 
                      className={`bg-white border text-sm border-slate-200 rounded-xl p-4 shadow-sm flex gap-4 group transition-all ${draggedDialogIndex === index ? 'opacity-50' : ''} ${dragOverDialogIndex === index ? 'border-t-2 border-t-blue-500' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className="flex flex-col items-center justify-start gap-1 text-slate-300">
                        <div className="p-1 cursor-grab active:cursor-grabbing hover:bg-slate-100 hover:text-slate-600 rounded">
                          <GripVertical size={16} />
                        </div>
                        <span className="text-[10px] font-medium text-slate-400">{index + 1}</span>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-4">
                          <div className="w-16">
                            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Speaker</label>
                            <input 
                              type="text"
                              value={dialog.speaker}
                              onChange={(e) => updateDialog(index, 'speaker', e.target.value)}
                              className="w-full p-2 text-center font-bold bg-slate-100 border border-slate-200 rounded outline-none focus:border-blue-500 focus:bg-white"
                              placeholder="A/B..."
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase text-blue-500 mb-1 block">Thai</label>
                            <input 
                              type="text"
                              value={dialog.th}
                              onChange={(e) => updateDialog(index, 'th', e.target.value)}
                              className="w-full p-2 bg-blue-50 text-blue-900 border border-blue-100 rounded outline-none focus:border-blue-400"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase text-amber-600 mb-1 block">Phonetic</label>
                            <input 
                              type="text"
                              value={dialog.phonetic}
                              onChange={(e) => updateDialog(index, 'phonetic', e.target.value)}
                              className="w-full p-2 bg-amber-50 text-amber-900 border border-amber-100 rounded outline-none focus:border-amber-400 font-mono text-xs"
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-4">
                          <div className="w-16"></div> {/* Spacer for alignment */}
                          <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Français</label>
                            <input 
                              type="text"
                              value={dialog.fr}
                              onChange={(e) => updateDialog(index, 'fr', e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded outline-none focus:border-slate-400"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">English</label>
                            <input 
                              type="text"
                              value={dialog.en}
                              onChange={(e) => updateDialog(index, 'en', e.target.value)}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded outline-none focus:border-slate-400"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-start">
                        <button 
                          onClick={() => deleteDialog(index)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                          title="Supprimer la réplique"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {selectedConv.dialogs.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                      <p className="text-slate-500">Aucune réplique dans cette conversation.</p>
                      <button 
                        onClick={addDialog}
                        className="mt-3 py-1.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-sm font-semibold transition-colors shadow-sm"
                      >
                        Ajouter la première réplique
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 border border-slate-200 border-dashed rounded-xl p-12 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center flex-1">
              <Edit className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-lg font-medium">Sélectionnez une conversation pour l'éditer</p>
              <p className="text-sm mt-1">Vous pouvez aussi en créer une nouvelle ou importer un fichier JSON.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
