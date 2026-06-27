import { Link } from 'react-router-dom';

const Button = ({ children, variant = "primary", onClick, className = "", to, type = "button" }) => {
  const variants = {
    primary: "bg-[#8f6443] border-[#8f6443] text-[#fffaf5] hover:bg-[#6f4e36] hover:text-[#fffaf5]",
    secondary: "bg-[#f8ede2] border-[#d2b08f] text-[#5a3f2b] hover:bg-[#ead4bd] hover:text-[#3f2b1d]",
    outline: "bg-[#fffaf4] border-[#9d7553] text-[#5a3f2b] hover:border-[#7f5c40] hover:bg-[#f1ddca] hover:text-[#3f2b1d]",
    danger: "bg-[#f5dfd8] border-[#d7a59d] text-[#8a3f34] hover:bg-[#ebc7bd] hover:text-[#6f2f27]",
    success: "bg-[#6f8a60] border-[#6f8a60] text-[#fffaf5] hover:bg-[#566b4a] hover:text-[#fffaf5]",
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
