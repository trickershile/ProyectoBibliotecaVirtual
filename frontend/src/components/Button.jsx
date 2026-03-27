import { Link } from 'react-router-dom';

const Button = ({ children, variant = "primary", onClick, className = "", to, type = "button" }) => {
  const variants = {
    primary: "bg-blue-600/10 border-blue-600 text-blue-500 hover:bg-blue-600 hover:text-white",
    secondary: "bg-gray-800/10 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white",
    outline: "bg-transparent border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-500",
    danger: "bg-red-600/10 border-red-600 text-red-500 hover:bg-red-600 hover:text-white",
    success: "bg-green-600/10 border-green-600 text-green-500 hover:bg-green-600 hover:text-white",
  };

  const classes = `px-6 py-2 rounded-lg border font-mono text-sm font-bold tracking-tighter transition-all duration-300 active:scale-95 flex items-center justify-center space-x-2 group ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes}>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-1 text-xs">{'>'}</span>
        {children}
      </Link>
    );
  }

  return (
    <button 
      type={type}
      onClick={onClick}
      className={classes}
    >
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-1 text-xs">{'>'}</span>
      {children}
    </button>
  );
};

export default Button;
