import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

export default function ScatterPlotFocus({ data }: { data: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onResize = useDebounceCallback((s: { width: number; height: number }) => setSize(s), 200);
  useResizeObserver({ ref: containerRef as React.RefObject<HTMLDivElement>, onResize });

  useEffect(() => {
    if (!data.length || size.width === 0 || size.height === 0) return;

    const margin = { top: 40, right: 30, bottom: 55, left: 60 };
    const width = size.width - margin.left - margin.right;
    const height = size.height - margin.top - margin.bottom;

    const svg = d3.select(containerRef.current).selectAll('svg').data([null]).join('svg')
      .attr('width', size.width).attr('height', size.height);
    
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    // Handle visual clutter by sampling
    g.selectAll("circle").data(data.slice(0, 1500)).join("circle")
      .attr("cx", d => x(d.artist_popularity)).attr("cy", d => y(d.track_popularity))
      .attr("r", 2).attr("fill", "#1DB954").attr("opacity", 0.4);

    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    g.append("g").call(d3.axisLeft(y));

    g.append("text").attr("x", width/2).attr("y", -15).attr("text-anchor", "middle").attr("fill", "#1DB954").style("font-weight", "bold").text("Artist Influence on Track Popularity");
    g.append("text").attr("x", width/2).attr("y", height + 40).attr("text-anchor", "middle").attr("fill", "#888").text("Artist Popularity Score");
    g.append("text").attr("transform", "rotate(-90)").attr("y", -45).attr("x", -height/2).attr("text-anchor", "middle").attr("fill", "#888").text("Track Popularity Score");
  }, [data, size]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}