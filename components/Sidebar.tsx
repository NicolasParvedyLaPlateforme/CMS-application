"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, AlertTriangle, Download, Trash2, Save, Loader2, RefreshCcw, Type, FileText } from "lucide-react";
import { useCourse } from "@/contexts/CourseContext";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const { report, exportCourse, resetCourse, saveStatus, course } = useCourse();
  const [confirmReset, setConfirmReset] = useState(false);

  const errCount = report.errors.length;
  const warnCount = report.warnings.length;

  return (
    <aside className="w-[240px] bg-slate-900 text-slate-50 flex flex-col shrink-0 h-screen overflow-y-auto">
      <div className="p-6 font-bold text-[18px] tracking-tight whitespace-nowrap">
        THAI<span className="text-blue-500">COURSE</span> CMS
      </div>

      <nav className="flex-1 flex flex-col">
        <Link 
          href="/" 
          className={`px-5 py-3 text-sm flex items-center transition-colors ${pathname === '/' ? 'bg-blue-500 text-white' : 'hover:bg-slate-800'}`}
        >
          <LayoutDashboard size={18} className="mr-3" />
          Tableau de Bord
        </Link>
        
        <Link 
          href="/lessons" 
          className={`px-5 py-3 text-sm flex items-center transition-colors ${pathname.startsWith('/lessons') ? 'bg-blue-500 text-white' : 'hover:bg-slate-800'}`}
        >
          <BookOpen size={18} className="mr-3" />
          Éditeur de Leçons
        </Link>
        
        <div className="mt-4 mb-2 px-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Outils IA
        </div>

        <Link 
          href="/reorganizer" 
          className={`px-5 py-3 text-sm flex items-center transition-colors ${pathname.startsWith('/reorganizer') ? 'bg-blue-500 text-white' : 'hover:bg-slate-800'}`}
        >
          <RefreshCcw size={18} className="mr-3" />
          Réorganisation
        </Link>

        <Link 
          href="/metadata" 
          className={`px-5 py-3 text-sm flex items-center transition-colors ${pathname.startsWith('/metadata') ? 'bg-blue-500 text-white' : 'hover:bg-slate-800'}`}
        >
          <FileText size={18} className="mr-3" />
          Métadonnées
        </Link>

        <Link 
          href="/phonetics" 
          className={`px-5 py-3 text-sm flex items-center transition-colors ${pathname.startsWith('/phonetics') ? 'bg-blue-500 text-white' : 'hover:bg-slate-800'}`}
        >
          <Type size={18} className="mr-3" />
          Phonétique
        </Link>
      </nav>

      {/* Validation Status Indicator */}
      <div className="p-5 border-t border-slate-800">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2"><AlertTriangle size={14} /> System Status</div>
          
          {saveStatus === 'saving' && <div className="text-[10px] text-slate-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> saving</div>}
          {saveStatus === 'saved' && <div className="text-[10px] text-green-500 flex items-center gap-1"><Save size={10} /> saved</div>}
        </div>
        
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center text-sm">
            <span>Errors</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${errCount > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-800 text-slate-400'}`}>
              {errCount}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span>Warnings</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${warnCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-800 text-slate-400'}`}>
              {warnCount}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={exportCourse}
            disabled={course.lessons.length === 0}
            className={`w-full py-2.5 px-4 rounded font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors ${course.lessons.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
          >
            <Download size={14} /> Exporter JSON
          </button>

          {confirmReset ? (
            <div className="flex flex-col gap-2 p-2 rounded border border-red-900 bg-red-950/30">
              <span className="text-xs text-red-400 font-semibold text-center">Toutes vos données seront supprimées.</span>
              <div className="flex gap-2">
                <button onClick={() => { resetCourse(); setConfirmReset(false); }} className="flex-1 py-1 px-2 rounded bg-red-600 text-white font-semibold text-xs transition-colors hover:bg-red-500">Confirmer</button>
                <button onClick={() => setConfirmReset(false)} className="flex-1 py-1 px-2 rounded bg-slate-800 text-slate-300 font-semibold text-xs transition-colors hover:bg-slate-700">Annuler</button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setConfirmReset(true)}
              className="w-full py-2 px-4 rounded border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-900 hover:bg-red-950/30 font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 size={14} /> Tout effacer
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
