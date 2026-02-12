import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

export default function ScatterPlotFocus({ data }: { data: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onResize = useDebounceCallback((s) => setSize(s), 200);
  useResizeObserver({ ref: containerRef as React.RefObject<HTMLDivElement>, onResize });

  useEffect(() => {
    if (size.width === 0 || size.height === 0) return;
    
    // Increased margins to prevent labels from being cut off
    const margin = { top: 50, right: 30, bottom: 60, left: 70 };
    const width = Math.round(size.width - margin.left - margin.right);
    const height = Math.round(size.height - margin.top - margin.bottom);

    let tooltip = d3.select("body").select<HTMLDivElement>(".d3-tooltip");
    if (tooltip.empty()) tooltip = d3.select("body").append("div").attr("class", "d3-tooltip").style("opacity", 0);

    const svg = d3.select(containerRef.current).selectAll('svg').data([null]).join('svg')
      .attr('width', Math.round(size.width)).attr('height', Math.round(size.height))
      .attr("shape-rendering", "geometricPrecision");
    
    let g = svg.select<SVGGElement>('g.main-group');
    if (g.empty()) {
      g = svg.append('g').attr('class', 'main-group').attr('transform', `translate(${margin.left},${margin.top})`);
      
      // Initialize Axis Groups
      g.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${height})`);
      g.append('g').attr('class', 'y-axis');

      // Static Title
      g.append("text")
        .attr("x", width / 2).attr("y", -20)
        .attr("text-anchor", "middle").attr("fill", "#1DB954")
        .style("font-weight", "bold").style("font-size", "14px")
        .text("Focus: Artist Influence vs. Track Success");

      // X Label
      g.append("text")
        .attr("class", "x-label")
        .attr("x", width / 2).attr("y", height + 45)
        .attr("fill", "#888").attr("text-anchor", "middle")
        .style("font-size", "12px").text("Artist Popularity Score →");

      // Y Label
      g.append("text")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2).attr("y", -50)
        .attr("fill", "#888").attr("text-anchor", "middle")
        .style("font-size", "12px").text("Track Popularity Score →");
    }

    const x = d3.scaleLinear().domain([0, 100]).range([0, width]);
    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    // Animated axis transitions
    g.select<SVGGElement>('.x-axis').transition().duration(750).call(d3.axisBottom(x));
    g.select<SVGGElement>('.y-axis').transition().duration(750).call(d3.axisLeft(y));

    // Data Join with Enter-Update-Exit Transitions
    g.selectAll("circle").data(data.slice(0, 800), (d: any) => d.track_id)
      .join(
        enter => enter.append("circle")
          .attr("cx", d => Math.round(x(d.artist_popularity))).attr("cy", d => Math.round(y(d.track_popularity)))
          .attr("r", 0).attr("fill", "#1DB954").attr("opacity", 0)
          .call(e => e.transition().duration(750).attr("r", 3.5).attr("opacity", 0.35)),
        update => update.call(u => u.transition().duration(750)
          .attr("cx", d => Math.round(x(d.artist_popularity)))
          .attr("cy", d => Math.round(y(d.track_popularity)))
          .attr("opacity", 0.35)),
        exit => exit.call(ex => ex.transition().duration(500).attr("r", 0).remove())
      )
      .on("mouseover", function(event, d: any) {
        g.selectAll("circle").interrupt().transition().duration(100).attr("opacity", 0.1);
        d3.select(this).interrupt().transition().duration(100)
          .attr("opacity", 1).attr("r", 7).attr("fill", "#fff").attr("stroke", "#1DB954").attr("stroke-width", 2);
        
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`<div style="font-weight:bold; color:#1DB954">${d.track_name}</div><div style="font-size:11px">by ${d.artist_name}</div>`)
               .style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", (event) => tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px"))
      .on("mouseout", function() {
        g.selectAll("circle").interrupt().transition().duration(200).attr("opacity", 0.35).attr("r", 3.5).attr("fill", "#1DB954").attr("stroke", "none");
        tooltip.transition().duration(200).style("opacity", 0);
      });
  }, [data, size]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}