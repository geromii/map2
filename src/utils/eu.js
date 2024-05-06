import { useEffect, useState } from "react";

const useEuCountries = () => {
  const [euCountries, setEuCountries] = useState([]);

  useEffect(() => {
    fetch('/eu.json')
      .then(response => response.json())
      .then(data => setEuCountries(data))
      .catch(error => console.error('Error loading EU countries:', error));
  }, []);

  return euCountries;
};

export default useEuCountries;
