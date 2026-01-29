import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

export default function ParallelCoordinatesFocus({ data }: { data: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onResize = useDebounceCallback((s: { width: number; height: number }) => setSize(s), 200);
  useResizeObserver({ ref: containerRef as React.RefObject<HTMLDivElement>, onResize });

  useEffect(() => {
    if (!data.length || size.width === 0 || size.height === 0) return;

    const margin = { top: 60, right: 40, bottom: 40, left: 40 };
    const width = size.width - margin.left - margin.right;
    const height = size.height - margin.top - margin.bottom;

    const svg = d3.select(containerRef.current).selectAll('svg').data([null]).join('svg')
      .attr('width', size.width).attr('height', size.height);
    
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const dimensions = ["track_popularity", "artist_popularity", "track_duration_min"];
    const yScales: any = {};
    dimensions.forEach(dim => {
      yScales[dim] = d3.scaleLinear()
        .domain(d3.extent(data, d => +d[dim]) as [number, number])
        .range([height, 0]).nice();
    });

    const x = d3.scalePoint().range([0, width]).domain(dimensions);

    // Draw lines with low opacity to handle high data volume
    g.selectAll("path").data(data.slice(0, 120)).join("path")
      .attr("d", d => d3.line()(dimensions.map(p => [x(p)!, yScales[p](d[p])])))
      .attr("fill", "none").attr("stroke", "#1DB954").attr("stroke-width", 1.2).attr("opacity", 0.4);

    dimensions.forEach(dim => {
      const axis = g.append("g").attr("transform", `translate(${x(dim)},0)`);
      axis.call(d3.axisLeft(yScales[dim]).ticks(6));
      axis.append("text").attr("y", -15).attr("text-anchor", "middle").text(dim.replace(/_/g, " ")).attr("fill", "#888").style("font-size", "11px").style("font-weight", "bold");
    });

    g.append("text").attr("x", width/2).attr("y", -40).attr("text-anchor", "middle").attr("fill", "#1DB954").style("font-weight", "bold").style("font-size", "14px").text("Multivariate Relationship Analysis");
  }, [data, size]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}