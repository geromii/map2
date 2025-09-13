import React, { useEffect, useRef } from "react";
import { IconX } from "@tabler/icons-react";
import useCountryStore from "@/app/useCountryStoreOptimized";

export const CountrySelector = ({ 
  country, 
  position, 
  onClose, 
  isMobile = false 
}) => {
  const selectorRef = useRef(null);
  const { setCountryPhase } = useCountryStore();

  useEffect(() => {
    if (!country || !position.x || !position.y) return;

    const handleClickOutside = (e) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleMouseMove = (e) => {
      const distance = Math.sqrt(
        Math.pow(e.clientX - position.x, 2) +
        1.8 * Math.pow(e.clientY - (position.y + 5), 2)
      );
      if (distance > 200) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    if (!isMobile) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [country, position, onClose, isMobile]);

  if (!country || !position.x || !position.y) return null;

  const handlePhaseChange = (phase) => {
    setCountryPhase(country, phase);
    onClose();
  };

  const desktopStyle = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: 'translate(-50%, -50%)',
    zIndex: 9999,
  };

  const mobileStyle = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y - 40}px`,
    transform: 'translate(-50%, -100%)',
    zIndex: 9999,
  };

  if (isMobile) {
    return (
      <div ref={selectorRef} style={mobileStyle} className="animate-in fade-in zoom-in-95 duration-100">
        <div className="flex shadow-lg">
          <button
            onClick={() => handlePhaseChange(2)}
            className="w-8 h-8 bg-blue-500 ring-2 ring-white hover:bg-blue-700 cursor-pointer text-white flex justify-center items-center rounded-l-xl transition-colors"
            aria-label="Set as ally"
          />
          <button
            onClick={() => handlePhaseChange(3)}
            className="w-8 h-8 bg-red-500 ring-2 ring-white hover:bg-red-700 cursor-pointer rounded-r-xl transition-colors"
            aria-label="Set as opponent"
          />
        </div>
        <div className="flex mt-1 shadow-lg">
          <button
            onClick={() => handlePhaseChange(0)}
            className="w-4 h-4 bg-gray-200 ring-1 ring-white hover:bg-gray-300 cursor-pointer flex justify-center items-center rounded-l-xl transition-colors"
            aria-label="Reset"
          >
            <IconX size={12} />
          </button>
          <button
            onClick={() => handlePhaseChange(1)}
            className="w-4 h-4 bg-gray-600 ring-1 ring-white hover:bg-gray-700 cursor-pointer rounded-r-xl transition-colors"
            aria-label="Set as neutral"
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={selectorRef} style={desktopStyle} className="animate-in fade-in zoom-in-95 duration-100">
      <div className="flex gap-6 items-center">
        <button
          onClick={() => handlePhaseChange(2)}
          className="w-10 h-6 bg-blue-700 ring-2 ring-white hover:bg-blue-800 rounded-full cursor-pointer drop-shadow transition-colors"
          aria-label="Set as ally"
        />
        <button
          onClick={() => handlePhaseChange(3)}
          className="w-10 h-6 bg-red-700 ring-2 ring-white hover:bg-red-800 rounded-full cursor-pointer drop-shadow transition-colors"
          aria-label="Set as opponent"
        />
      </div>
      <div className="flex justify-center mt-3">
        <div className="flex">
          <button
            onClick={() => handlePhaseChange(0)}
            className="w-4 h-4 bg-gray-200 ring-1 ring-white hover:bg-gray-300 cursor-pointer flex justify-center items-center rounded-l-xl drop-shadow transition-colors"
            aria-label="Reset"
          >
            <IconX size={12} />
          </button>
          <button
            onClick={() => handlePhaseChange(1)}
            className="w-4 h-4 bg-gray-600 ring-1 ring-white hover:bg-gray-700 cursor-pointer rounded-r-xl drop-shadow transition-colors"
            aria-label="Set as neutral"
          />
        </div>
      </div>
    </div>
  );
};