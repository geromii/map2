'use client'

import React, { useState, useEffect, useCallback, useReducer, memo } from "react";
import { ComposableMap, Geographies, Geography, Sphere,
  Graticule } from "react-simple-maps";
import { useCountries } from './useCountries';
import './MapChart.css';
import { countriesReducer, initialState } from './countriesReducer';
import { multiplyWithScoresMatrix } from './matrixOperations';
import {Tooltip} from 'react-tooltip';
import { useStore } from './store';
import { SearchCountry } from "@/components/ui/SearchCountry";
import { Switch } from '@/components/ui/switch';
import { geoRobinson } from "d3-geo-projection";


// const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/*
Future goals for this project:
1. Demographic information of each side
2. fix the data. perhaps square all values?
3. change the color scheme multiplier from 0.5 to 1
4. decide to delete or fix the second order setting
5 . Toggle between: different projections? different color schemes? different data?
6. Option to amplify/bolden when the projections are small
7. Text based summary


Possible in the backened I need to weigh the importance of each relationship.


*/



export default function MapChart() {
  const { rotation, setRotation } = useStore(state => ({ rotation: state.rotation, setRotation: state.setRotation }));
  const [scale, setScale] = useState(180);
  const [projectionType, setProj] = useState("geoMercator");
  const [geographiesData, setGeographiesData] = useState([]);
  const [stateWrapper, dispatch] = useReducer(countriesReducer, initialState);
  const [isCountrySearchVisible, setIsCountrySearchVisible] = useState(false);
  const [isProjectionActive, setIsProjectionActive] = useState(true);
  const [isSecondOrderActive, setIsSecondOrderActive] = useState(false);



  // First useEffect: Retain this for fetching geographies data
  useEffect(() => {
    fetch("/features.json")
      .then(response => response.json())
      .then(data => {
        const geometries = data.objects.world.geometries;
        setGeographiesData(data);
      });
  }, []);


 
  let dispatchTimeoutId; // Variable to store the timeout ID

  const handleCountryClick = (countryName) => {
  dispatch({ type: 'INCREMENT_COUNTRY_STATE', payload: countryName });

  // Clear any existing timeout to reset the delay
  clearTimeout(dispatchTimeoutId);

  // Set a new timeout
  dispatchTimeoutId = setTimeout(async () => {
      // Step 1: Clone the state
      const clonedState = JSON.parse(JSON.stringify(stateWrapper));

      // Step 2: Update the cloned state
      const currentState = clonedState[countryName].state;
      const nextState = (currentState + 1) % 4;
      clonedState[countryName] = {
          ...clonedState[countryName],
          state: nextState,
      };

      // Step 3: Pass the cloned state to the function
      const resultArray = await multiplyWithScoresMatrix(clonedState, isProjectionActive, isSecondOrderActive);

      dispatch({ type: 'SET_PROBABILITIES', payload: { probabilities: resultArray } });
  }, 75); 
};



  // Example of how to use the reducer function
  // let newState = countriesReducer(currentState, { type: 'INCREMENT_COUNTRY', payload: 'Country1' });
  // let color = getCountryColor(newState['Country1']);




  return (
    <div className="transition ease-in-out whole-container h-screen w-screen" >
      <div className="block">
      <div className='map-container z-11 lg:relative top-0 right-0 bottom-0 left-0 lg:z-0 overflow-auto lg:border-b-4'>
        <Map
          rotation={rotation}
          scale={scale}
          projectionType={projectionType}
          geographiesData={geographiesData}
          state={stateWrapper}
          handleCountryClick={handleCountryClick}
        />
      </div>
      <div className="map-controls pt-2 pb-2 border-x-4 border-y-2 lg:border-y-4 lg:absolute lg:top-0 lg:left-0 z-10 bg-slate-100 lg:h-28 lg:w-52 lg:rounded-br-3xl lg:pt-0 lg:overflow-hidden lg:pl-6" >
         <MapControls setRotation={setRotation} setScale={setScale} setProj={setProj} isProjectionActive={isProjectionActive} 
        setIsProjectionActive={setIsProjectionActive} isSecondOrderActive={isSecondOrderActive} 
        setIsSecondOrderActive={setIsSecondOrderActive} dispatch={dispatch} state={stateWrapper}/>
      </div>
      <div className="country-search border-x-4 border-y-2 lg:border-y-4 pl-2 pr-2 pt-2 pb-2 lg:absolute lg:top-0 lg:right-0 z-10 bg-slate-100 lg:overflow-x-hidden lg:overflow-y-auto lg:rounded-bl-3xl lg:pl-1 lg:h-28 lg:w-52">
          <SearchCountry handleCountryClick={handleCountryClick} state={stateWrapper} useCountries={useCountries}/>
        </div>
       <div className="instructions lg:hidden">
        <Instructions/>
      </div>
      </div>
      <div className="instructions hidden lg:block">
           <Instructions/>
        </div>
  </div>
  );
}

