"use client";

import React, { useEffect, useState } from "react";
import { IconArrowsShuffle } from "@tabler/icons-react";
import useCountryStore from "../../app/useCountryStore";
import IconButton from "./boxbutton";

const countryEmojis = [
  // Yes Im aware this is dumb but it's just a quick shuffle tool for now
  ["Afghanistan", "🇦🇫"],
  ["Albania", "🇦🇱"],
  ["Algeria", "🇩🇿"],
  ["Andorra", "🇦🇩"],
  ["Angola", "🇦🇴"],
  ["Antigua and Barbuda", "🇦🇬"],
  ["Argentina", "🇦🇷"],
  ["Armenia", "🇦🇲"],
  ["Australia", "🇦🇺"],
  ["Austria", "🇦🇹"],
  ["Azerbaijan", "🇦🇿"],
  ["Bahamas", "🇧🇸"],
  ["Bahrain", "🇧🇭"],
  ["Bangladesh", "🇧🇩"],
  ["Barbados", "🇧🇧"],
  ["Belarus", "🇧🇾"],
  ["Belgium", "🇧🇪"],
  ["Belize", "🇧🇿"],
  ["Benin", "🇧🇯"],
  ["Bhutan", "🇧🇹"],
  ["Bolivia", "🇧🇴"],
  ["Bosnia and Herzegovina", "🇧🇦"],
  ["Botswana", "🇧🇼"],
  ["Brazil", "🇧🇷"],
  ["Brunei", "🇧🇳"],
  ["Bulgaria", "🇧🇬"],
  ["Burkina Faso", "🇧🇫"],
  ["Burundi", "🇧🇮"],
  ["Cambodia", "🇰🇭"],
  ["Cameroon", "🇨🇲"],
  ["Canada", "🇨🇦"],
  ["Cape Verde", "🇨🇻"],
  ["Central African Republic", "🇨🇫"],
  ["Chad", "🇹🇩"],
  ["Chile", "🇨🇱"],
  ["China", "🇨🇳"],
  ["Colombia", "🇨🇴"],
  ["Comoros", "🇰🇲"],
  ["Congo", "🇨🇬"],
  ["Costa Rica", "🇨🇷"],
  ["Cote d'Ivoire", "🇨🇮"],
  ["Croatia", "🇭🇷"],
  ["Cuba", "🇨🇺"],
  ["Cyprus", "🇨🇾"],
  ["Czechia", "🇨🇿"],
  ["Democratic Republic of Congo", "🇨🇩"],
  ["Denmark", "🇩🇰"],
  ["Djibouti", "🇩🇯"],
  ["Dominica", "🇩🇲"],
  ["Dominican Republic", "🇩🇴"],
  ["Ecuador", "🇪🇨"],
  ["Egypt", "🇪🇬"],
  ["El Salvador", "🇸🇻"],
  ["Equatorial Guinea", "🇬🇶"],
  ["Eritrea", "🇪🇷"],
  ["Estonia", "🇪🇪"],
  ["Eswatini", "🇸🇿"],
  ["Ethiopia", "🇪🇹"],
  ["Fiji", "🇫🇯"],
  ["Finland", "🇫🇮"],
  ["France", "🇫🇷"],
  ["Gabon", "🇬🇦"],
  ["Gambia", "🇬🇲"],
  ["Georgia", "🇬🇪"],
  ["Germany", "🇩🇪"],
  ["Ghana", "🇬🇭"],
  ["Greece", "🇬🇷"],
  ["Greenland", "🇬🇱"],
  ["Grenada", "🇬🇩"],
  ["Guatemala", "🇬🇹"],
  ["Guinea", "🇬🇳"],
  ["Guinea-Bissau", "🇬🇼"],
  ["Guyana", "🇬🇾"],
  ["Haiti", "🇭🇹"],
  ["Honduras", "🇭🇳"],
  ["Hungary", "🇭🇺"],
  ["Iceland", "🇮🇸"],
  ["India", "🇮🇳"],
  ["Indonesia", "🇮🇩"],
  ["Iran", "🇮🇷"],
  ["Iraq", "🇮🇶"],
  ["Ireland", "🇮🇪"],
  ["Israel", "🇮🇱"],
  ["Italy", "🇮🇹"],
  ["Jamaica", "🇯🇲"],
  ["Japan", "🇯🇵"],
  ["Jordan", "🇯🇴"],
  ["Kazakhstan", "🇰🇿"],
  ["Kenya", "🇰🇪"],
  ["Kiribati", "🇰🇮"],
  ["Kosovo", "🇽🇰"],
  ["Kuwait", "🇰🇼"],
  ["Kyrgyzstan", "🇰🇬"],
  ["Laos", "🇱🇦"],
  ["Latvia", "🇱🇻"],
  ["Lebanon", "🇱🇧"],
  ["Lesotho", "🇱🇸"],
  ["Liberia", "🇱🇷"],
  ["Libya", "🇱🇾"],
  ["Liechtenstein", "🇱🇮"],
  ["Lithuania", "🇱🇹"],
  ["Luxembourg", "🇱🇺"],
  ["Madagascar", "🇲🇬"],
  ["Malawi", "🇲🇼"],
  ["Malaysia", "🇲🇾"],
  ["Maldives", "🇲🇻"],
  ["Mali", "🇲🇱"],
  ["Malta", "🇲🇹"],
  ["Marshall Islands", "🇲🇭"],
  ["Mauritania", "🇲🇷"],
  ["Mauritius", "🇲🇺"],
  ["Mexico", "🇲🇽"],
  ["Micronesia", "🇫🇲"],
  ["Moldova", "🇲🇩"],
  ["Monaco", "🇲🇨"],
  ["Mongolia", "🇲🇳"],
  ["Montenegro", "🇲🇪"],
  ["Morocco", "🇲🇦"],
  ["Mozambique", "🇲🇿"],
  ["Myanmar", "🇲🇲"],
  ["Namibia", "🇳🇦"],
  ["Nauru", "🇳🇷"],
  ["Nepal", "🇳🇵"],
  ["Netherlands", "🇳🇱"],
  ["New Caledonia", "🇳🇨"],
  ["New Zealand", "🇳🇿"],
  ["Nicaragua", "🇳🇮"],
  ["Niger", "🇳🇪"],
  ["Nigeria", "🇳🇬"],
  ["North Korea", "🇰🇵"],
  ["North Macedonia", "🇲🇰"],
  ["Norway", "🇳🇴"],
  ["Oman", "🇴🇲"],
  ["Pakistan", "🇵🇰"],
  ["Palau", "🇵🇼"],
  ["Palestine", "🇵🇸"],
  ["Panama", "🇵🇦"],
  ["Papua New Guinea", "🇵🇬"],
  ["Paraguay", "🇵🇾"],
  ["Peru", "🇵🇪"],
  ["Philippines", "🇵🇭"],
  ["Poland", "🇵🇱"],
  ["Portugal", "🇵🇹"],
  ["Puerto Rico", "🇵🇷"],
  ["Qatar", "🇶🇦"],
  ["Romania", "🇷🇴"],
  ["Russia", "🇷🇺"],
  ["Rwanda", "🇷🇼"],
  ["Saint Kitts and Nevis", "🇰🇳"],
  ["Saint Lucia", "🇱🇨"],
  ["Saint Vincent and the Grenadines", "🇻🇨"],
  ["Samoa", "🇼🇸"],
  ["San Marino", "🇸🇲"],
  ["Sao Tome and Principe", "🇸🇹"],
  ["Saudi Arabia", "🇸🇦"],
  ["Senegal", "🇸🇳"],
  ["Serbia", "🇷🇸"],
  ["Seychelles", "🇸🇨"],
  ["Sierra Leone", "🇸🇱"],
  ["Singapore", "🇸🇬"],
  ["Slovakia", "🇸🇰"],
  ["Slovenia", "🇸🇮"],
  ["Solomon Islands", "🇸🇧"],
  ["Somalia", "🇸🇴"],
  ["South Africa", "🇿🇦"],
  ["South Korea", "🇰🇷"],
  ["South Sudan", "🇸🇸"],
  ["Spain", "🇪🇸"],
  ["Sri Lanka", "🇱🇰"],
  ["Sudan", "🇸🇩"],
  ["Suriname", "🇸🇷"],
  ["Sweden", "🇸🇪"],
  ["Switzerland", "🇨🇭"],
  ["Syria", "🇸🇾"],
  ["Taiwan", "🇹🇼"],
  ["Tajikistan", "🇹🇯"],
  ["Tanzania", "🇹🇿"],
  ["Thailand", "🇹🇭"],
  ["Timor", "🇹🇱"],
  ["Togo", "🇹🇬"],
  ["Tonga", "🇹🇴"],
  ["Trinidad and Tobago", "🇹🇹"],
  ["Tunisia", "🇹🇳"],
  ["Turkey", "🇹🇷"],
  ["Turkmenistan", "🇹🇲"],
  ["Tuvalu", "🇹🇻"],
  ["Uganda", "🇺🇬"],
  ["Ukraine", "🇺🇦"],
  ["United Arab Emirates", "🇦🇪"],
  ["United Kingdom", "🇬🇧"],
  ["United States", "🇺🇸"],
  ["Uruguay", "🇺🇾"],
  ["Uzbekistan", "🇺🇿"],
  ["Vanuatu", "🇻🇺"],
  ["Venezuela", "🇻🇪"],
  ["Vietnam", "🇻🇳"],
  ["Western Sahara", "🇪🇭"],
  ["Yemen", "🇾🇪"],
  ["Zambia", "🇿🇲"],
  ["Zimbabwe", "🇿🇼"],
];

const ShufflePopup = ({ isVisible }) => {
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
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl z-50 bg-white">
      <span>{currentFlags[0]}</span>
      <span>{currentFlags[1]}</span>
    </div>
  );
};

const ShuffleCountries = () => {
  const setCountryPhase = useCountryStore((state) => state.setCountryPhase);
  const countries = useCountryStore((state) => state.countries);
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const shuffleCountries = () => {
    const availableCountries = Object.entries(countries)
      .filter(([, country]) => country.phase === 0)
      .map(([name]) => name);

    if (availableCountries.length < 2) {
      console.log("Not enough available countries to shuffle.");
      return;
    }

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
      // Perform the final shuffle after the pop-up has finished
      setCountryPhase(country1, 2);
      setCountryPhase(country2, 3);
    }, 900);
  };

  return (
    <div className="rounded  text-primary-foreground active:shadow-sm">
      <IconButton
        icon={IconArrowsShuffle}
        size = "small"
        onClick={() => {
          shuffleCountries();
        }}
      />
      <ShufflePopup isVisible={isPopupVisible} />
    </div>
  );
};

export default ShuffleCountries;
