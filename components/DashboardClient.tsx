"use client";

import Link from "next/link";
import { useCourse } from "@/contexts/CourseContext";
import {
  FileJson,
  Target,
  Layers,
  AlignLeft,
  Download,
  History,
  RotateCcw,
} from "lucide-react";
import { ValidationPanel } from "@/components/ValidationPanel";
import BatchPhoneticTool from "@/components/BatchPhoneticTool";
import CourseReorganizerTool from "@/components/CourseReorganizerTool";

export default function DashboardClient() {
  const {
    course,
    setCourse,
    report,
    exportCourse,
    history,
    undo,
    restoreToHistory,
  } = useCourse();

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
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Course Dashboard
        </h1>
        <p className="text-slate-500 mt-2">
          Overview of the current loaded course data.
        </p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex-1 p-3 bg-slate-100 rounded-md border border-slate-200">
          <div className="text-[11px] uppercase text-slate-500 font-semibold mb-1 flex items-center gap-2">
            <Layers size={14} /> Total Lessons
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {stats.lessons}
          </div>
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
          <div className="text-2xl font-bold text-slate-800">
            {stats.phrases}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm text-center">
        <FileJson size={40} className="mx-auto text-blue-500 mb-3" />
        <h2 className="text-[14px] font-bold text-slate-800">
          Course Data Import / Export
        </h2>
        <p className="text-slate-500 text-[12px] mt-1 max-w-lg mx-auto">
          Upload an existing{" "}
          <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">
            course.json
          </code>{" "}
          to start editing, or export the current valid build.
        </p>
        <div className="flex justify-center mt-4 gap-2">
          <label className="cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-md text-[13px] font-semibold transition-colors">
            Import JSON
            <input
              type="file"
              className="hidden"
              accept=".json"
              onChange={handleFileUpload}
            />
          </label>
          <button
            onClick={exportCourse}
            disabled={course.lessons.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-semibold transition-colors border ${course.lessons.length > 0 ? "bg-slate-900 border-slate-900 text-white hover:bg-slate-800" : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"}`}
          >
            <Download size={14} /> Exporter JSON
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History size={16} className="text-slate-500" />
            <h2 className="text-[14px] font-bold text-slate-800">
              Historique des modifications
            </h2>
          </div>
          <button
            onClick={undo}
            disabled={history.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors border ${history.length > 0 ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50" : "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"}`}
            title="Annuler la dernière action"
          >
            <RotateCcw size={14} /> Rétablir
          </button>
        </div>
        <div className="p-4 max-h-[250px] overflow-y-auto bg-slate-50/50">
          {history.length === 0 ? (
            <p className="text-[13px] text-slate-500 text-center py-4">
              Aucun historique disponible.
            </p>
          ) : (
            <div className="space-y-2">
              {[...history].reverse().map((entry, idx) => {
                const originalIndex = history.length - 1 - idx;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded border bg-white border-slate-200 shadow-sm hover:border-blue-300 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]" : "bg-slate-300"}`}
                      ></span>
                      <div className="flex flex-col">
                        {entry.lessonId ? (
                          <Link
                            href={`/lessons/${entry.lessonId}${entry.targetId ? `#${entry.targetId}` : ""}`}
                            className={`text-[13px] hover:underline ${idx === 0 ? "font-semibold text-blue-600" : "text-blue-500"}`}
                            title="Voir la modification"
                          >
                            {entry.description}
                          </Link>
                        ) : (
                          <span
                            className={`text-[13px] ${idx === 0 ? "font-semibold text-slate-800" : "text-slate-600"}`}
                          >
                            {entry.description}
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => restoreToHistory(originalIndex)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-semibold transition-all"
                      title="Rétablir à cet état"
                    >
                      <RotateCcw size={12} /> Rétablir
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CourseReorganizerTool />
      
      <BatchPhoneticTool />

      <div className="xl:hidden">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-4">
          Real-time Validation Report
        </h2>
        <ValidationPanel standalone={true} />
      </div>
    </div>
  );
}
