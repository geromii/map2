import { create } from 'zustand';
import countries from './countries.json'; // Adjust the path as necessary

const PHASES = {
  INITIAL: 0,
  RED: 1,
  BLUE: 2,
  NEUTRAL: 3,
};

const COLOR_MAP = {
  [PHASES.INITIAL]: "#c8c8c8",
  [PHASES.RED]: "#850000",
  [PHASES.BLUE]: "#000085",
  [PHASES.NEUTRAL]: "#646464",
};

const getColorFromProbability = (number) => {
  number = Math.max(-1, Math.min(number, 1));
  let probability = Math.abs(number) ** 1.8;
  let hue = number >= 0 ? 0 : 240;
  let saturation = 100 * probability;
  let lightness = 78 - (30 * probability); 
  return `hsl(${hue}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
};

const useCountryStore = create((set, get) => ({
  countries: countries.reduce((acc, country) => {
    acc[country] = { 
      phase: PHASES.INITIAL, 
      color: COLOR_MAP[PHASES.INITIAL],
      probability: 0,
    };
    return acc;
  }, {}),

  incrementCountryPhase: (countryName) => {
    const countryData = get().countries[countryName];
    const nextPhase = (countryData.phase + 1) % Object.keys(PHASES).length;
    set((state) => ({
      countries: {
        ...state.countries,
        [countryName]: {
          ...countryData,
          phase: nextPhase,
          color: nextPhase === PHASES.INITIAL ? getColorFromProbability(countryData.probability) : COLOR_MAP[nextPhase],
        },
      },
    }));
  },

  setProbabilities: (probabilities) => {
    set((state) => {
      const updatedCountries = { ...state.countries };
      Object.keys(updatedCountries).forEach((country, index) => {
        const prob = probabilities[index];
        updatedCountries[country].probability = prob;
        updatedCountries[country].color = updatedCountries[country].phase === PHASES.INITIAL ? getColorFromProbability(prob) : updatedCountries[country].color;
      });
      console.log(updatedCountries);
      return { countries: updatedCountries };
    });
  },
}));

export default useCountryStore;
