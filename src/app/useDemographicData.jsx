import { useState, useEffect } from "react";

export function useDemographicData() {
  const [demographicData, setDemographicData] = useState(null);

  useEffect(() => {
    fetch("demographics.json")
      .then((res) => res.json())
      .then((data) => setDemographicData(data));
  }, []);

  return demographicData;
}

