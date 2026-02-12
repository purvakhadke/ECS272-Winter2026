import React, { useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import AreaChartContext from './components/AreaChartContext';
import ScatterPlotFocus from './components/ScatterPlotFocus';
import ParallelCoordinatesFocus from './components/ParallelCoordinatesFocus';

interface SpotifyTrack {
  track_popularity: number;
  artist_popularity: number;
  track_duration_min: number;
  release_year: number;
  track_name: string;
  artist_name: string;
  [key: string]: any; 
}

const App: React.FC = () => {
  const [data, setData] = useState<SpotifyTrack[]>([]);
  // Coordination State
  // This stores the year range selected in the Context view
  const [yearRange, setYearRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    d3.csv('/spotify_data.csv').then((raw) => {
      const cleaned: SpotifyTrack[] = raw.map((d: any) => ({
        ...d,
        track_popularity: +d.track_popularity || 0,
        artist_popularity: +d.artist_popularity || 0,
        track_duration_min: +d.track_duration_min || 0,
        // Extract year from YYYY-MM-DD format
        release_year: d.album_release_date ? parseInt(d.album_release_date.split('-')[0]) : 0
      })).filter(d => d.release_year >= 1950); // Focusing on modern music era
      
      setData(cleaned);
    }).catch(err => console.error("Error loading CSV:", err));
  }, []);

  // One filtering function that coordinates multiple views
  const filteredData = useMemo(() => {
    if (!yearRange) return data;
    return data.filter(d => 
      d.release_year >= yearRange[0] && d.release_year <= yearRange[1]
    );
  }, [data, yearRange]);

  return (
    <div style={{ 
      backgroundColor: '#121212', 
      color: 'white', 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden', 
      padding: '20px', 
      boxSizing: 'border-box',
      fontFamily: 'sans-serif'
    }}>
      <header style={{ height: '70px', marginBottom: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <h1 style={{ margin: 0, color: '#1DB954', fontSize: '1.8rem' }}>
          Spotify Music Intelligence
        </h1>
        <p style={{ margin: '5px 0', fontSize: '0.95rem', color: '#b3b3b3' }}>
          Explore <b>Success Trends</b> across time (Context) and drill down into <b>Popularity Metrics</b> (Focus).
          <span style={{ color: '#1DB954', marginLeft: '10px' }}>
            {yearRange ? `Viewing Years: ${yearRange[0]} - ${yearRange[1]}` : "Drag the chart below to filter by year"}
          </span>
        </p>
      </header>
      
      {/* CONTEXT VIEW: Area Chart 
          - Displays overview of all data
          - Provides the Brush interaction to update state
      */}
      <div style={{ 
        height: '28%', 
        marginBottom: '20px', 
        backgroundColor: '#181818', 
        borderRadius: '12px', 
        padding: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      }}>
        <AreaChartContext data={data} setYearRange={setYearRange} />
      </div>

      {/* FOCUS VIEWS: Coordinated re-rendering based on Filtered Data */}
      <div style={{ flex: 1, display: 'flex', gap: '20px', minHeight: 0 }}>
        {/* Scatter Plot: Fundamental Focus */}
        <div style={{ 
          flex: 1, 
          backgroundColor: '#181818', 
          borderRadius: '12px', 
          padding: '10px', 
          minWidth: 0,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          <ScatterPlotFocus data={filteredData} />
        </div>

        {/* Parallel Coordinates: Advanced Focus */}
        <div style={{ 
          flex: 1, 
          backgroundColor: '#181818', 
          borderRadius: '12px', 
          padding: '10px', 
          minWidth: 0,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}>
          <ParallelCoordinatesFocus data={filteredData} />
        </div>
      </div>
      
      {/* Visual Indicator of data volume */}
      <footer style={{ height: '20px', fontSize: '0.8rem', color: '#555', textAlign: 'right', marginTop: '5px' }}>
        Showing {filteredData.length.toLocaleString()} of {data.length.toLocaleString()} tracks
      </footer>
    </div>
  );
};

export default App;