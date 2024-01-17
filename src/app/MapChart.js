'use client'

import React, { useState, useEffect, useCallback, useReducer } from "react";
import { ComposableMap, Geographies, Geography, Sphere,
  Graticule } from "react-simple-maps";
import { useCountries } from './useCountries';
import './MapChart.css';
import { countriesReducer, initialState } from './countriesReducer';
import { multiplyWithScoresMatrix } from './matrixOperations';


// const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/*
Future goals for this project:
1. Toggle between predictions on or off
2. Toggle between second order predictions on or off
3 . Toggle between: different projections? different color schemes? different data?


*/



export default function MapChart() {
  const [rotation, setRotation] = useState([-10, 0, 0]);
  const [scale, setScale] = useState(180);
  const [projectionType, setProj] = useState("geoEqualEarth");
  const [geographiesData, setGeographiesData] = useState([]);
  const [stateWrapper, dispatch] = useReducer(countriesReducer, initialState);
  const [isCountrySearchVisible, setIsCountrySearchVisible] = useState(false);
  const [isProjectionActive, setIsProjectionActive] = useState(true);
  const [isSecondOrderActive, setIsSecondOrderActive] = useState(false);


  const toggleCountrySearch = () => {
    setIsCountrySearchVisible(!isCountrySearchVisible);
  };


  // First useEffect: Retain this for fetching geographies data
  useEffect(() => {
    fetch("/features.json")
      .then(response => response.json())
      .then(data => {
        const geometries = data.objects.world.geometries;
        setGeographiesData(data);
      });
  }, []);


 
  let dispatchTimeoutId; // Variable to store the timeout ID

  const handleCountryClick = (countryName) => {
  dispatch({ type: 'INCREMENT_COUNTRY_STATE', payload: countryName });

  // Clear any existing timeout to reset the delay
  clearTimeout(dispatchTimeoutId);

  // Set a new timeout
  dispatchTimeoutId = setTimeout(async () => {
      // Step 1: Clone the state
      const clonedState = JSON.parse(JSON.stringify(stateWrapper));

      // Step 2: Update the cloned state
      const currentState = clonedState[countryName].state;
      const nextState = (currentState + 1) % 4;
      clonedState[countryName] = {
          ...clonedState[countryName],
          state: nextState,
      };

      // Step 3: Pass the cloned state to the function
      const resultArray = await multiplyWithScoresMatrix(clonedState, isProjectionActive, isSecondOrderActive);

      dispatch({ type: 'SET_PROBABILITIES', payload: { probabilities: resultArray } });
  }, 75); 
};



  // Example of how to use the reducer function
  // let newState = countriesReducer(currentState, { type: 'INCREMENT_COUNTRY', payload: 'Country1' });
  // let color = getCountryColor(newState['Country1']);




  return (
    <div className="whole-container">
    <div className={`map-container ${isCountrySearchVisible ? 'overlay-active' : ''}`}>
      <button className="toggle-search-btn" onClick={toggleCountrySearch}>
        <span className="hamburger-icon"></span>
      </button>
      <MapControls setRotation={setRotation} setScale={setScale} setProj={setProj} isProjectionActive={isProjectionActive} 
      setIsProjectionActive={setIsProjectionActive} isSecondOrderActive={isSecondOrderActive} 
      setIsSecondOrderActive={setIsSecondOrderActive} dispatch={dispatch} state={stateWrapper}/>
      <Map
        rotation={rotation}
        scale={scale}
        projectionType={projectionType}
        geographiesData={geographiesData}
        state={stateWrapper}
        handleCountryClick={handleCountryClick}
      />

      {/* Overlay for CountrySearch */}
      {isCountrySearchVisible && (
        <div className="country-search-overlay">
          <CountrySearch handleCountryClick={handleCountryClick} state={stateWrapper} />
        </div>
      )}
    </div>
    
      <div className="second-order-info-box">
        <Second_Order_Info state={stateWrapper} />
      </div>
    
  </div>
  );
}

const Second_Order_Info = (state) => {
  function sumProbabilities(stateWrapper) {
    const state = stateWrapper.state;

    const sum = Object.entries(state).reduce((acc, [countryName, countryData], index) => { 
        if (typeof countryData.probability === 'number') {
            return acc + Math.abs(countryData.probability);
        } else {
            console.warn(`Invalid probability value for ${countryName} at index ${index}:`, countryData);
            return acc;
        }
    }, 0);

    const roundedSum = Number(sum.toFixed(1));

    console.log('Total sum of probabilities (rounded):', roundedSum);
    return roundedSum;

}




let severity_score = sumProbabilities(state);
  return (
    <div className="second-order-info-box"> 
      <br></br>
      Severity score is {severity_score}
    </div>
  );
};




