import { Link } from 'react-router-dom';

const Button = ({ children, variant = "primary", onClick, className = "", to, type = "button" }) => {
  const variants = {
    primary: "bg-[#1b2a3a] border-[#a7d8ff] text-[#a7d8ff] hover:bg-[#24354a] hover:text-white",
    secondary: "bg-[#161c2a] border-[#2a3650] text-[#aab3c2] hover:bg-[#1c2636] hover:text-white",
    outline: "bg-transparent border-[#2a3650] text-[#aab3c2] hover:border-[#cdb4db] hover:text-[#cdb4db]",
    danger: "bg-[#2a1822] border-[#ffadad] text-[#ffadad] hover:bg-[#3a2030] hover:text-white",
    success: "bg-[#182a22] border-[#b9fbc0] text-[#b9fbc0] hover:bg-[#1f3a30] hover:text-white",
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
