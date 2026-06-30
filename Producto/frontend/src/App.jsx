import { Component } from 'react';
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
import AsistenteIA from './pages/AsistenteIA';
import TrackingPublico from './pages/TrackingPublico';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error no capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', padding: '2rem', fontFamily: 'monospace', textAlign: 'center',
          background: '#f5dfd8', color: '#5a3f2b'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Algo salió mal</h1>
          <p style={{ fontSize: '0.875rem', marginBottom: '2rem', maxWidth: 400 }}>
            Ocurrió un error inesperado. Por favor, recarga la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: '2px solid #5a3f2b',
              background: '#5a3f2b', color: '#fffaf5', fontWeight: 700, fontSize: '0.75rem',
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em'
            }}
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const getFromStorage = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const location = useLocation();
  const sbUser = getFromStorage('sb_user');
  const sbProfile = getFromStorage('sb_profile');
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
    <ErrorBoundary>
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
            <Route
              path="carrito"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route path="resenas" element={<Reviews />} />
            <Route path="tracking" element={<TrackingPublico />} />
            <Route path="contacto" element={<Contact />} />
            <Route
              path="asistente"
              element={
                <ProtectedRoute>
                  <AsistenteIA />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
        <Toast />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
