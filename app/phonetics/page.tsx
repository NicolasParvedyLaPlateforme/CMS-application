import BatchPhoneticTool from "@/components/BatchPhoneticTool";

export default function PhoneticsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Générateur de Phonétique en Masse
        </h1>
        <p className="text-slate-500 mt-2">
          Générez la phonétique manquante pour les mots et phrases via l'IA.
        </p>
      </div>
      
      <BatchPhoneticTool />
    </div>
  );
}
