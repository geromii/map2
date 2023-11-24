import { useState, useEffect } from "react";

export function useCountries(searchValue) {
  const [allCountries, setAllCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);

  useEffect(() => {
    fetch("/features.json")
      .then(response => response.json())
      .then(data => {
        const geometries = data.objects.world.geometries;
        setAllCountries(geometries.map(geo => geo.properties.name).sort());
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