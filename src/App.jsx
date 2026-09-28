import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from "@/lib/AuthContext";
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from "./components/ProtectedRoute";
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ModoLibre from './pages/ModoLibre';
import ModoEstudio from './pages/ModoEstudio';
import EjercicioEstudio from './pages/EjercicioEstudio';
import MiPerfil from './pages/MiPerfil';
import Participantes from './pages/Participantes';
import Diagrama from './pages/Diagrama';
import Cursos from './pages/Cursos';
import CursoDetalle from './pages/CursoDetalle';
import { SesionUsuarioProvider } from '@/lib/sesionUsuario';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/modo-libre" element={<ModoLibre />} />
      <Route path="/modo-libre/diagrama" element={<Diagrama />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/modo-estudio" element={<ModoEstudio />} />
        <Route path="/modo-estudio/:id" element={<EjercicioEstudio />} />
        <Route path="/perfil" element={<MiPerfil />} />
        <Route path="/participantes" element={<Participantes />} />
        <Route path="/cursos" element={<Cursos />} />
        <Route path="/cursos/:id" element={<CursoDetalle />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <SesionUsuarioProvider>
            <AppRoutes />
          </SesionUsuarioProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;