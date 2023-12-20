import React from 'react';

// List of small countries
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

// SmallCountries component
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

export default SmallCountries;
