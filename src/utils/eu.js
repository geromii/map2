import { useEffect, useState } from "react";
import { euCountries as euCountriesData } from "../data/appData";

const useEuCountries = () => {
  const [euCountries, setEuCountries] = useState([]);

  useEffect(() => {
    setEuCountries(euCountriesData);
  }, []);

  return euCountries;
};

export default useEuCountries;
