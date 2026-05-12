import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import Login from './pages/Login';
import Register from './pages/Register';
import Perfil from './pages/Perfil';
import Cart from './pages/Cart';
import Reviews from './pages/Reviews';
import Contact from './pages/Contact';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas con Navbar y Footer */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="catalogo" element={<Marketplace />} />
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

        {/* Aquí puedes añadir una ruta para página no encontrada (404) */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
