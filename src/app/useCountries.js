import { useState, useEffect } from "react";

export function useCountries(searchValue) {
  const [allCountries, setAllCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);

  useEffect(() => {
    fetch("/countries.json") // Change the URL to point to your "countries.json" file
      .then(response => response.json())
      .then(data => {
        // Assuming data is an array of country names in "countries.json"
        setAllCountries(data.sort());
      });
  }, []);

  useEffect(() => {
    setFilteredCountries(
      allCountries.filter(country =>
        country.toLowerCase().includes(searchValue.toLowerCase())
      )
    );
  }, [searchValue, allCountries]);

  return { allCountries, filteredCountries };
}
