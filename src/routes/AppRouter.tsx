import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage           from "../pages/HomePage";
import BibliotecaPage     from "../pages/BibliotecaPage";
import LouvorDetalhesPage from "../pages/LouvorDetalhesPage";
import AprendizPage       from "../pages/AprendizPage";
import IntermediarioPage  from "../pages/IntermediarioPage";
import ProfissionalPage   from "../pages/ProfissionalPage";
import ExerciciosPage     from "../pages/ExerciciosPage";
import ProgressoPage      from "../pages/ProgressoPage";
import NotFoundPage       from "../pages/NotFoundPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                          element={<HomePage />} />
        <Route path="/biblioteca"                element={<BibliotecaPage />} />
        <Route path="/exercicios"                element={<ExerciciosPage />} />
        <Route path="/progresso"                 element={<ProgressoPage />} />
        <Route path="/louvor/:id"                element={<LouvorDetalhesPage />} />
        <Route path="/louvor/:id/aprendiz"       element={<AprendizPage />} />
        <Route path="/louvor/:id/intermediario"  element={<IntermediarioPage />} />
        <Route path="/louvor/:id/profissional"   element={<ProfissionalPage />} />
        <Route path="*"                          element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