function CountrySearch({ handleCountryClick, state }) {
  const [searchValue, setSearchValue] = useState('');
  const { allCountries, filteredCountries } = useCountries(searchValue);

  const selectedCountries = Object.keys(state).filter(country => state[country].state !== 0);
  console.log(selectedCountries);
  console.log(state);
  

  return (
    <div className="country-search">
      <input className="search-input"
        value={searchValue}
        onChange={e => setSearchValue(e.target.value)}
        placeholder="Search for a country..."
      />
      <div className="filtered-list">
        {filteredCountries.map(country => (
          <div 
            key={country} 
            onClick={() => handleCountryClick(country)}
            className="country-item"
            style={{
              fontWeight: 'bold',
              color: state[country].color
            }}
          >
            {country}
          </div>
        ))}
      </div>
    </div>
  );
}


const MapControls = ({ setRotation, setScale, setProj, isProjectionActive, 
  setIsProjectionActive, isSecondOrderActive, setIsSecondOrderActive, dispatch, state}) => {
  const [isPacific, setIsPacific] = useState(false);

  const handleToggle = () => {
    setIsPacific(!isPacific);
    if (!isPacific) {
      setRotation([-147, 0, 0]);
      setScale(155);
      setProj("geoEqualEarth");
    } else {
      setRotation([-10, 0, 0]);
      setScale(180);
      setProj("geoEqualEarth");
    }
  };

  const handleProjectionToggle = async () => {
    setIsProjectionActive(current => {
      const newState = !current;
      if (!newState) {
        setIsSecondOrderActive(false);
      }
      updateProbabilities(newState, newState ? isSecondOrderActive : false); // Pass the new state directly and ensure second order is turned off if projection is off
      return newState;
    });
};

const handleSecondOrderToggle = async () => {
    setIsSecondOrderActive(current => {
      const newState = !current;
      if (newState) {
        setIsProjectionActive(true);
      }
      updateProbabilities(true, newState); // Ensure projection is on when second order is toggled on
      return newState;
    });
};

const updateProbabilities = async (newIsProjectionActive, newIsSecondOrderActive) => {
    // Update state with scores matrix
    const resultArray = await multiplyWithScoresMatrix(state, newIsProjectionActive, newIsSecondOrderActive);
    dispatch({
      type: 'SET_PROBABILITIES',
      payload: {
        probabilities: resultArray,
        isProjectionActive: newIsProjectionActive,
        isSecondOrderActive: newIsSecondOrderActive
      }
    });
};

  

  return (
    <div className = "view-options-container">
      <div className="view-options">
        <label className="toggle-switch">
          <input type="checkbox" checked={isPacific} onChange={handleToggle} />
          <span className="switch" />
        </label>
        <label className="toggle-label" onClick = {handleToggle} >Pacific</label>
      </div>
      <div className = "middle-wrapper">
        <div className="view-options">
        <label className="toggle-switch">
          <input type="checkbox" checked={isProjectionActive} onChange={handleProjectionToggle} />
          <span className="switch" />
        </label>
        <label className="toggle-label" onClick={handleProjectionToggle}> Geopolitics</label>
        </div>
        <div className="view-options">
        <label className="toggle-switch">
          <input type="checkbox" checked={isSecondOrderActive} onChange={handleSecondOrderToggle} />
          <span className="switch" />
        </label>
        <label className="toggle-label" onClick={handleSecondOrderToggle}> War Outbreak</label>
        </div>
      </div>

    </div>
  );
};




const Map = ({ 
  rotation, 
  scale, 
  projectionType, 
  geographiesData, 
  state, 
  handleCountryClick, 
  getCountryColor 
}) => {
  return (
    <ComposableMap 
      viewBox="25 60 800 458"
      projection={projectionType}
      projectionConfig={{
        rotate: rotation,
        scale: scale,
      }}>
      <Sphere stroke="#E4E5E6" strokeWidth={0.5} />
      <Graticule stroke="#E4E5E6" strokeWidth={0.5} />
      <Geographies geography={geographiesData}>
        {({ geographies }) => geographies.map((geo) => {
          const countryState = state[geo.properties.name]; // Access the state for each country
          return (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              onClick={() => handleCountryClick(geo.properties.name)}
              stroke="white"
              strokeWidth={0.3}
              style={{
                default: {
                  fill: countryState.color, // Use the state to get the color
                  outline: "none"
                },
                hover: {
                  fill: countryState.color, // Use the state to get the color for hover as well
                  outline: "none"
                },
                pressed: {
                  fill: countryState.color, // Use the state to get the color for pressed state too
                  outline: "none"
                }
              }}
            />
          );
        })}
      </Geographies>
    </ComposableMap>
  );
};