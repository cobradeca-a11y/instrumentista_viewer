import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import type { NivelPedagogico } from "../../types/music";

interface AppShellProps {
  children: ReactNode;
  titulo: string;
  numero?: string;
  modulo: string;
  tom?: string;
  bpm?: number;
  louvorId?: string;
  nivel?: NivelPedagogico;
  progresso?: number;
  backPath?: string;
}

export default function AppShell({
  children,
  titulo,
  numero,
  modulo,
  tom,
  bpm,
  louvorId,
  nivel,
  progresso,
  backPath,
}: AppShellProps) {
  return (
    <div className="h-full flex">
      <Sidebar louvorId={louvorId} nivelAtual={nivel} progresso={progresso ?? 0} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          titulo={titulo}
          numero={numero}
          modulo={modulo}
          tom={tom}
          bpm={bpm}
          backPath={backPath}
        />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
