import React, { useState, useEffect } from 'react';

import useCountryStore from './useCountryStore';

import { getCountryEmoji } from '../utils/countryEmojis';

function TabStats() {
  const [sortedCountries, setSortedCountries] = useState([]);
  const [phase2Countries, setPhase2Countries] = useState([]);
  const [phase3Countries, setPhase3Countries] = useState([]);

  const countries = useCountryStore((state) => state.countries);

  useEffect(() => {
    const phase0Countries = Object.entries(countries)
      .filter(([_, value]) => value.phase === 0);

    const sorted = phase0Countries
      .sort((a, b) => a[1].probability - b[1].probability)
      .map(entry => ({ country: entry[0], probability: entry[1].probability }));

    const top3 = sorted.slice(0, 4);
    const bottom3 = sorted.slice(-4).reverse();

    setSortedCountries([...top3, ...bottom3]);

    // Collecting countries in Phase 2 and Phase 3
    const phase2 = Object.entries(countries)
      .filter(([_, value]) => value.phase === 2)
      .map(([key, _]) => key);
    const phase3 = Object.entries(countries)
      .filter(([_, value]) => value.phase === 3)
      .map(([key, _]) => key);

    setPhase2Countries(phase2);
    setPhase3Countries(phase3);
  }, [countries]);

  return (
    <div className="flex items-center justify-around w-full">
      <div className="text-center w-full">
        <div className="flex justify-around w-full items-center align-middle pb-1">
          <div className="flex w-1/6">
            <table className="text-xl font-semibold">
              <tbody>
                {phase2Countries.map((country, index) => (
                  <tr key={index}>
                    <td>{getCountryEmoji(country)}</td>
                    <td>{country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex w-6/12 items-center align-center justify-between ">
            <table className="w-full table-fixed">
              <tbody>
                {sortedCountries.slice(-4).map((entry, index) => (
                  <tr key={index}>
                    <td className = "w-2/12">{getCountryEmoji(entry.country)}</td>
                    <td className = "w-8/12 truncate">{entry.country}</td>
                    <td className = "w-2/12 text-right">{entry.probability.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="w-full table-fixed ">
              <tbody>
                {sortedCountries.slice(0, 4).map((entry, index) => (
                  <tr key={index}>
                    <td className="w-2/12">{getCountryEmoji(entry.country)}</td>
                    <td className="w-8/12 truncate">{entry.country}</td>
                    <td className="w-2/12 text-right">{entry.probability.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex w-1/6">
            <table className="text-xl font-semibold">
              <tbody>
                {phase3Countries.map((country, index) => (
                  <tr key={index}>
                    <td>{getCountryEmoji(country)}</td>
                    <td>{country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TabStats;