import Button from '../components/Button';

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-md bg-gray-900/50 border border-gray-800 rounded-2xl shadow-2xl p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white font-mono tracking-tighter uppercase">LOGIN</h1>
          <p className="text-gray-400 mt-2 font-sans">Accede a tu cuenta para continuar</p>
        </div>
        <form className="space-y-6">
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2 font-mono" htmlFor="email">
              EMAIL
            </label>
            <input 
              type="email" 
              id="email"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="usuario@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2 font-mono" htmlFor="password">
              PASSWORD
            </label>
            <input 
              type="password" 
              id="password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="********"
            />
          </div>
          <div className="flex items-center justify-between">
            <a href="#" className="text-sm text-blue-500 hover:underline font-sans">¿Olvidaste tu contraseña?</a>
          </div>
          <div>
            <Button type="submit" variant="primary" className="w-full py-3 text-base">
              ./login
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
