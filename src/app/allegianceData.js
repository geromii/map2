import { useState, useEffect, useMemo } from 'react';

const useAllegianceData = () => {
  const [countries, setCountries] = useState([]);
  const [scoresMatrix, setScoresMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/countries.json').then((res) => res.json()),
      fetch('/scores_matrix.json').then((res) => res.json())
    ]).then(([countriesData, scoresData]) => {
      setCountries(countriesData);
      setScoresMatrix(scoresData);
      setLoading(false);
    }).catch(error => {
      setError(error);
      setLoading(false);
    });
  }, []);

  const allegianceMatrix = useMemo(() => {
    // Perform matrix multiplication or other calculations here
    // Return the result
  }, [countries, scoresMatrix]);

  return { countries, scoresMatrix, allegianceMatrix, loading, error };
};