const Instructions = () => {
  return (
    <article class="max-w-4xl mx-auto px-5 py-8 lg:max-w-6xl lg:px-8">
    <header class="mb-12">
      <h1 class="text-3xl font-bold text-gray-900 lg:text-4xl">How to use</h1>
    </header>
    <section class="mb-8 lg:mb-12">
      <h2 class="text-2xl font-semibold text-gray-800 lg:text-3xl">Countries have 4 states:</h2>
      <ol class="list-decimal list-inside bg-white p-6 rounded-lg shadow space-y-3 lg:p-8">
        <li class="color-transition font-medium lg:text-lg">Undecided (Variable)</li>
        <li class="text-red-800 font-medium lg:text-lg">Side A (Dark Red)</li>
        <li class="text-blue-800 font-medium lg:text-lg">Side B (Dark Blue)</li>
        <li class="text-gray-700 font-medium lg:text-lg">Neutral (Dark Gray)</li>
      </ol>
      <p class="mt-6 text-gray-700 lg:text-lg">Clicking a country (or selecting it through the search) will cycle its state.</p>
    </section>
    <section class="mb-6">
      <h2 class="text-2xl font-semibold text-gray-700"><span class="font-bold">Geopolitics Mode</span>:</h2>
      <p class="text-gray-600 mt-2">When <span class="font-bold">Geopolitics Mode</span> is on and there is at least one country in each of <span class="text-red-800">Side A</span> and <span class="text-blue-800">Side B</span>, every country in the default state receives a probability of siding with either <span class="text-red-800">Side A</span> or <span class="text-blue-800">Side B</span> depending on its relationships with the respective sides. Each country's probability of siding with <span class="text-red-800">A</span> or <span class="text-blue-800">B</span> will be reflected by their color on the map.</p>
    </section>
    <section>
      <h2 class="text-2xl font-semibold text-gray-700"><span class="font-bold">War Outbreak Mode</span>:</h2>
      <p class="text-gray-600 mt-2">When <span class="font-bold">War Outbreak Mode</span> is on the calculation gets more complex. Instead, the countries in the default state now receive a predicted side according to what their allies think about the conflict (the second order relationship). For example, <span class="color-transition font-medium">Germany</span> may not initially take a side if <span class="text-red-800">Saudi Arabia</span> and <span class="text-blue-800">Iran</span> go to war, but when all of its major allies side with <span class="text-red-800">Saudi Arabia</span>, they are much more inclined to do the same. However, if an ally is in the <span class="text-gray-800 font-medium">Neutral</span> state then that country will be excluded from the calculation.</p>
    </section>
  </article>
  )
}




