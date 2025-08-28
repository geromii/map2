"use client";

import React, { useEffect, useState } from "react";
import { IconArrowsShuffle } from "@tabler/icons-react";
import useCountryStore from "../../app/useCountryStore";
import IconButton from "./boxbutton";
import { demographics as demographicsData, emojis } from "../../data/appData";

const countryEmojis = emojis;

const ShufflePopup = ({ isVisible, singleMode }) => {
  const [currentFlags, setCurrentFlags] = useState([]);

  useEffect(() => {
    let intervalId;

    if (isVisible) {
      intervalId = setInterval(() => {
        const randomFlags = [];
        for (let i = 0; i < 2; i++) {
          const randomIndex = Math.floor(Math.random() * countryEmojis.length);
          randomFlags.push(countryEmojis[randomIndex][1]);
        }
        setCurrentFlags(randomFlags);
      }, 100);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl z-50 bg-white shadow-2xl border-2 rounded-lg">
      <span className=" drop-shadow-sm">{currentFlags[0]}</span>

      {!singleMode && (
        <span className=" drop-shadow-sm">{currentFlags[1]}</span>
      )}
    </div>
  );
};


const MAX_RECENT = 10; // Number of recent countries to keep track of

const ShuffleCountries = ({ singleMode = false }) => {
  const setCountryPhase = useCountryStore((state) => state.setCountryPhase);
  const resetAllExcept = useCountryStore((state) => state.resetAllExcept);
  const [countries, setCountries] = useState({});
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [recentCountries, setRecentCountries] = useState([]); // Track recent selections to improve feeling of randomness
  const [isShuffling, setIsShuffling] = useState(false);

  const gdpFilter = singleMode ? 5000 : 50000;
  const populationFilter = singleMode ? 500000 : 5000000;
  
  useEffect(() => {
    const loadCountries = () => {
      const filteredCountries = demographicsData.filter(
        (country) =>
          country.GDP >= gdpFilter && country.Population >= populationFilter
      );
      const countriesDict = filteredCountries.reduce((acc, country) => {
        acc[country.Country] = { ...country, phase: 0 };
        return acc;
      }, {});
      setCountries(countriesDict);
    };

    loadCountries();
  }, []);

  const updateRecentCountries = (newCountry) => {
    setRecentCountries((prev) => {
      const updatedList = [newCountry, ...prev];
      if (updatedList.length > MAX_RECENT) {
        updatedList.pop(); // Remove the oldest country to maintain the list size
      }
      return updatedList;
    });
  };

  const shuffleCountries = () => {
    if (isShuffling) return; 
    setIsShuffling(true);

    if (singleMode) {
      resetAllExcept();
    }
    const availableCountries = Object.entries(countries)
      .filter(([name, country]) => country.phase === 0 && !recentCountries.includes(name))
      .map(([name]) => name);

  

    const randomIndex1 = Math.floor(Math.random() * availableCountries.length);
    const randomIndex2 = Math.floor(Math.random() * availableCountries.length);
    const country1 = availableCountries[randomIndex1];
    let country2 = availableCountries[randomIndex2];

    while (country2 === country1) {
      country2 =
        availableCountries[
          Math.floor(Math.random() * availableCountries.length)
        ];
    }

    setIsPopupVisible(true);

    setTimeout(() => {
      setIsPopupVisible(false);
      setCountryPhase(country1, 2);
      updateRecentCountries(country1); // Update the recent list with the first country

      if (!singleMode) {
        setCountryPhase(country2, 3);
        updateRecentCountries(country2); // Update the recent list with the second country
      }
      setIsShuffling(false);
    }, 900);
  };


  return singleMode ? (
    <div className = "grid grid-cols-2 bg-red-500 w-full mx-4">
      <button className="col-span-2 flex h-full w-full rounded text-primary-foreground bg-primary shadow  p-1 text-center items-center justify-center ring-2 ring-yellow-400 " onClick={shuffleCountries}>
        <IconArrowsShuffle size={28} className="mr-2" /> <p className="font-medium text-sm lg:text-base">Random </p>
      </button>
      <ShufflePopup isVisible={isPopupVisible} singleMode={singleMode} />
    </div>
  ) : (
    <div className="rounded text-primary-foreground active:shadow-sm">
      <IconButton
        icon={IconArrowsShuffle}
        size="medium"
        aria-label="Shuffle countries - select random countries"
        onClick={shuffleCountries}
      />
      <ShufflePopup isVisible={isPopupVisible} singleMode={singleMode} />
    </div>
  );
};

export default ShuffleCountries;

