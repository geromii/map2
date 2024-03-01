import { useState, useEffect } from "react";

export function useCountries(searchValue) {
  const [allCountries, setAllCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);

  useEffect(() => {
    fetch("/countries.json") 
      .then((response) => response.json())
      .then((data) => {
        setAllCountries(data.sort());
      });
  }, []);

  useEffect(() => {
    setFilteredCountries(
      allCountries.filter((country) =>
        country.toLowerCase().includes(searchValue.toLowerCase()),
      ),
    );
  }, [searchValue, allCountries]);

  return { allCountries, filteredCountries };
}
