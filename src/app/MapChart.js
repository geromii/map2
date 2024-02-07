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
      <div className='map-container z-11 lg:absolute top-0 right-0 bottom-0 left-0 lg:z-0 lg:overflow-hidden sm:overflow-auto'>
        <Map
          rotation={rotation}
          scale={scale}
          projectionType={projectionType}
          geographiesData={geographiesData}
          state={stateWrapper}
          handleCountryClick={handleCountryClick}
        />
      </div>
      <div className="map-controls pt-2 pb-2 border-x-4 border-y-2 lg:border-y-4 lg:absolute lg:top-0 lg:left-0 z-10 bg-slate-100 lg:h-28 lg:w-52 lg:rounded-br-3xl lg:pt-0 lg:overflow-hidden" >
         <MapControls setRotation={setRotation} setScale={setScale} setProj={setProj} isProjectionActive={isProjectionActive} 
        setIsProjectionActive={setIsProjectionActive} isSecondOrderActive={isSecondOrderActive} 
        setIsSecondOrderActive={setIsSecondOrderActive} dispatch={dispatch} state={stateWrapper}/>
      </div>
      <div className="country-search border-x-4 border-y-2 lg:border-y-4 pl-2 pr-2 pt-2 pb-2 lg:absolute lg:top-0 lg:right-0 z-10 bg-slate-100 lg:overflow-x-hidden lg:overflow-y-auto lg:rounded-bl-3xl lg:pl-2 lg:h-28 lg:w-52">
          <SearchCountry handleCountryClick={handleCountryClick} state={stateWrapper} useCountries={useCountries}/>
        </div>
      <div className="Card-Info z-10 h-12">
      </div>
    
  </div>
  );
}

const ScoreInfo = (stateWrapper) => {
  function sumProbabilities(stateWrapper) {
    const state = stateWrapper.state;

    const sum = Object.entries(state).reduce((acc, [countryName, countryData], index) => { 
        if (typeof countryData.probability === 'number') {
            return acc + Math.abs(countryData.probability);
        } else {
            console.warn(`Invalid probability value for ${countryName} at index ${index}:`, countryData);
            return acc;
        }
    }, 0);

    const roundedSum = Number(sum.toFixed(1));
    return roundedSum;

}




let severity_score = sumProbabilities(stateWrapper);
  return (
    <div className="second-order-info-box font-bold"> 
      <br></br>
      Global Severity score is {severity_score}
    </div>
  );
};





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
          <label className="toggle-label relative -top-0.5" onClick={handleToggle}> Pacific</label>
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