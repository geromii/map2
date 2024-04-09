import React, { useState, useEffect } from 'react';
import useCountryStore from './useCountryStore';

function TabDemographic() {
  const [aggregatedData, setAggregatedData] = useState({
    phase2: { countries: [], GDP: 0, GDP_PPP: 0, Population: 0, Area: 0 },
    phase3: { countries: [], GDP: 0, GDP_PPP: 0, Population: 0, Area: 0 }
  });
  const countries = useCountryStore((state) => state.countries);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/demographics.json")
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        const aggregation = data.reduce((acc, item) => {
          const phase = countries[item.Country]?.phase;
          if (phase === 2 || phase === 3) {
            acc[`phase${phase}`].countries.push(item.Country);
            acc[`phase${phase}`].GDP += item.GDP;
            acc[`phase${phase}`].GDP_PPP += item.GDP_PPP;
            acc[`phase${phase}`].Population += item.Population;
            acc[`phase${phase}`].Area += item.Area;
          }
          return acc;
        }, {
          phase2: { countries: [], GDP: 0, GDP_PPP: 0, Population: 0, Area: 0 },
          phase3: { countries: [], GDP: 0, GDP_PPP: 0, Population: 0, Area: 0 }
        });

        setAggregatedData(aggregation);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        setIsLoading(false);
      });
  }, [countries]);

  const formatMoney = (value) => {
    const trillion = value / 1e6; // Convert to trillion
    if (value == 0) {
      return "$0.00"
    }
    if (trillion >= 1) {
      return `$${trillion.toFixed(2)} trillion`;
    } else {
      const billion = value / 1e3; // Convert to billion
      return `$${billion.toFixed(0)} billion`;
    }
  };

  const formatPopulation = (population) => {
    if (population == 0 ) {
      return "0"
    }
    if (population >= 1e9) {
      return `${(population / 1e9).toFixed(1)} billion`;
    } else {
      return `${(population / 1e6).toFixed(1)} million`;
    }
  };

  const formatArea = (area) => area.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (isLoading) {
    return <div className="w-full h-full flex justify-center items-center">Loading...</div>;
  }

  const phase2Data = aggregatedData.phase2;
  const phase3Data = aggregatedData.phase3;

  return (
    <div className="w-full h-full">
      <table className="w-full h-full">
        <thead className='text-center text-xs sm:text-sm md:text-base lg:text-lg'>
          <tr style={{height: '10%'}}>
            <th style={{width: '20%'}}>Countries</th>
            <th style={{width: '20%'}}>GDP</th>
            <th style={{width: '20%'}}>GDP PPP</th>
            <th style={{width: '15%'}}>Population</th>
            <th style={{width: '15%'}}>Area (km²)</th>
          </tr>
        </thead>
        <tbody className='text-end text-xs sm:text-sm md:text-base lg:text-lg'>
          {/* Ensure you apply the same styling for each td element as their corresponding th */}
          <tr className="bg-blue-700">
            <td style={{width: '20%'}}>{phase2Data.countries.join(', ')}</td>
            <td style={{width: '20%'}}>{formatMoney(phase2Data.GDP)}</td>
            <td style={{width: '20%'}}>{formatMoney(phase2Data.GDP_PPP)}</td>
            <td style={{width: '15%'}}>{formatPopulation(phase2Data.Population)}</td>
            <td style={{width: '15%'}}>{formatArea(phase2Data.Area)}</td>
          </tr>
          <tr className="bg-red-700">
            <td style={{width: '20%'}}>{phase3Data.countries.join(', ')}</td>
            <td style={{width: '20%'}}>{formatMoney(phase3Data.GDP)}</td>
            <td style={{width: '20%'}}>{formatMoney(phase3Data.GDP_PPP)}</td>
            <td style={{width: '15%'}}>{formatPopulation(phase3Data.Population)}</td>
            <td style={{width: '15%'}}>{formatArea(phase3Data.Area)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}


export default TabDemographic;
