import { useNavigate } from "react-router-dom";
import { Music } from "lucide-react";

export default function NotFoundPage() {
  const nav = useNavigate();
  return (
    <div className="h-full flex flex-col items-center justify-center gap-5 bg-ink">
      <Music size={48} className="text-slate-700" />
      <div className="text-center">
        <p className="text-2xl font-bold text-slate-400 mb-2">Página não encontrada</p>
        <p className="text-slate-600 text-sm">O endereço acessado não existe.</p>
      </div>
      <button onClick={() => nav("/")} className="btn-gold">Voltar ao início</button>
    </div>
  );
}
