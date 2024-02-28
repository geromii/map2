import { create } from "zustand";
import countries from "./countries.json"; // Adjust the path as necessary
import * as math from "mathjs";

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

const getColorFromProbability = (number, phase, isProjectionActive) => {
  if (phase == PHASES.RED) {return COLOR_MAP[PHASES.RED]}
  if (phase == PHASES.BLUE) {return COLOR_MAP[PHASES.BLUE]}
  if (phase == PHASES.NEUTRAL) {return COLOR_MAP[PHASES.NEUTRAL]}
  if (!isProjectionActive) {return COLOR_MAP[PHASES.INITIAL]}

  number = Math.max(-1, Math.min(number, 1));
  let probability = Math.abs(number) ** 1.8; // turns the probability into a more exponential curve
  let hue = number >= 0 ? 0 : 240;
  let saturation = 100 * probability;
  let lightness = 78 - 30 * probability;
  return `hsl(${hue}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
};

const useCountryStore = create((set, get) => ({
  isProjectionActive: true,
  isSecondOrderActive: false,
  countries: countries.reduce((acc, country) => {
    acc[country] = {
      phase: PHASES.INITIAL,
      color: COLOR_MAP[PHASES.INITIAL],
      probability: 0,
    };
    return acc;
  }, {}),

  setIsProjectionActive: async (isActive) => {
    set(() => ({ isProjectionActive: isActive }));
    await get().calculateProbabilities();
  },
  
  // Function to update `isSecondOrderActive` and then recalculate probabilities
  setIsSecondOrderActive: async (isActive) => {
    set(() => ({ isSecondOrderActive: isActive }));
    await get().calculateProbabilities();
  },
  
  incrementCountryPhase: async (countryName) => {
    const countryData = get().countries[countryName];
    const nextPhase = (countryData.phase + 1) % Object.keys(PHASES).length;
    await set((state) => ({
      countries: {
        ...state.countries,
        [countryName]: {
          ...countryData,
          phase: nextPhase,
          color: getColorFromProbability(countryData.probability, nextPhase, state.isProjectionActive)
        },
      },
    }));

    // After updating the phase, calculate new probabilities
    await get().calculateProbabilities();
  },

  calculateProbabilities: async () => {
    const { isProjectionActive, isSecondOrderActive, countries } = get();
  
    const case1Exists = Object.values(countries).some(({ phase }) => phase === 1);
    const case2Exists = Object.values(countries).some(({ phase }) => phase === 2);
    const bothExist = case1Exists && case2Exists;

    let result = null
  
    if (bothExist) {
      let scoresMatrix = await fetchScoresMatrix();
      let stateArray = transformStateToNumericArray(countries);
      result = math.multiply(scoresMatrix, stateArray);
      console.log("result", result);
  
      Object.keys(countries).forEach((country, index) => {
        if (countries[country].phase === 3) {
          result[index] = 0;
        }
      });
  
      if (isSecondOrderActive) {
        const modifiedScoresMatrix = math.map(scoresMatrix, (value) => Math.pow(Math.abs(value), 4) * 4 * value);
        const secondOrderResult = math.multiply(modifiedScoresMatrix, result);
        result = math.divide(math.add(result, secondOrderResult), 2); // Averaging the result with the second-order result
      }
    } else {
      // Handle the case where either case1Exists or case2Exists is false
      // For example, initialize result as an array of zeros if that's appropriate for your scenario
      console.log("Case 1 or Case 2 does not exist");
      result = new Array(Object.keys(countries).length).fill(0);
    }
  
    // Unified approach to set countries' properties, handling both initialization and update in one place
    set((state) => ({
      countries: Object.keys(state.countries).reduce((newCountries, country, index) => {
        const currentCountry = state.countries[country];
        const probability = (!bothExist) ? 0 : result[index];
        newCountries[country] = {
          ...currentCountry,
          probability,
          color: getColorFromProbability(probability, currentCountry.phase, isProjectionActive),
        };
        return newCountries;
      }, {}),
    }));
  },
  
}));

async function fetchScoresMatrix() {
  const storedMatrix = sessionStorage.getItem('scoresMatrix');
  if (storedMatrix) {
    return JSON.parse(storedMatrix);
  } else {
    // Assuming you have a URL to fetch the scores matrix
    const response = await fetch('/scores_matrix.json');
    const matrix = await response.json();
    sessionStorage.setItem('scoresMatrix', JSON.stringify(matrix));
    return matrix;
  }
}

function transformStateToNumericArray(stateWrapper) {
  const stateArray = new Array(200).fill(0); // Assuming the array length is always 200

  Object.keys(stateWrapper).forEach((country, index) => {
    const countryState = stateWrapper[country].phase;

    switch (countryState) {
      case 0:
        stateArray[index] = 0;
        break;
      case 1:
        stateArray[index] = 0.6;
        break;
      case 2:
        stateArray[index] = -0.6;
        break;
      case 3:
        stateArray[index] = 0;
        break;
      default:
        stateArray[index] = 0; // Default case, you can adjust it as per your needs
    }
  });

  return stateArray;
}

export default useCountryStore;
