import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

export default function AreaChartContext({ data, setYearRange }: { data: any[], setYearRange: (rng: [number, number] | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onResize = useDebounceCallback((s) => setSize(s), 200);
  useResizeObserver({ ref: containerRef as React.RefObject<HTMLDivElement>, onResize });

  useEffect(() => {
    if (!data.length || size.width === 0) return;

    const margin = { top: 35, right: 30, bottom: 45, left: 70 };
    const width = size.width - margin.left - margin.right;
    const height = size.height - margin.top - margin.bottom;

    const svg = d3.select(containerRef.current).selectAll('svg').data([null]).join('svg')
      .attr('width', size.width).attr('height', size.height);
    
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Data Processing
    const yearCounts = d3.rollup(data, v => v.length, d => d.release_year);
    const chartData = Array.from(yearCounts, ([year, count]) => ({ year, count })).sort((a,b) => a.year - b.year);

    const x = d3.scaleLinear().domain([1950, 2025]).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(chartData, d => d.count)!]).nice().range([height, 0]);

    // Draw the Area
    const area = d3.area<any>().x(d => x(d.year)).y0(height).y1(d => y(d.count)).curve(d3.curveMonotoneX);
    g.append("path").datum(chartData).attr("fill", "#1DB954").attr("fill-opacity", 0.2).attr("d", area);

    // Brush Interaction
    const brush = d3.brushX()
      .extent([[0, 0], [width, height]])
      .on("end", (event) => {
        if (!event.selection) {
          setYearRange(null);
          return;
        }
        const [x0, x1] = event.selection as [number, number];
        const selectedYears: [number, number] = [Math.round(x.invert(x0)), Math.round(x.invert(x1))];
        setYearRange(selectedYears);
      });

    g.append("g").attr("class", "brush").call(brush);

    // X Axis & Label
    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#888")
      .style("font-size", "12px")
      .text("Release Year");

    // Y Axis & Label
    g.append("g").call(d3.axisLeft(y).ticks(5));
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .attr("fill", "#888")
      .style("font-size", "12px")
      .text("Number of Tracks");

    // Chart Title
    g.append("text")
      .attr("x", width / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .attr("fill", "#1DB954")
      .style("font-weight", "bold")
      .style("font-size", "14px")
      .text("Context: Distribution of Tracks Over Time");

  }, [data, size, setYearRange]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}