import React from 'react';
import dynamic from 'next/dynamic';

const MapChart = dynamic(
  () => import('./MapChart'),
  { ssr: false }
)

export default function Home() {
  return (
    
    <div>
      <MapChart />
    </div>
  );
}
