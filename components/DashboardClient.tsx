"use client";

import { useCourse } from "@/contexts/CourseContext";
import { FileJson, Target, Layers, AlignLeft, Download } from "lucide-react";
import { ValidationPanel } from "@/components/ValidationPanel";

export default function DashboardClient() {
  const { course, setCourse, report, exportCourse } = useCourse();

  const stats = {
    lessons: course.lessons.length,
    words: course.lessons.reduce((acc, l) => acc + l.words.length, 0),
    phrases: course.lessons.reduce((acc, l) => acc + l.phrases.length, 0),
  };

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
     const file = e.target.files?.[0];
     if (!file) return;

     const reader = new FileReader();
     reader.onload = (ev) => {
        try {
           const json = JSON.parse(ev.target?.result as string);
           if (json.lessons && Array.isArray(json.lessons)) {
              setCourse(json);
           } else if (json.id && json.title) {
              // Wrap single lesson in course array if mistakenly just uploaded a lesson object
              setCourse({ lessons: [json] });
           } else {
             alert("Does not seem to be a valid course JSON");
           }
        } catch (error) {
           alert("Invalid JSON file");
        }
     };
     reader.readAsText(file);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Course Dashboard</h1>
        <p className="text-slate-500 mt-2">Overview of the current loaded course data.</p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex-1 p-3 bg-slate-100 rounded-md border border-slate-200">
          <div className="text-[11px] uppercase text-slate-500 font-semibold mb-1 flex items-center gap-2">
            <Layers size={14} /> Total Lessons
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats.lessons}</div>
        </div>
        
        <div className="flex-1 p-3 bg-slate-100 rounded-md border border-slate-200">
          <div className="text-[11px] uppercase text-slate-500 font-semibold mb-1 flex items-center gap-2">
            <Target size={14} /> Total Words
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats.words}</div>
        </div>

        <div className="flex-1 p-3 bg-slate-100 rounded-md border border-slate-200">
          <div className="text-[11px] uppercase text-slate-500 font-semibold mb-1 flex items-center gap-2">
            <AlignLeft size={14} /> Total Phrases
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats.phrases}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm text-center">
        <FileJson size={40} className="mx-auto text-blue-500 mb-3" />
        <h2 className="text-[14px] font-bold text-slate-800">Course Data Import / Export</h2>
        <p className="text-slate-500 text-[12px] mt-1 max-w-lg mx-auto">Upload an existing <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">course.json</code> to start editing, or export the current valid build.</p>
        <div className="flex justify-center mt-4 gap-2">
          <label className="cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-md text-[13px] font-semibold transition-colors">
            Import JSON
            <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
          </label>
          <button 
            onClick={exportCourse}
            disabled={course.lessons.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-semibold transition-colors border ${course.lessons.length > 0 ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            <Download size={14} /> Exporter JSON
          </button>
        </div>
      </div>

      <div className="xl:hidden">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4">Real-time Validation Report</h2>
        <ValidationPanel standalone={true} />
      </div>
    </div>
  );
}
