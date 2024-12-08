import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const SprayChart = ({
  hits = [],
  width = 550,
  height = 570,
  title = "",
  onPlotHit,
  currentHit,
  shouldReset,
}) => {
  const svgRef = useRef();
  const [hoverCoords, setHoverCoords] = useState(null);
  const [previewHit, setPreviewHit] = useState(null);

  useEffect(() => {
    if (shouldReset) {
      setPreviewHit(null);
      setHoverCoords(null);
    }
  }, [shouldReset]);

  useEffect(() => {
    if (currentHit.location) {
      setPreviewHit(currentHit.location);
    }
  }, [currentHit.location]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 10, bottom: 40, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear().domain([-250, 250]).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([-50, 200]).range([innerHeight, 0]);

    const field = g.append("g").attr("class", "field");

    const outfieldRadius = 330;
    const outfieldArc = d3
      .arc()
      .innerRadius(0)
      .outerRadius(outfieldRadius)
      .startAngle(-Math.PI / 4)
      .endAngle(Math.PI / 4);

    field
      .append("path")
      .attr("d", outfieldArc)
      .attr("transform", `translate(${xScale(0)},${yScale(0)})`)
      .attr("fill", "#90EE90")
      .attr("stroke", "#666")
      .attr("stroke-width", 1);

    const infieldRadius = 125;
    field
      .append("path")
      .attr(
        "d",
        `
        M ${xScale(-95)} ${yScale(51.5)}
        A ${infieldRadius} ${infieldRadius} 0 0 1 ${xScale(95)} ${yScale(51.5)}
        L ${xScale(0)} ${yScale(0)}
        Z
      `
      )
      .attr("fill", "#DEB887")
      .attr("stroke", "#666")
      .attr("stroke-width", 1);

    const previewGroup = g
      .append("g")
      .attr("class", "preview")
      .style("display", "none");

    previewGroup
      .append("line")
      .attr("class", "crosshair-v")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6,6");

    previewGroup
      .append("line")
      .attr("class", "crosshair-h")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6,6");

    const drawHit = (hit, isPreview = false) => {
      if (!hit) return;
      const crosshairLength = 12;

      const group = g.append("g");

      group
        .append("line")
        .attr("x1", xScale(hit.x))
        .attr("x2", xScale(hit.x))
        .attr("y1", yScale(hit.y) - crosshairLength)
        .attr("y2", yScale(hit.y) + crosshairLength)
        .attr("stroke", "#666")
        .attr("stroke-width", 2)
        .attr("opacity", isPreview ? 0.6 : 1);

      group
        .append("line")
        .attr("x1", xScale(hit.x) - crosshairLength)
        .attr("x2", xScale(hit.x) + crosshairLength)
        .attr("y1", yScale(hit.y))
        .attr("y2", yScale(hit.y))
        .attr("stroke", "#666")
        .attr("stroke-width", 2)
        .attr("opacity", isPreview ? 0.6 : 1);

      group
        .append("circle")
        .attr("cx", xScale(hit.x))
        .attr("cy", yScale(hit.y))
        .attr("r", 5)
        .attr("fill", "#666")
        .attr("opacity", isPreview ? 0.6 : 1);
    };

    hits.forEach((hit) => drawHit(hit));
    if (previewHit) drawHit(previewHit, true);

    svg.on("mousemove", (event) => {
      const [x, y] = d3.pointer(event, g.node());

      if (x < 0 || x > innerWidth || y < 0 || y > innerHeight) {
        previewGroup.style("display", "none");
        setHoverCoords(null);
        return;
      }

      const hoverX = xScale.invert(x);
      const hoverY = yScale.invert(y);

      previewGroup.style("display", null);

      previewGroup
        .select(".crosshair-v")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", 0)
        .attr("y2", innerHeight);

      previewGroup
        .select(".crosshair-h")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", y)
        .attr("y2", y);

      setHoverCoords({ x: hoverX, y: hoverY });
    });

    svg.on("mouseleave", () => {
      previewGroup.style("display", "none");
      setHoverCoords(null);
    });

    svg.on("click", (event) => {
      const [x, y] = d3.pointer(event, g.node());
      if (x < 0 || x > innerWidth || y < 0 || y > innerHeight) return;

      const hitX = xScale.invert(x);
      const hitY = yScale.invert(y);

      const newHit = { x: hitX, y: hitY };
      setPreviewHit(newHit);
      if (onPlotHit) {
        onPlotHit(newHit);
      }
    });
  }, [hits, width, height, title, onPlotHit, previewHit]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="w-[550px] h-[500px] bg-white rounded-lg overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ display: "block" }}
        />
      </div>
      {hoverCoords && (
        <div className="absolute bottom-4 right-4 bg-white px-3 py-1.5 rounded-full shadow-sm text-sm font-mono text-gray-600">
          ({hoverCoords.x.toFixed(1)}, {hoverCoords.y.toFixed(1)})
        </div>
      )}
    </div>
  );
};

export default SprayChart;
