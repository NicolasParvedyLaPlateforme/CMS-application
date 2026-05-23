import LessonMetaTool from "@/components/LessonMetaTool";

export default function MetadataPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Assistant Métadonnées (Titres & Descriptions)
        </h1>
        <p className="text-slate-500 mt-2">
          Générez ou complétez automatiquement les titres et descriptions (Fr/En).
        </p>
      </div>
      
      <LessonMetaTool />
    </div>
  );
}
