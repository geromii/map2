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
1. Build a data model such that the predicted side of a country can be presented on the map
2. Build an info panel that shows the population, land, wealth and military sizes of the two sides
3. Build a way to show the predicted side of a country on the map
4. Grant an ability for custom labels of the two sides?

*/



export default function MapChart() {
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [rotation, setRotation] = useState([-10, 0, 0]);
  const [scale, setScale] = useState(180);
  const [projectionType, setProj] = useState("geoEqualEarth");
  const [geographiesData, setGeographiesData] = useState([]);
  const [state, dispatch] = useReducer(countriesReducer, initialState);
  const [isCountrySearchVisible, setIsCountrySearchVisible] = useState(false);

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
  console.log(countryName);
  dispatch({ type: 'INCREMENT_COUNTRY_STATE', payload: countryName });

  // Clear any existing timeout to reset the delay
  clearTimeout(dispatchTimeoutId);

  // Set a new timeout
  dispatchTimeoutId = setTimeout(async () => {
      // Step 1: Clone the state
      const clonedState = JSON.parse(JSON.stringify(state));

      // Step 2: Update the cloned state
      const currentState = clonedState[countryName].state;
      const nextState = (currentState + 1) % 4;
      clonedState[countryName] = {
          ...clonedState[countryName],
          state: nextState,
      };

      // Step 3: Pass the cloned state to the function
      const resultArray = await multiplyWithScoresMatrix(clonedState);
      console.log(resultArray);

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
      <MapControls setRotation={setRotation} setScale={setScale} setProj={setProj} />
      <Map
        rotation={rotation}
        scale={scale}
        projectionType={projectionType}
        geographiesData={geographiesData}
        state={state}
        handleCountryClick={handleCountryClick}
      />

      {/* Overlay for CountrySearch */}
      {isCountrySearchVisible && (
        <div className="country-search-overlay">
          <CountrySearch handleCountryClick={handleCountryClick} state={state} />
        </div>
      )}
    </div>
  </div>
  );
}


function CountrySearch({ handleCountryClick, state }) {
  const [searchValue, setSearchValue] = useState('');
  const { allCountries, filteredCountries } = useCountries(searchValue);

  return (
    <div className="country-search">
      <input
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


const MapControls = ({ setRotation, setScale, setProj }) => {
  return (
    <div className="view-options">
      <div className="view-options">
        <button onClick={() => { setRotation([-10, 0, 0]); setScale(180); setProj("geoEqualEarth")}}>Default </button>
        <button onClick={() => { setRotation([-10, -40, 0]); setScale(180); setProj("geoEqualEarth")}}> North Pole </button>
        <button onClick={() => { setRotation([-147, 0, 0]); setScale(155); setProj("geoEqualEarth")}}>Pacific </button> 
        <button 
    onClick={() => { 
        setRotation([-60, -20, 0]); setScale(240); setProj("geoOrthographic");}}> Globe-Eurasia 
        </button>
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