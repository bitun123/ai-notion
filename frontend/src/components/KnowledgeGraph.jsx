import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const KnowledgeGraph = ({ data, onNodeClick }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || !data.nodes) return;

    const width = 800;
    const height = 600;

    // Clear previous SVG content
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const zoomGroup = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.edges).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(60));

    // Links
    const link = zoomGroup.append("g")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.edges)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.score) * 2);

    // Nodes
    const node = zoomGroup.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => onNodeClick(d))
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node circles
    node.append("circle")
      .attr("r", 12)
      .attr("fill", "#6366f1")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("class", "transition-all duration-300 hover:r-16");

    // Node labels
    node.append("text")
      .attr("dx", 18)
      .attr("dy", 4)
      .text(d => d.title)
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("fill", "#475569")
      .style("pointer-events", "none")
      .attr("class", "select-none");

    // Hover effects
    node.on("mouseover", function(event, d) {
      d3.select(this).select("circle")
        .transition()
        .attr("r", 16)
        .attr("fill", "#4f46e5");
      
      // Highlight edges
      link.transition()
        .attr("stroke", l => (l.source.id === d.id || l.target.id === d.id) ? "#6366f1" : "#e2e8f0")
        .attr("stroke-opacity", l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.2);
    })
    .on("mouseout", function() {
      d3.select(this).select("circle")
        .transition()
        .attr("r", 12)
        .attr("fill", "#6366f1");
      
      link.transition()
        .attr("stroke", "#e2e8f0")
        .attr("stroke-opacity", 0.6);
    });

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [data]);

  return (
    <div className="w-full h-full bg-slate-50/30 rounded-3xl overflow-hidden border border-slate-200/50 backdrop-blur-sm relative">
      <div className="absolute top-6 left-6 z-10">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Knowledge Map</h3>
        <p className="text-xs text-slate-500 mt-1">Exploring connections between your thoughts</p>
      </div>
      <svg 
        ref={svgRef} 
        viewBox="0 0 800 600" 
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default KnowledgeGraph;
