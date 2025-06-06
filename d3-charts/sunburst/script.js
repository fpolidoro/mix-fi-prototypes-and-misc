var modules = [
  //`https://cdnjs.cloudflare.com/ajax/libs/d3/7.6.1/d3.min.js`,
  //`https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js`
  `../../libs/d3.v6.js`,
  `../../libs/jquery-3.6.0-min.js`
]

Promise.all(
  modules.map((module, _) =>
    import(module)
  )
).then(() => {

  d3.json('../../data/mock_activity_time.json').then(function (data) {
    var width = 600,
    height = 600,
    radius = (Math.min(width, height) / 8) //- 10;

    var x = d3.scaleLinear()
      .range([0, 2 * Math.PI]);

    var y = d3.scaleLinear()
      .range([0, radius]);

    var color = //d3.scaleOrdinal(d3.schemePastel1);
    d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1))

    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius * 1.5)
      .innerRadius(d => d.y0 * radius)
      .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))

    const partition = data => {
      const root = d3.hierarchy(data)
          .sum(d => d.duration)
          .sort((a, b) => b.duration - a.duration);
      return d3.partition()
          .size([3 * Math.PI, root.height + 1])
        (root);
    }
    const root = partition(data);
  
    root.each(d => d.current = d);
  
    const svg = d3.select("#sun").append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
  
    const g = svg.append("g")
        .attr("transform", `translate(${width / 2},${width / 2})`);
  
    const path = g.append("g")
      .selectAll("path")
      .data(root.descendants())
      .join("path")
        .attr("fill", d => {
          while (d.depth > 1) d = d.parent;
          return color(d.data.name);
        })
        .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
        .attr("pointer-events", d => arcVisible(d.current) ? "auto" : "none")
        .attr("d", d => arc(d.current));
  
    path.filter(d => d.children)
        .style("cursor", "pointer")
        .on("click", clicked);
  
    const label = g.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
      .selectAll("text")
      .data(root.descendants())
      .join("text")
      .attr("dy", "0.35em")
      .attr("fill-opacity", d => +labelVisible(d.current))
      .attr("transform", d => labelTransform(d.current))
      .text(d => {
        console.log(d)
        return `${d.children ? d.data.name : d.data.duration}`
      });
  
    const parent = g.append("circle")
      .datum(root)
      .attr("r", radius*0.97)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("click", clicked)
      .call(d3.zoom().on("zoom", e => {
        if(e.transform.k < 1){
          console.log('zoomed')
          return clicked
        }
      }))

    parent.append("g")
      .attr("dy", "0.35em")
      .text(d => {
        console.log(d)
        return `${d.data.name}`
      })
  
    function clicked(event, p) {
      parent.datum(p.parent || root);
  
      root.each(d => d.target = {
        x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.depth),
        y1: Math.max(0, d.y1 - p.depth)
      });
  
      const t = g.transition().duration(750);
  
      // Transition the data on all arcs, even the ones that aren’t visible,
      // so that if this transition is interrupted, entering arcs will start
      // the next transition from the desired position.
      path.transition(t)
          .tween("data", d => {
            const i = d3.interpolate(d.current, d.target);
            return t => d.current = i(t);
          })
        .filter(function(d) {
          return +this.getAttribute("fill-opacity") || arcVisible(d.target);
        })
          .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
          .attr("pointer-events", d => arcVisible(d.target) ? "auto" : "none") 
  
          .attrTween("d", d => () => arc(d.current));
  
      label.filter(function(d) {
          return +this.getAttribute("fill-opacity") || labelVisible(d.target);
        }).transition(t)
          .attr("fill-opacity", d => +labelVisible(d.target))
          .attrTween("transform", d => () => labelTransform(d.current));
    }
    
    function arcVisible(d) {
      return d.y1 <= 4 && d.y0 >= 1 && d.x1 > d.x0;
    }
  
    function labelVisible(d) {
      return d.y1 <= 4 && d.y0 >= 0 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }
  
    function labelTransform(d) {
      const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
      const y = d.y0 > 0 ? (d.y0 + d.y1) / 2 * radius : 0;
      return `rotate(${d.y0 > 0 ? (x - 90) : 0}) translate(${y},0) rotate(${d.y0 > 0 ? (x < 180 ? 0 : 180) : 0})`;
    }
  })
})