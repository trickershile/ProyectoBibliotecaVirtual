import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Perfil from './pages/Perfil';
import Vender from './pages/Vender';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas con Navbar y Footer */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="vender" element={<Vender />} />
        </Route>

        {/* Ruta de Login sin Navbar/Footer */}
        <Route path="/login" element={<Login />} />

        {/* Aquí puedes añadir una ruta para página no encontrada (404) */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
