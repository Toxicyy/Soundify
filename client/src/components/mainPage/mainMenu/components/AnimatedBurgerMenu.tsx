import React from 'react';

interface AnimatedBurgerMenuProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Animated burger menu component that transforms into a cross
 * Features smooth animations and customizable styling
 */
const AnimatedBurgerMenu: React.FC<AnimatedBurgerMenuProps> = ({
  isOpen,
  onClick,
  className = "",
  size = 24,
  color = "white"
}) => {
  const lineHeight = 3
  const spacing = size / 4; // Space between lines

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col justify-center items-center cursor-pointer transition-all duration-300 hover:scale-110 focus:ring-white/20 rounded p-1 ${className}`}
      style={{ width: size, height: size }}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
    >
      {/* Top line */}
      <span
        className="block transition-all duration-300 ease-in-out absolute"
        style={{
          width: size * 0.75,
          height: lineHeight,
          backgroundColor: color,
          borderRadius: lineHeight / 2,
          transform: isOpen 
            ? 'rotate(45deg)' 
            : `translateY(-${spacing}px) rotate(0deg)`,
          top: '50%',
          left: '50%',
          transformOrigin: 'center',
          marginLeft: -(size * 0.75) / 2,
          marginTop: -lineHeight / 2,
        }}
      />
      
      {/* Middle line */}
      <span
        className="block transition-all duration-300 ease-in-out absolute"
        style={{
          width: size * 0.75,
          height: lineHeight,
          backgroundColor: color,
          borderRadius: lineHeight / 2,
          opacity: isOpen ? 0 : 1,
          transform: isOpen ? 'scale(0)' : 'scale(1)',
          top: '50%',
          left: '50%',
          transformOrigin: 'center',
          marginLeft: -(size * 0.75) / 2,
          marginTop: -lineHeight / 2,
        }}
      />
      
      {/* Bottom line */}
      <span
        className="block transition-all duration-300 ease-in-out absolute"
        style={{
          width: size * 0.75,
          height: lineHeight,
          backgroundColor: color,
          borderRadius: lineHeight / 2,
          transform: isOpen 
            ? 'rotate(-45deg)' 
            : `translateY(${spacing}px) rotate(0deg)`,
          top: '50%',
          left: '50%',
          transformOrigin: 'center',
          marginLeft: -(size * 0.75) / 2,
          marginTop: -lineHeight / 2,
        }}
      />
    </button>
  );
};

export default AnimatedBurgerMenu;