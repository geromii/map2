'use client'

import React, { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, Sphere,
  Graticule } from "react-simple-maps";
import './MapChart.css';

// const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";



export default function MapChart() {
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [rotation, setRotation] = useState([-10, 0, 0]);
  const [scale, setScale] = useState(180) // Step 1: introduce a state for rotation6
  const [projectionType, setProj] = useState("geoEqualEarth");


  const [searchValue, setSearchValue] = useState('');
  const [allCountries, setAllCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);

  useEffect(() => {
    setFilteredCountries(
      allCountries.filter(country => 
        country.toLowerCase().includes(searchValue.toLowerCase())
      )
    );
  }, [searchValue, allCountries]);


  const handleCountryClick = (countryName) => {
    setSelectedCountries((prevCountries) => {
      const country = prevCountries.find(c => c.name === countryName);
  
      if (!country) {
        return [...prevCountries, { name: countryName, side: "Red" }];
      }
  
      const updatedSide = getNextSide(country.side);
      if (updatedSide === "Red" && country.side === "dedicated neutral") { // Add this condition
        return prevCountries.filter(c => c.name !== countryName);
      }
  
      const updatedCountry = { ...country, side: updatedSide };
      return prevCountries.map(c => c.name === countryName ? updatedCountry : c);
    });
  };
  

  const getNextSide = (currentSide) => {
    switch (currentSide) {
      case "Red": return "Blue";
      case "Blue": return "dedicated neutral";
      case "dedicated neutral": return "Red"; // Or, if you want to remove it from the list when clicking after "dedicated neutral", handle it in `handleCountryClick`.
      default: return "Red";
    }
  };
  

  const getCountryColor = (countryName) => {
    const country = selectedCountries.find(c => c.name === countryName);
    if (!country) return "#b0b0b0";
    switch (country.side) {
      case "Red": return "red";
      case "Blue": return "#4af";
      case "dedicated neutral": return "#646464"; // Color for dedicated neutral
      default: return "#b0b0b0";
    }
  };
  

  return (
    <div className="map-container">
      <div className="view-options">
        <button onClick={() => { setRotation([-10, 0, 0]); setScale(180); setProj("geoEqualEarth")}}>Default </button>
        <button onClick={() => { setRotation([-10, -40, 0]); setScale(180); setProj("geoEqualEarth")}}> North Pole </button>
        <button onClick={() => { setRotation([-147, 0, 0]); setScale(155); setProj("geoEqualEarth")}}>Pacific </button> 
        <button 
    onClick={() => { 
        setRotation([-60, -20, 0]); setScale(240); setProj("geoOrthographic");}}> Globe-Eurasia 
        </button>
      </div>


  
      <ComposableMap 
          viewBox = "25 55 800 500"
          projection= {projectionType}
          projectionConfig={{
            rotate: rotation,
            scale: scale,
          }}>
        <Sphere stroke="#E4E5E6" strokeWidth={0.5} />
        <Graticule stroke="#E4E5E6" strokeWidth={0.5} />
        <Geographies geography="/features.json">
         {({ geographies }) => {
             // If allCountries is empty, populate it with the country names from geographies
             if (allCountries.length === 0) {
             setAllCountries(geographies.map(geo => geo.properties.name).sort());
              }
    
              // Render each country on the map
             return geographies.map((geo) => (
             <Geography
               key={geo.rsmKey}
               geography={geo}
                onClick={() => handleCountryClick(geo.properties.name)}
                stroke="white"
                strokeWidth={0.3}
                style={{
               default: {
                 fill: getCountryColor(geo.properties.name),
                 outline: "none"
               },
               hover: {
                 fill: getCountryColor(geo.properties.name),
                 outline: "none"
               },
               pressed: {
                 fill: getCountryColor(geo.properties.name),
                 outline: "none"
              }
                }}
             />
               ));
             }}
            </Geographies>
      </ComposableMap>
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
          color: getCountryColor(country)
        }}
      >
        {country}
      </div>
    ))}
  </div>
</div>

  
      <CountryInfo countries={selectedCountries} />
    </div>
  );
}

function CountryInfo({ countries }) {
  const smallSelectedCountries = countries.filter(country => 
    SMALL_COUNTRIES.includes(country.name)
  );

  return (
    <div className="info-box">
      {smallSelectedCountries.length > 0 ? (
        <ul>
          <li>Small countries list</li>
          {smallSelectedCountries.map((country, index) => (
            <li key={index}>{country.name} - {country.side}</li>
          ))}
        </ul>
      ) : (
        <p>Small countries list</p>
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
  "Luxembourg", // Added
  "Maldives",
  "Malta",
  "Marshall Islands",
  "Mauritius", // Added
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

