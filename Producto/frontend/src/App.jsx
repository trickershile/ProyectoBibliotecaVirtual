import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Toast from './components/Toast';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import Login from './pages/Login';
import GestionLibros from './pages/GestionLibros';
import Register from './pages/Register';
import Perfil from './pages/Perfil';
import Cart from './pages/Cart';
import Reviews from './pages/Reviews';
import Contact from './pages/Contact';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const location = useLocation();
  const sbUser = JSON.parse(localStorage.getItem('sb_user') || 'null');
  const sbProfile = JSON.parse(localStorage.getItem('sb_profile') || 'null');
  const isLoggedIn = Boolean(sbUser);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireAdmin && sbProfile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="catalogo" element={<Catalogo />} />
          <Route 
            path="vender" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <GestionLibros />
              </ProtectedRoute>
            } 
          />
          <Route
            path="perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="carrito" element={<Cart />} />
          <Route path="resenas" element={<Reviews />} />
          <Route path="contacto" element={<Contact />} />
        </Route>
      </Routes>
      <Toast />
    </BrowserRouter>
  );
}

export default App;
