import React from 'react';

interface BigButtonProps {
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
}

const BigButton: React.FC<BigButtonProps> = ({ 
  onClick, 
  label, 
  icon, 
  variant = 'primary', 
  className = '',
  disabled = false
}) => {
  const baseStyles = "w-full flex flex-col items-center justify-center p-8 rounded-2xl shadow-lg transform transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-yellow-400 text-slate-900 border-b-8 border-yellow-600 hover:bg-yellow-300",
    secondary: "bg-slate-700 text-white border-b-8 border-slate-900 hover:bg-slate-600",
    danger: "bg-red-500 text-white border-b-8 border-red-700 hover:bg-red-400"
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      aria-label={label}
      disabled={disabled}
    >
      {icon && <div className="mb-4 text-6xl">{icon}</div>}
      <span className="text-2xl font-bold uppercase tracking-wide">{label}</span>
    </button>
  );
};

export default BigButton;
