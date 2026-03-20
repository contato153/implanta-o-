import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'motion/react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center justify-center py-1">
      <button
        onClick={toggleTheme}
        className="relative w-12 h-6 rounded-full bg-[#0B0B0B] border border-[#333] cursor-pointer flex items-center transition-colors duration-300 overflow-hidden"
        aria-label="Alternar tema"
      >
        {/* Background Icons */}
        <div className="absolute inset-0 flex justify-between items-center px-2 opacity-40">
          <Sun size={10} className="text-[#F4C400]" />
          <Moon size={10} className="text-[#BDBDBD]" />
        </div>

        {/* Toggle Handle */}
        <motion.div
          className="absolute z-10 w-5 h-5 rounded-full bg-[#F4C400] flex items-center justify-center shadow-md ml-0.5"
          animate={{
            x: theme === 'dark' ? 22 : 0,
            backgroundColor: theme === 'dark' ? '#BDBDBD' : '#F4C400'
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {theme === 'dark' ? (
            <Moon size={12} className="text-[#0B0B0B]" />
          ) : (
            <Sun size={12} className="text-[#0B0B0B]" />
          )}
        </motion.div>
      </button>
    </div>
  );
};
