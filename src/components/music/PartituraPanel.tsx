import { useEffect, useRef, useState } from "react";
import { Upload, ZoomIn, Trash2, ImageOff } from "lucide-react";
import { saveFile, getFile, deleteFile, getFileObjectURL, partituraKey,  } from "../../services/storageService";
import type { NivelPedagogico } from "../../types/music";

const SIZE_MAP: Record<NivelPedagogico, { h: string; label: string }> = {
  aprendiz:     { h: "h-44", label: "Apoio visual" },
  intermediario:{ h: "h-64", label: "Referência" },
  profissional: { h: "h-80", label: "Análise" },
};

interface PartituraPanelProps {
  louvorId: string;
  nivel: NivelPedagogico;
}

export default function PartituraPanel({ louvorId, nivel }: PartituraPanelProps) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const key = partituraKey(louvorId);
  const { h, label } = SIZE_MAP[nivel];

  useEffect(() => {
    (async () => {
      setLoading(true);
      const stored = await getFile(key);
      if (stored) {
        setImgUrl(getFileObjectURL(stored));
        setFileName(stored.name);
      }
      setLoading(false);
    })();
  }, [louvorId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await saveFile(key, file);
    const stored = await getFile(key);
    if (stored) {
      setImgUrl(getFileObjectURL(stored));
      setFileName(stored.name);
    }
  }

  async function handleDelete() {
    await deleteFile(key);
    setImgUrl(null);
    setFileName("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Partitura</span>
          <span className="text-[10px] text-slate-600 italic">{label}</span>
        </div>
        <div className="flex gap-1">
          {imgUrl && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                title="Expandir"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={handleDelete}
                className="text-slate-600 hover:text-red-400 transition-colors"
                title="Remover"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
          <button
            onClick={() => inputRef.current?.click()}
            className="text-slate-500 hover:text-gold transition-colors"
            title="Upload partitura"
          >
            <Upload size={14} />
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleUpload}
        className="hidden"
      />

      <div
        className={`bg-panel border border-panel-border rounded-xl overflow-hidden transition-all
          ${expanded ? "h-[500px]" : h}`}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-700 text-xs">
            Carregando…
          </div>
        ) : imgUrl ? (
          <img
            src={imgUrl}
            alt="Partitura"
            className="w-full h-full object-contain"
          />
        ) : (
          <div
            className="h-full flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-panel-light transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <ImageOff size={24} className="text-slate-700" />
            <span className="text-xs text-slate-600">Clique para carregar partitura</span>
            <span className="text-[10px] text-slate-700">PNG / JPG</span>
          </div>
        )}
      </div>

      {fileName && (
        <p className="text-[10px] text-slate-600 truncate">{fileName}</p>
      )}
    </div>
  );
}
