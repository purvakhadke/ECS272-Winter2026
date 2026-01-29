import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

export default function AreaChartContext({ data }: { data: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onResize = useDebounceCallback((s: { width: number; height: number }) => setSize(s), 200);
  useResizeObserver({ ref: containerRef as React.RefObject<HTMLDivElement>, onResize });

  useEffect(() => {
    if (!data.length || size.width === 0 || size.height === 0) return;

    const margin = { top: 30, right: 30, bottom: 50, left: 70 };
    const width = size.width - margin.left - margin.right;
    const height = size.height - margin.top - margin.bottom;

    const svg = d3.select(containerRef.current).selectAll('svg').data([null]).join('svg')
      .attr('width', size.width).attr('height', size.height);
    
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const yearCounts = d3.rollup(data, v => v.length, d => d.release_year);
    const chartData = Array.from(yearCounts, ([year, count]) => ({ year, count })).sort((a,b) => a.year - b.year);

    const x = d3.scaleLinear().domain([1950, 2025]).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(chartData, d => d.count)!]).nice().range([height, 0]);

    const area = d3.area<any>().x(d => x(d.year)).y0(height).y1(d => y(d.count)).curve(d3.curveMonotoneX);

    // Visual Encoding
    g.append("path").datum(chartData).attr("fill", "#1DB954").attr("fill-opacity", 0.2).attr("d", area);
    g.append("path").datum(chartData).attr("fill", "none").attr("stroke", "#1DB954").attr("stroke-width", 2).attr("d", d3.line<any>().x(d => x(d.year)).y(d => y(d.count)).curve(d3.curveMonotoneX));

    // Axes with labels
    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
    g.append("g").call(d3.axisLeft(y).ticks(5));

    g.append("text").attr("x", width/2).attr("y", -10).attr("text-anchor", "middle").attr("fill", "#1DB954").style("font-weight", "bold").text("Distribution of Spotify Tracks Over Time");
    g.append("text").attr("x", width/2).attr("y", height + 35).attr("text-anchor", "middle").attr("fill", "#888").style("font-size", "12px").text("Release Year (YYYY)");
    g.append("text").attr("transform", "rotate(-90)").attr("y", -55).attr("x", -height/2).attr("text-anchor", "middle").attr("fill", "#888").style("font-size", "12px").text("Total Tracks");
  }, [data, size]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}