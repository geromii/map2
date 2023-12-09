import { useReducer } from 'react';
import countries from './countries.json'; // Adjust the path as necessary

export const STATES = {
  INITIAL: 0,
  RED: 1,
  BLUE: 2,
  NEUTRAL: 3,
};

// Action Types
export const INCREMENT_COUNTRY_STATE = 'INCREMENT_COUNTRY_STATE';
export const SET_PROBABILITIES = 'SET_PROBABILITIES';

// Color Map based on states
export const COLOR_MAP = {
  [STATES.INITIAL]: "#c8c8c8",
  [STATES.RED]: "#b8060b",
  [STATES.BLUE]: "#0616c9",
  [STATES.NEUTRAL]: "#646464",
};


// Function to compute color based on probability

function getColorFromProbability(number) {
  // Define color values at probabilities -1, 0, and 1
  const colorAtNeg1 = {r: 20, g: 20, b: 255}; // RGB for #00ff00 (Example color for -1)
  const colorAt0 = {r: 200, g: 200, b: 200}; // RGB for #b0b0b0
  const colorAt1 = {r: 252, g: 27, b: 23}; // RGB for #fc0703

  let probability = null

  if (number > 1) {number = 1}
  else if (number < -1) {number = -1}
  if (number > 0) {probability = number ** 1.8}
  else {probability = -1*((-1 * number) ** 1.8)}



  function interpolateColor(color1, color2, fraction) {
      // Linear interpolation between two colors
      return {
          r: Math.round(color1.r + (color2.r - color1.r) * fraction),
          g: Math.round(color1.g + (color2.g - color1.g) * fraction),
          b: Math.round(color1.b + (color2.b - color1.b) * fraction)
      };
  }

  let interpolatedColor;
  if (probability < 0) {
      // Interpolate between colorAtNeg1 and colorAt0
      const fraction = (probability + 1) / 1; // Normalize -1 to 0 range to 0 to 1
      interpolatedColor = interpolateColor(colorAtNeg1, colorAt0, fraction);
  } else {
      // Interpolate between colorAt0 and colorAt1
      const fraction = probability; // Probability already in 0 to 1 range
      interpolatedColor = interpolateColor(colorAt0, colorAt1, fraction);
  }

  // Convert RGB to hexadecimal
  return `#${interpolatedColor.r.toString(16).padStart(2, '0')}${interpolatedColor.g.toString(16).padStart(2, '0')}${interpolatedColor.b.toString(16).padStart(2, '0')}`;
}




// Test the function with different probabilities
console.log(getColorFromProbability(0));    // Should return #0349fc
console.log(getColorFromProbability(0.5));  // Should return #b0b0b0
console.log(getColorFromProbability(1));    // Should return #fc0703


// Reducer Function
export const countriesReducer = (state, action) => {
  switch (action.type) {
    case 'INCREMENT_COUNTRY_STATE':
      const countryName = action.payload;
      const currentState = state[countryName].state;
      const nextState = (currentState + 1) % Object.keys(STATES).length;
      
      return {
        ...state,
        [countryName]: {
          ...state[countryName],
          state: nextState,
          color: nextState === STATES.INITIAL ? getColorFromProbability(state[countryName].probability) : COLOR_MAP[nextState]
        }
      };

      case SET_PROBABILITIES:
        const { probabilities } = action.payload;
        return probabilities.reduce((newState, prob, index) => {
          const country = Object.keys(state)[index];
          newState[country] = {
            ...state[country],
            probability: prob,
            color: state[country].state === STATES.INITIAL ? getColorFromProbability(prob) : state[country].color
          };
          return newState;
        }, {...state});
  }
};


// Initial State
export const initialState = countries.reduce((acc, country) => {
  acc[country] = { 
    state: STATES.INITIAL, 
    color: COLOR_MAP[STATES.INITIAL],
    probability: 0.5 // Default probability
  };
  return acc;
}, {});
