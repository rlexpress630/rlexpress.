import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading = false,
  ...props
}) => {
  const baseStyle = "flex items-center justify-center px-4 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-red-700 shadow-lg shadow-red-500/20",
    secondary: "bg-gray-800 text-white hover:bg-gray-700",
    outline: "border-2 border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-surface",
    danger: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={props.disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  className?: string;
  value?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  placeholder?: string;
  required?: boolean;
  type?: string;
  maxLength?: number;
  name?: string;
}

export const Input = ({
  label,
  className = '',
  ...props
}: InputProps) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">{label}</label>
    <input
      className={`w-full px-4 py-3 rounded-lg bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white ${className}`}
      {...props}
    />
  </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  className?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  className = '',
  ...props
}) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">{label}</label>
    <textarea
      className={`w-full px-4 py-3 rounded-lg bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white min-h-[80px] ${className}`}
      {...props}
    />
  </div>
);

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`bg-white dark:bg-dark-surface rounded-2xl p-5 border border-gray-100 dark:border-dark-border shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

export const Badge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    CANCELED: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
  };

  const labels: Record<string, string> = {
    PENDING: "Pendente",
    COMPLETED: "Concluído",
    CANCELED: "Cancelado"
  };
  
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
};