import React from 'react';
import { Button } from "../ui/button"; // Adjust the import path as necessary

// Define mappings from size prop to button and icon size classes
const sizeClasses = {
  small: { button: "h-10 w-10", icon: "h-6 w-6" },
  medium: { button: "h-10 w-10 lg:h-12 lg:w-12", icon: "h-6 w-6 lg:h-8 lg:w-8" },
  large: { button: "h-14 w-14", icon: "h-10 w-10" },
};

const IconButton = ({ icon: Icon, size = 'medium', ...props }) => {
  // Get the appropriate class names based on the provided size prop
  const { button: buttonSizeClass, icon: iconSizeClass } = sizeClasses[size] || sizeClasses.medium;

  return (
    <Button
      {...props}
      className={`inline-flex justify-center shadow border-2 border-yellow-400 items-center p-0 m-0 transition-all duration-150 hover:shadow-lg hover:border-yellow-500 active:scale-95 active:shadow-sm active:border-yellow-600 ${buttonSizeClass} ${props.className || ''}`}
    >
      {Icon && <Icon className={`${iconSizeClass} transition-transform duration-150`}/>}
    </Button>
  );
};

export default IconButton;