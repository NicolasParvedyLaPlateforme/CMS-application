import React, { useState, useMemo } from "react";
import { Copy, Check, Save, RotateCcw, AlertCircle } from "lucide-react";

interface AICheckerBlockProps {
  item: any;
  originalItem: any | null;
  hasUpdated: boolean;
  onUpdate: (newItem: any) => void;
  onCancel: () => void;
  onRevert: () => void;
  type: "word" | "phrase";
}

export default function AICheckerBlock({
  item,
  originalItem,
  hasUpdated,
  onUpdate,
  onCancel,
  onRevert,
  type,
}: AICheckerBlockProps) {
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const prompt = useMemo(() => {
    return `Tu es un expert en enseignement de la langue thaï pour les francophones.
Vérifie, corrige et complète les informations de ce ${type === "word" ? "mot" : "texte"} suivant.
Vérifie particulièrement le sens, les traductions (en et fr) et la prononciation phonétique.

POUR LA PHONÉTIQUE (phonetic): 
1. Utilise un système de transcription qui distingue la longueur des voyelles (ex: 'a' vs 'aa').
2. Indique toujours les tons avec les accents standards: 
   - mid: pas d'accent (a)
   - low: accent grave (à)
   - falling: accent circonflexe (â)
   - high: accent aigu (á)
   - rising: caron (ǎ).
3. Règles d'espacement : ESPACE entre les mots, TIRET entre les syllabes d'un même mot. (ex: hâa naa-thii).

RENVOIE UNIQUEMENT L'OBJET JSON MIS À JOUR, sans texte supplémentaire, ni code markdown ou balises, juste l'accolade d'ouverture et de fermeture.

JSON actuel :
${JSON.stringify(item, null, 2)}`;
  }, [item, type]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleManualApply = () => {
    try {
      setError(null);
      let parsed;
      try {
        parsed = JSON.parse(jsonInput);
      } catch (e) {
        const match = jsonInput.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error("Impossible de trouver un JSON valide.");
        }
      }

      if (!parsed || !parsed.id || !parsed.th) {
        throw new Error("Structure JSON invalide (format inattendu).");
      }

      // Merge defaults securely
      onUpdate(parsed);
      setJsonInput("");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la lecture du JSON.");
    }
  };

  return (
    <div className="bg-slate-100 p-4 border-t border-slate-200 text-sm overflow-hidden flex flex-col md:flex-row gap-4 relative">
      <div className="flex-1 flex flex-col">
        <label className="text-[11px] font-semibold text-slate-500 uppercase mb-2">
          1. Copier le prompt de vérification
        </label>
        <div className="relative">
          <textarea
            readOnly
            value={prompt}
            className="w-full h-32 border border-slate-300 rounded p-2 text-xs bg-slate-50 font-mono text-slate-600 resize-none outline-none"
          />
          <button
            onClick={handleCopyPrompt}
            className="absolute top-2 right-2 p-1.5 bg-white border border-slate-200 rounded shadow-sm hover:bg-slate-50 transition-colors"
            title="Copier"
          >
            {copied ? (
              <Check size={14} className="text-green-500" />
            ) : (
              <Copy size={14} className="text-slate-600" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <label className="text-[11px] font-semibold text-slate-500 uppercase mb-2">
          2. Coller la réponse IA
        </label>
        <div className="flex flex-col gap-2 relative">
          <textarea
            placeholder="{... JSON corrigé ...}"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-24 border border-slate-300 rounded p-2 text-xs font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
          />
          {error && (
            <div className="text-[10px] text-red-600 bg-red-50 p-1.5 rounded border border-red-100 flex items-start gap-1">
              <AlertCircle size={12} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualApply}
              disabled={!jsonInput.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded font-semibold text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
            >
              <Save size={14} /> Coller pour mettre à jour
            </button>
            {hasUpdated && (
              <button
                onClick={onRevert}
                className="bg-amber-100 hover:bg-amber-200 text-amber-700 py-1.5 px-3 rounded font-semibold text-xs flex items-center justify-center gap-1 transition-colors border border-amber-300"
                title="Annuler les modifications IA et revenir en arrière"
              >
                <RotateCcw size={14} /> Retour
              </button>
            )}
          </div>
        </div>
      </div>
      
      <button 
        onClick={onCancel}
        className="absolute top-2 right-2 text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
      >
        FERMER
      </button>
    </div>
  );
}
