import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';

export default function ParallelCoordinatesFocus({ data }: { data: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onResize = useDebounceCallback((s) => setSize(s), 200);
  useResizeObserver({ ref: containerRef as React.RefObject<HTMLDivElement>, onResize });

  useEffect(() => {
    if (!data.length || size.width === 0 || size.height === 0) return;

    const margin = { top: 70, right: 50, bottom: 50, left: 50 };
    const width = size.width - margin.left - margin.right;
    const height = size.height - margin.top - margin.bottom;

    const svg = d3.select(containerRef.current).selectAll('svg').data([null]).join('svg')
      .attr('width', size.width).attr('height', size.height);
    
    let g = svg.select<SVGGElement>('g.pcp-group');
    if (g.empty()) {
      g = svg.append('g').attr('class', 'pcp-group').attr('transform', `translate(${margin.left},${margin.top})`);
    }

    // Adding "Release Year" to see how duration/popularity change over time
    const dims = ["release_year", "track_duration_min", "track_popularity"];
    
    const yScales: { [key: string]: d3.ScaleLinear<number, number> } = {};
    
    dims.forEach(d => {
      let domain: [number, number];
      if (d === "track_duration_min") {
        // We cap the axis at 8 mins to show more detail for standard songs
        domain = [0, 8]; 
      } else {
        domain = d3.extent(data, v => +v[d]) as [number, number];
      }
      
      yScales[d] = d3.scaleLinear().domain(domain).range([height, 0]).nice();
    });
    
    const x = d3.scalePoint().range([0, width]).domain(dims);
    const lineGenerator = d3.line<[number, number]>().x(d => d[0]).y(d => d[1]);

    function getPath(trackData: any) {
      const points = dims.map(p => {
        const xCoord = x(p)!;
        const val = Math.min(Math.max(trackData[p], yScales[p].domain()[0]), yScales[p].domain()[1]);
        return [xCoord, yScales[p](val)] as [number, number];
      });
      return lineGenerator(points);
    }

    // Transitions and Interactions
    const paths = g.selectAll<SVGPathElement, any>("path.track-line")
      .data(data.slice(0, 150), (d: any) => d.track_id);

    paths.join(
      enter => enter.append("path").attr("class", "track-line").attr("d", getPath)
        .attr("fill", "none").attr("stroke", "#1DB954").attr("opacity", 0)
        .call(e => e.transition().duration(750).attr("opacity", 0.2)),
      update => update.call(u => u.transition().duration(750).attr("d", getPath)),
      exit => exit.call(ex => ex.transition().duration(500).attr("opacity", 0).remove())
    )
    .on("mouseover", function(event, d: any) {
        const tooltip = d3.select(".d3-tooltip");
        g.selectAll("path.track-line").transition().duration(100).attr("opacity", 0.05);
        d3.select(this).transition().duration(100).attr("opacity", 1).attr("stroke", "#fff").attr("stroke-width", 2);
        
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`
          <div style="font-weight:bold">${d.track_name}</div>
          <div style="font-size:11px">${d.release_year} | ${d.track_duration_min.toFixed(2)} min</div>
        `)
        .style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 10) + "px");
    })
    .on("mouseout", function() {
        g.selectAll("path.track-line").transition().duration(200).attr("opacity", 0.2).attr("stroke", "#1DB954").attr("stroke-width", 1);
        d3.select(".d3-tooltip").style("opacity", 0);
    });

    // DRAW AXES
    g.selectAll(".axis").remove();
    dims.forEach(d => {
      const axisG = g.append("g").attr("class", "axis").attr("transform", `translate(${x(d)},0)`);
      axisG.call(d3.axisLeft(yScales[d]).ticks(5));
      
      axisG.append("text")
        .attr("y", -15).attr("text-anchor", "middle").attr("fill", "#1DB954")
        .style("font-size", "10px").style("font-weight", "bold")
        .text(d.replace(/_/g, " ").toUpperCase() + (d === "track_duration_min" ? " (MIN)" : ""));
    });

    if (g.select(".pcp-title").empty()) {
      g.append("text").attr("class", "pcp-title").attr("x", width/2).attr("y", -45).attr("text-anchor", "middle").attr("fill", "#1DB954")
        .style("font-weight", "bold").text("Track Profile: Time vs. Duration vs. Popularity");
    }

  }, [data, size]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}