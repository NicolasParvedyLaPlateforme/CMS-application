"use client";

import { useCourse } from "@/contexts/CourseContext";
import { FileJson, Target, Layers, AlignLeft } from "lucide-react";
import { ValidationPanel } from "@/components/ValidationPanel";

export function Dashboard() {
  const { course } = useCourse();

  const stats = {
    lessons: course.lessons.length,
    words: course.lessons.reduce((acc, l) => acc + l.words.length, 0),
    phrases: course.lessons.reduce((acc, l) => acc + l.phrases.length, 0),
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Course Dashboard</h1>
        <p className="text-slate-500 mt-2">Overview of the current loaded course data.</p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col shadow-sm">
          <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Layers size={20} />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.lessons}</p>
          <p className="text-sm text-slate-500 font-medium">Total Lessons</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col shadow-sm">
          <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
            <Target size={20} />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.words}</p>
          <p className="text-sm text-slate-500 font-medium">Total Words</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col shadow-sm">
          <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
            <AlignLeft size={20} />
          </div>
          <p className="text-3xl font-bold text-slate-900">{stats.phrases}</p>
          <p className="text-sm text-slate-500 font-medium">Total Phrases</p>
        </div>
      </div>

      <div className="bg-white border text-center border-slate-200 border-dashed rounded-xl p-8 shadow-sm">
        <FileJson size={48} className="mx-auto text-slate-300 mb-4" />
        <h2 className="text-lg font-bold text-slate-800">Course Data Import / Export</h2>
        <p className="text-slate-500 text-sm mt-2 max-w-lg mx-auto">Upload an existing <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-indigo-600">course.json</code> to start editing, or export the current valid build.</p>
        <div className="flex justify-center mt-6 gap-3">
          <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Upload JSON
            <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4">Real-time Validation Report</h2>
        <ValidationPanel />
      </div>
    </div>
  );

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
     const file = e.target.files?.[0];
     if (!file) return;

     const reader = new FileReader();
     reader.onload = (ev) => {
        try {
           const json = JSON.parse(ev.target?.result as string);
           // Simple crude check
           if (json.lessons && Array.isArray(json.lessons)) {
             // Let process course in next iteration, for now just use context
           }
        } catch (error) {
           alert("Invalid JSON file");
        }
     };
     reader.readAsText(file);
  }
}
