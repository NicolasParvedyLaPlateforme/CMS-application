import { CourseProvider } from "@/contexts/CourseContext";
import { Sidebar } from "@/components/Sidebar";
import { ValidationPanel } from "@/components/ValidationPanel";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <CourseProvider>
      <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full border-r border-slate-200 overflow-y-auto p-6 md:p-8 relative">
          {children}
        </main>
        <aside className="w-[300px] shrink-0 bg-white border-l border-slate-200 h-full overflow-hidden flex flex-col hidden xl:flex">
          <ValidationPanel standalone={false} />
        </aside>
      </div>
    </CourseProvider>
  );
}
