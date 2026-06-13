import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Chat from './Chat';

const Layout = () => {
  return (
    <div className="pastel-theme min-h-screen bg-[#0f1420] text-[#d8d7e5] flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <Chat />
    </div>
  );
};

export default Layout;
