import React, { useState, useEffect } from 'react';
import useCountryStore from '../../app/useCountryStore';
import {
  CardContent,
} from "@/components/ui/card"


function TabDemographic({phase2Countries, phase3Countries, pageMode, displayStats}) {
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

  const singleModeNoStats = pageMode != "single" && displayStats == false;

  if (isLoading) {
    return <div data-hidedemo={singleModeNoStats} className="w-full h-full flex justify-center items-center data-[hidedemo=true]:opacity-0">Loading...</div>;
  }

  const phase2Data = aggregatedData.phase2;
  const phase3Data = aggregatedData.phase3;

  // condition that is true if pageMode == single and displayStats == false

  return (
    <CardContent>
    <div  data-pagemode={pageMode} className="w-full h-full data-[pagemode=single]:translate-y-8">
      <table data-hidedemo={singleModeNoStats} className="w-full h-full data-[hidedemo=true]:opacity-0 transition duration-75">
        <thead className='text-center text-xs md:text-sm lg:text-base'>
          <tr style={{height: '10%'}}>
            <th style={{width: '30%'}} >Countries</th>
            <th style={{width: '15%'}}>GDP</th>
            <th style={{width: '15%'}}>GDP PPP</th>
            <th style={{width: '15%'}}>Population</th>
            <th style={{width: '15%'}}>Area (km²)</th>
          </tr>
        </thead>
        <tbody className='text-end text-xs md:text-sm lg:text-base'>
          {/* Ensure you apply the same styling for each td element as their corresponding th */}
          <tr>
            
            <td style={{width: '20%'}} className = "text-blue-700 h-full"> <div className=' overflow-auto h-12'>{phase2Countries.join(', ')}</div></td>
            <td style={{width: '20%'}} className = "align-top">{formatMoney(phase2Data.GDP)}</td>
            <td style={{width: '20%'}} className = "align-top">{formatMoney(phase2Data.GDP_PPP)}</td>
            <td style={{width: '15%'}} className = "align-top">{formatPopulation(phase2Data.Population)}</td>
            <td style={{width: '15%'}} className = "align-top">{formatArea(phase2Data.Area)}</td>
          </tr>
          <tr data-pagemode={pageMode} className="data-[pagemode=single]:hidden">
            <td style={{width: '20%'}} className = "text-red-700 h-full"> <div className='h-12 overflow-auto'>{phase3Countries.join(', ')}</div></td>
            <td style={{width: '20%'}} className = "align-top">{formatMoney(phase3Data.GDP)}</td>
            <td style={{width: '20%'}} className = "align-top">{formatMoney(phase3Data.GDP_PPP)}</td>
            <td style={{width: '15%'}} className = "align-top">{formatPopulation(phase3Data.Population)}</td>
            <td style={{width: '15%'}} className = "align-top">{formatArea(phase3Data.Area)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    </CardContent>
  );
}



export default TabDemographic;
