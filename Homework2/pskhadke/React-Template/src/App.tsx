import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import AreaChartContext from './components/AreaChartContext';
import ScatterPlotFocus from './components/ScatterPlotFocus';
import ParallelCoordinatesFocus from './components/ParallelCoordinatesFocus';

const App: React.FC = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    d3.csv('/spotify_data.csv').then((raw) => {
      const cleaned = raw.map((d: any) => ({
        ...d,
        track_popularity: +d.track_popularity || 0,
        artist_popularity: +d.artist_popularity || 0,
        track_duration_min: +d.track_duration_min || 0,
        release_year: d.album_release_date ? parseInt(d.album_release_date.split('-')[0]) : 0
      })).filter(d => d.release_year >= 1950);
      setData(cleaned);
    });
  }, []);

  return (
    <div style={{ 
      backgroundColor: '#121212', color: 'white', 
      height: '100vh', width: '100vw', 
      display: 'flex', flexDirection: 'column', 
      overflow: 'hidden', padding: '15px', boxSizing: 'border-box' 
    }}>
      {/*Summary*/}
      <header style={{ height: '60px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, color: '#1DB954', fontSize: '1.5rem' }}>
          Spotify Insights: Exploring Success Trends and Popularity Dynamics
        </h1>
        <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#888' }}>
          Explore how track volume has grown over time and how popularity metrics correlate with track attributes.
        </p>
      </header>
      
      {/* Context View: 30% height */}
      <div style={{ height: '30%', marginBottom: '15px', backgroundColor: '#181818', borderRadius: '8px' }}>
        <AreaChartContext data={data} />
      </div>

      {/* Focus Views: 60% height */}
      <div style={{ flex: 1, display: 'flex', gap: '15px', minHeight: 0 }}>
        <div style={{ flex: 1, backgroundColor: '#181818', borderRadius: '8px', minWidth: 0 }}>
          <ScatterPlotFocus data={data} />
        </div>
        <div style={{ flex: 1, backgroundColor: '#181818', borderRadius: '8px', minWidth: 0 }}>
          <ParallelCoordinatesFocus data={data} />
        </div>
      </div>
    </div>
  );
};

export default App;