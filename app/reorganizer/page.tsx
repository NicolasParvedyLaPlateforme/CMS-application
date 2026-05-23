import CourseReorganizerTool from "@/components/CourseReorganizerTool";

export default function ReorganizerPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Réorganisation du Cours (Assistant IA)
        </h1>
        <p className="text-slate-500 mt-2">
          Réorganisez automatiquement la structure des leçons avec l'IA.
        </p>
      </div>
      
      <CourseReorganizerTool />
    </div>
  );
}
