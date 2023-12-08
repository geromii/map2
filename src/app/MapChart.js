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
        const resultArray = await multiplyWithScoresMatrix(state);
        console.log(resultArray);
        dispatch({ type: 'SET_PROBABILITIES', payload: { probabilities: resultArray } });
    }, 2000); // 1 second delay
};



// Example of how to use the reducer function
// let newState = countriesReducer(currentState, { type: 'INCREMENT_COUNTRY', payload: 'Country1' });
// let color = getCountryColor(newState['Country1']);
  
  

  return (
    <div>
    <div className="map-container">
      <MapControls setRotation={setRotation} setScale={setScale} setProj={setProj} />
      <Map
        rotation={rotation}
        scale={scale}
        projectionType={projectionType}
        geographiesData={geographiesData}
        state={state}
        handleCountryClick={handleCountryClick}
      />
    </div>
      <CountrySearch handleCountryClick={handleCountryClick} state={state}/>
      <SmallCountries state={state} />
    </div>
  );
}

function SmallCountries({ state }) {
  // Convert the state object to an array of countries with their states
  const countryStates = Object.entries(state).map(([name, stateObj]) => ({
    name,
    state: stateObj.state, // Now accessing state property of the object
    color: stateObj.color  // You can also use the color here if needed
  }));

  // Filter out small countries and exclude those in the initial state
  const smallSelectedCountries = countryStates.filter(country => 
    SMALL_COUNTRIES.includes(country.name) && country.state !== 0
  );

  // Function to convert state value to a readable string
  const stateToString = (stateValue) => {
    switch(stateValue) {
      case 1: return 'Red';
      case 2: return 'Blue';
      case 3: return 'Neutral';
      default: return ''; // We don't expect this to be used given the filter
    }
  };

  return (
    <div className="info-box">
      {smallSelectedCountries.length > 0 ? (
        <ul>
          <li>Small countries list</li>
          {smallSelectedCountries.map((country) => (
            <li key={country.name}>{country.name} - {stateToString(country.state)}</li>
          ))}
        </ul>
      ) : (
        <p>No small countries selected</p>
      )}
    </div>
  );
}



const SMALL_COUNTRIES = [
  "Andorra",
  "Antigua and Barbuda",
  "Bahrain",
  "Barbados",
  "Comoros",
  "Dominica",
  "Grenada",
  "Kiribati",
  "Liechtenstein",
  "Luxembourg", 
  "Maldives",
  "Malta",
  "Marshall Islands",
  "Mauritius", 
  "Micronesia",
  "Monaco",
  "Nauru",
  "Palau",
  "Saint Kitts and Nevis",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Seychelles",
  "Singapore",
  "Tonga",
  "Tuvalu",
  "Vatican City"
];

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
