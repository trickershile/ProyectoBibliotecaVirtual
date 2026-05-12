import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Chat from './Chat';

const Layout = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 flex flex-col font-sans">
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
