
import countries from './countries.json'; // Adjust the path as necessary

// countriesReducer.js

// Constants for the states
export const STATES = {
  INITIAL: 0, // Initial state
  RED: 1,
  BLUE: 2,
  NEUTRAL: 3,
};

// Function to get the next state
const getNextState = (currentState) => {
  return (currentState + 1) % 4; // Cycles through 0, 1, 2, 3
};

// Color Map based on states
export const COLOR_MAP = {
  [STATES.INITIAL]: "#b0b0b0", // Default color
  [STATES.RED]: "#b8060b",
  [STATES.BLUE]: "#110d8c",
  [STATES.NEUTRAL]: "#646464",
};

// Function to get the color based on the country's state
export const getCountryColor = (countryState) => {
  return COLOR_MAP[countryState];
};

// Reducer Function
export const countriesReducer = (state, action) => {
  switch (action.type) {
    case 'INCREMENT_COUNTRY':
      if (state[action.payload] !== undefined) {
        return {
          ...state,
          [action.payload]: getNextState(state[action.payload])
        };
      }
      return state;
    default:
      return state;
  }
};

// Initial State
// Replace with your actual country names
export const initialState = countries.reduce((acc, country) => {
  acc[country] = STATES.INITIAL;
  return acc;
}, {});
