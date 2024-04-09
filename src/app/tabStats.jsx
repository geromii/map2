import React, { useState, useEffect } from 'react';

import useCountryStore from './useCountryStore';

import { getCountryEmoji } from '../utils/countryEmojis';

function TabStats() {
  const [sortedCountries, setSortedCountries] = useState([]);

  const countries = useCountryStore((state) => state.countries);

  useEffect(() => {
    const sorted = Object.entries(countries)
      .sort((a, b) => a[1].probability - b[1].probability)
      .map(entry => ({ country: entry[0], probability: entry[1].probability }));

    const top3 = sorted.slice(0, 3);
    const bottom3 = sorted.slice(-3).reverse();

    setSortedCountries([...top3, ...bottom3]);
  }, [countries]);

  return (
    <div className="flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Country Probabilities</h2>
        <div className="flex justify-center space-x-8">
          <ul>
            {sortedCountries.slice(0, 3).map((entry, index) => (
              <li key={index}>
                {getCountryEmoji(entry.country)} {entry.country}: {entry.probability.toFixed(2)}
              </li>
            ))}
          </ul>
          <ul>
            {sortedCountries.slice(-3).map((entry, index) => (
              <li key={index}>
                {getCountryEmoji(entry.country)} {entry.country}: {entry.probability.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TabStats;