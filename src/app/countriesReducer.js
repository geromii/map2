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
  [STATES.RED]: "#850000",
  [STATES.BLUE]: "#000085",
  [STATES.NEUTRAL]: "#646464",
};


// Function to compute color based on probability

function getColorFromProbability(number) {
  // Restrict number to range [-1, 1]
  number = Math.max(-1, Math.min(number, 1));

  // Adjust number using power function on its absolute value
  let probability = Math.abs(number) ** 1.8;

  // Determine hue based on sign of the number
  let hue = number >= 0 ? 0 : 240;

  // Define saturation and lightness
  let saturation = 100 * probability; // Scale from 0 to 100%
  let lightness = 78 - (30 * probability); 

  // Convert HSL to RGB (or use a library function for this)
  // return hslToRgb(hue, saturation, lightness);
  // For the purpose of this example, let's just return the HSL value
  return `hsl(${hue}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}






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