const MapControls = ({ setRotation, setScale, setProj, isProjectionActive, 
  setIsProjectionActive, isSecondOrderActive, setIsSecondOrderActive, dispatch, state}) => {
  const [isPacific, setIsPacific] = useState(false);

  const handleToggle = () => {
    setIsPacific(!isPacific);
    if (!isPacific) {
      setRotation([-150, 0, 0]);
      setScale(160);
      setProj("geoEqualEarth");
    } else {
      setRotation([-10, 0, 0]);
      setScale(180);
      setProj("geoEqualEarth");
    }
  };

  const handleProjectionToggle = async () => {
    setIsProjectionActive(current => {
      const newState = !current;
      if (!newState) {
        setIsSecondOrderActive(false);
      }
      updateProbabilities(newState, newState ? isSecondOrderActive : false); // Pass the new state directly and ensure second order is turned off if projection is off
      return newState;
    });
};

const handleSecondOrderToggle = async () => {
    setIsSecondOrderActive(current => {
      const newState = !current;
      if (newState) {
        setIsProjectionActive(true);
      }
      updateProbabilities(true, newState); // Ensure projection is on when second order is toggled on
      return newState;
    });
};

const updateProbabilities = async (newIsProjectionActive, newIsSecondOrderActive) => {
    // Update state with scores matrix
    const resultArray = await multiplyWithScoresMatrix(state, newIsProjectionActive, newIsSecondOrderActive);
    dispatch({
      type: 'SET_PROBABILITIES',
      payload: {
        probabilities: resultArray,
        isProjectionActive: newIsProjectionActive,
        isSecondOrderActive: newIsSecondOrderActive
      }
    });
};

  

return (
  <div className="view-options-container flex lg:block justify-center items-center h-full lg:justify-start lg:items-start lg:h-auto">
      <div className="inline lg:block ml-2 lg:ml-0 mt-2 lg:mt-2">
          <Switch
              checked={isPacific}
              onCheckedChange={handleToggle}
              // Add additional Shadcn Switch props as needed
          />
          <label className="toggle-label relative -top-0.5" onClick={handleToggle}> Pacific View</label>
      </div>
          <div className="inline lg:block ml-2 lg:ml-0 mt-2 lg:mt-2">
              <Switch
                  checked={isProjectionActive}
                  onCheckedChange={handleProjectionToggle}
                  // Add additional Shadcn Switch props as needed
              />
              <label className="toggle-label relative -top-0.5" onClick={handleProjectionToggle}> Geopolitics</label>
          </div>
          <div className="inline lg:block ml-2 lg:ml-0 mt-2 lg:mt-2">
              <Switch
                  checked={isSecondOrderActive}
                  onCheckedChange={handleSecondOrderToggle}
                  // Add additional Shadcn Switch props as needed
              />
              <label className="toggle-label relative -top-0.5" onClick={handleSecondOrderToggle}> War Outbreak</label>
          </div>
  </div>
);
};




const Map = ({ 
  rotation, 
  scale, 
  projectionType, 
  geographiesData, 
  state, 
  handleCountryClick, 
  getCountryColor 
}) => {
 const width = 800;
 const height = 600;

 const projection = geoRobinson().translate([width / 2, height / 2]).scale(scale).rotate(rotation);
  return (
    <div className="bg-slate-400">
    <ComposableMap 
      viewBox="-80 -10 1000 550" // 0 0 800 450
      projection={projection}
      projectionConfig={{
        rotate: rotation,
        scale: 200,
      }}>
      <Sphere stroke="#E4E5E6" strokeWidth={0.5} />
      <Graticule stroke="#E4E5E6" strokeWidth={0.3} />
      <Geographies geography={geographiesData}>
        {({ geographies }) => geographies.map((geo) => {
          const countryState = state[geo.properties.name]; // Access the state for each country
          return (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              onClick={() => handleCountryClick(geo.properties.name)}
              stroke="black"
              strokeWidth={0.15}
              style={{
                default: {
                  fill: countryState.color, // Use the state to get the color
                  outline: "none"
                },
                hover: {
                  fill: countryState.color, // Use the state to get the color for hover as well
                  outline: "none"
                },
                pressed: {
                  fill: countryState.color, // Use the state to get the color for pressed state too
                  outline: "none"
                }
              }}
              className="country"
              data-tooltip-id="my-tooltip"
              data-tooltip-content={geo.properties.name}
            />
          );
        })}
      </Geographies>
    </ComposableMap>
    <Tooltip id="my-tooltip" float="true" delayShow = "800"/>
    </div>
  );
};