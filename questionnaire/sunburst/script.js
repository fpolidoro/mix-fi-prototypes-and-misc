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

  d3.json('../../data/mock_activity_time.json').then(function (menu) {
    var width = 600,
    height = 600,
    radius = (Math.min(width, height) / 2) - 10;

    var x = d3.scaleLinear()
      .range([0, 2 * Math.PI]);

    var y = d3.scaleLinear()
      .range([0, radius]);

    var color = d3.scaleOrdinal(d3.schemePastel1);

    var partition = d3.partition();

    var arc = d3.arc()
      .startAngle(function (d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
      .endAngle(function (d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
      .innerRadius(function (d) { return Math.max(0, y(d.y0)); })
      .outerRadius(function (d) { return Math.max(0, y(d.y1)); });


    var svg = d3.select("#sun").append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");

    setTimeout(function () {

      root = d3.hierarchy(menu);
      root.sum(function (d) { return !d.children || d.children.length === 0 ? d.size : 0; });
      svg.selectAll("path")
        .data(partition(root).descendants())
        .enter().append("path")
        .attr("d", arc)
        .style("fill", function (d) { return color((d.children ? d : d.parent).data.name); })
        .on("click", click)
        .append("title")
        .text(function (d) { return d.data.name + "\n" + d.data.size; });

    }, 100);

    function click(d) {
      svg.transition()
        .duration(750)
        .tween("scale", function () {
          var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
            yd = d3.interpolate(y.domain(), [d.y0, 1]),
            yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
          return function (t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
        })
        .selectAll("path")
        .attrTween("d", function (d) { return function () { return arc(d); }; });
    }

    d3.select(self.frameElement).style("height", height + "px");
  })
})