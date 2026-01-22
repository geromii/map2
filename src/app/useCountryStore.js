import { create } from "zustand";
import countries from "./countries.json"; 
// Matrix operation functions to replace mathjs
function matrixVectorMultiply(matrix, vector) {
  return matrix.map(row => 
    row.reduce((sum, val, i) => sum + val * vector[i], 0)
  );
}

function matrixMap(matrix, fn) {
  return matrix.map(row => row.map(fn));
}

function vectorAdd(a, b) {
  return a.map((val, i) => val + b[i]);
}

function vectorDivide(vector, scalar) {
  return vector.map(val => val / scalar);
}

// Pre-parse matrix after initial load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    fetchScoresMatrix().catch(console.error);
  }, 0);
}

const PHASES = {
  INITIAL: 0,
  NEUTRAL: 1,
  BLUE: 2,
  RED: 3,
};

const COLOR_MAP = {
  [PHASES.INITIAL]: "#c8c8c8",
  [PHASES.RED]: "#850000",
  [PHASES.BLUE]: "#000085",
  [PHASES.NEUTRAL]: "#646464",
};

const getColorFrompreferenceScore = (number, phase, mapMode) => {
  if (phase == PHASES.RED) {return COLOR_MAP[PHASES.RED]}
  if (phase == PHASES.BLUE) {return COLOR_MAP[PHASES.BLUE]}
  if (phase == PHASES.NEUTRAL) {return COLOR_MAP[PHASES.NEUTRAL]}
  if (mapMode == "off") {return COLOR_MAP[PHASES.INITIAL]}



  number = Math.max(-1, Math.min(number, 1));
  let preferenceScore = Math.abs(number) ** 1.4; // turns the preferenceScore into a more exponential curve
  let hue = number >= 0 ? 240 : 0;
  let saturation = 100 * preferenceScore;
  let lightness = 78 - 30 * preferenceScore;
  return `hsl(${hue}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
};

const useCountryStore = create((set, get) => ({
  mapMode: "default",
  countries: countries.reduce((acc, country) => {
    acc[country] = {
      phase: PHASES.INITIAL,
      color: COLOR_MAP[PHASES.INITIAL],
      preferenceScore: 0,
      nonInitial: false,
      selectionOrder: 0,
    };
    return acc;
  }, {}),


  setMapMode: async (mode) => {

    if (mode !== "default" && mode !== "single" && mode !== "war" && mode != "off") {
      throw new Error("Invalid mode argument. Must be 'default', 'single', or 'war'.");
    }

    set(() => ({ mapMode: mode }));
    await get().calculateProbabilities();
  },


  
  incrementCountryPhase: async (countryName) => {
    const countryData = get().countries[countryName];
    const nextPhase = (countryData.phase + 1) % Object.keys(PHASES).length;
    await set((state) => {
      const maxSelectionOrder = getMaxSelectionOrder(state.countries);
      const currentSelectionOrder = countryData.selectionOrder;
      const updatedCountries = {
        ...state.countries,
        [countryName]: {
          ...countryData,
          phase: nextPhase,
          color: getColorFrompreferenceScore(countryData.preferenceScore, nextPhase, state.isProjectionActive),
          nonInitial: nextPhase !== PHASES.INITIAL,
          selectionOrder: currentSelectionOrder !== 0 ? currentSelectionOrder : (nextPhase !== PHASES.INITIAL ? maxSelectionOrder + 1 : 0),
        },
      };
      return {
        countries: updatedCountries,
      };
    });
  
    // After updating the phase, calculate new probabilities
    await get().calculateProbabilities();
  },
  resetAllExcept: (exceptions = []) => {
    const currentCountries = get().countries;
    const resetCountries = Object.keys(currentCountries).reduce((acc, country) => {
      if (!exceptions.includes(country)) {
        acc[country] = {
          phase: PHASES.INITIAL,
          color: COLOR_MAP[PHASES.INITIAL],
          preferenceScore: 0,
          nonInitial: false,
          selectionOrder: 0,
        };
      } else {
        acc[country] = currentCountries[country];
      }
      return acc;
    }, {});
  
    set({
      countries: resetCountries,
    });
  
    // recalculate probabilities
    get().calculateProbabilities();
  },
  setCountryPhase: (countryName, phase) => {
    // Check if phase is provided as a string and convert it to its corresponding numeric value
    if (typeof phase === 'string') {
      phase = phase.toUpperCase(); // Ensure the string is in uppercase to match the keys in PHASES
      if (PHASES.hasOwnProperty(phase)) {
        phase = PHASES[phase];
      } else {
        console.error("Invalid phase provided");
        return;
      }
    }
  
    if (!Object.values(PHASES).includes(phase)) {
      console.error("Invalid phase provided");
      return;
    }
  
    const countryExists = get().countries.hasOwnProperty(countryName);
    if (!countryExists) {
      console.error("Country does not exist");
      return;
    }
    set((state) => {
      const maxSelectionOrder = getMaxSelectionOrder(state.countries);
      const currentSelectionOrder = state.countries[countryName].selectionOrder;
      const updatedCountries = {
        ...state.countries,
        [countryName]: {
          ...state.countries[countryName],
          phase: phase,
          color: getColorFrompreferenceScore(state.countries[countryName].preferenceScore, phase, state.isProjectionActive),
          nonInitial: phase !== PHASES.INITIAL,
          selectionOrder: currentSelectionOrder !== 0 ? currentSelectionOrder : (phase !== PHASES.INITIAL ? maxSelectionOrder + 1 : 0),
        },
      };
      return {
        countries: updatedCountries,
      };
    });
  
    // after updating the state, recalculate probabilities
    get().calculateProbabilities();
  },

  calculateProbabilities: async () => {
    const { mapMode, countries } = get();


    // Check if both phase 2 and phase 3 exist
    const blueExists = Object.values(countries).some(({ phase }) => phase === 2);
    const redExists = Object.values(countries).some(({ phase }) => phase === 3);
    const bothExist = blueExists && redExists;


    const revealScores = ((mapMode == "single") && blueExists && !redExists) || (bothExist && (mapMode != "single")) 

    const scalar = (mapMode == "single") ? 1 : 0.8;

    // if only one exists, set mode to "single", if both exist set mode to "multi"

    let result = null
  
    // If both phase 1 and phase 2 exist, calculate probabilities
    if (revealScores) {
      let scoresMatrix = await fetchScoresMatrix();
      let stateArray = transformStateToNumericArray(countries, scalar);
      result = matrixVectorMultiply(scoresMatrix, stateArray);
  
      Object.keys(countries).forEach((country, index) => {
        if (countries[country].phase === 1) {
          result[index] = 0;
        }
      });
  
      if (mapMode == "war") {
        const modifiedScoresMatrix = matrixMap(scoresMatrix, (value) => Math.pow(Math.abs(value), 4) * 1 * value);
        const secondOrderResult = matrixVectorMultiply(modifiedScoresMatrix, result);
        result = vectorDivide(vectorAdd(result, secondOrderResult), 2); // Averaging the result with the second-order result
      }
    } else {
      // Handle the case where either case1Exists or case2Exists is false
      // For example, initialize result as an array of zeros if that's appropriate for your scenario
      result = new Array(Object.keys(countries).length).fill(0);
    }
  
    // Unified approach to set countries' properties, handling both initialization and update in one place
    set((state) => ({
      countries: Object.keys(state.countries).reduce((newCountries, country, index) => {
        const currentCountry = state.countries[country];
        const preferenceScore = (!revealScores) ? 0 : result[index];
        newCountries[country] = {
          ...currentCountry,
          preferenceScore,
          color: getColorFrompreferenceScore(preferenceScore, currentCountry.phase, mapMode),
        };
        return newCountries;
      }, {}),
    }));
  },
  
}));

async function fetchScoresMatrix() {
  const storedMatrix = sessionStorage.getItem('mapDesign');
  if (storedMatrix) {
    return JSON.parse(storedMatrix);
  } else {
    // Use optimized fetching with error handling
    try {
      const response = await fetch('/map_design_2025_08.json', {
        // Enable compression
        headers: {
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const matrix = await response.json();
      
      // Only cache if we have space
      try {
        sessionStorage.setItem('mapDesign', JSON.stringify(matrix));
      } catch (e) {
        console.warn('SessionStorage full, skipping cache');
      }
      
      return matrix;
    } catch (error) {
      console.error('Failed to fetch matrix data:', error);
      // Return a fallback empty matrix to prevent app crash
      return Array(200).fill().map(() => Array(200).fill(0));
    }
  }
}

const getMaxSelectionOrder = (countries) => {
  return Math.max(...Object.values(countries).map((country) => country.selectionOrder));
};

function transformStateToNumericArray(stateWrapper, scalar) {
  const stateArray = new Array(200).fill(0); 

  let REDUCER = scalar

  // Initialize counters for each case
  let case2Count = 0;
  let case3Count = 0;

  // First pass to count the cases
  Object.keys(stateWrapper).forEach(country => {
    const countryState = stateWrapper[country].phase;
    if (countryState === 2) case2Count++;
    if (countryState === 3) case3Count++;
  });

  // Function to calculate the sum of the harmonic series up to n
  const harmonicSum = n => {
    let sum = 0;
    for (let i = 1; i <= n; i++) {
      sum += 1 / i;
    }
    return sum;
  };

  // Calculate the average values after the harmonic series division
  const case2value = case2Count > 0 ? REDUCER * harmonicSum(case2Count) / case2Count : 0;
  const case3value = case3Count > 0 ? REDUCER * harmonicSum(case3Count) / case3Count : 0;

  let euShortcut2 = 1;
  let euShortcut3 = 1;

  if (REDUCER == 1) {
    euShortcut2 = (case2Count == 27) ? 0.40 : 1;
    euShortcut3 = (case3Count == 27) ? 0.40 : 1;
  }


  // Second pass to set the values based on the case
  Object.keys(stateWrapper).forEach((country, index) => {
    const countryState = stateWrapper[country].phase;

    switch (countryState) {
      case 0:
        stateArray[index] = 0;
        break;
      case 1:
        stateArray[index] = 0 ;
        break;
      case 2:
        stateArray[index] = case2value * euShortcut2 ;
        break;
      case 3:
        stateArray[index] = -case3value * euShortcut3 ;
        break;
      default:
        stateArray[index] = 0;
    }
  });

  return stateArray;
}

export default useCountryStore;
