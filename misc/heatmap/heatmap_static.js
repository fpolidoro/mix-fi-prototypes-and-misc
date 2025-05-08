// set the dimensions and margins of the graph
const margin = {top: 80, right: 25, bottom: 30, left: 40},
width = 850 - margin.left - margin.right,
height = 350 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#my_dataviz")
.append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", `translate(${margin.left}, ${margin.top})`);

//Read the data
d3.csv("data/steps.csv").then(function(data) {
console.log(data)
data.sort((a,b) => moment(a.create_time).isBefore(moment(b.create_time)))

// Labels of row and columns -> unique identifier of the column called 'day_time' and 'source_type'
const myGroups = Array.from(new Set(data.map(d => moment(d.create_time).week()))).sort((a,b) => a > b)
const myVars = Array.from(new Set(data.map(d => moment(d.create_time)))).sort((a,b) => b.weekday() > a.weekday()).map(d => d.format('ddd'))

console.log(myGroups)
console.log(myVars)

//data.forEach(d => console.log(moment(d.create_time).day()))

// Build X scales and axis:
const x = d3.scaleBand()
  .range([ 0, width ])
  .domain(myGroups)
  .padding(0.05)
  
svg.append("g")
  .style("font-size", 15)
  .attr("transform", `translate(0, ${height})`)
  .call(d3.axisBottom(x).tickSize(0).tickPadding([16]))
  .on('wheel', event => {
    const { ctrlKey } = event
    if (ctrlKey) {
      event.preventDefault();
      console.log('pinch and zoom')
      return
    }
  })
  .select(".domain").remove()

// Build Y scales and axis:
const y = d3.scaleBand()
  .range([ height, 0 ])
  .domain(myVars)
  .padding(0.05);
svg.append("g")
  .style("font-size", 15)
  .call(d3.axisLeft(y).tickSize(0))
  .select(".domain").remove()

// Build color scale
const myColor = d3.scaleSequential()
  .interpolator(d3.interpolateInferno)
  .domain([30000,100])

// create a tooltip
const tooltip = d3.select("#my_dataviz")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltip")
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "2px")
  .style("border-radius", "5px")
  .style("padding", "5px")

// Three function that change the tooltip when user hover / move / leave a cell
const mouseover = function(event,d) {
  tooltip
    .style("opacity", 1)
  d3.select(this)
    .style("stroke", "#333")
    .style("opacity", 1)
}
const mousemove = function(event,d) {
  tooltip
    .html(`${moment(d.create_time).format('DD/MM')} steps: ${d.count}`)
    .style("left", (event.x)/2 + "px")
    .style("top", (event.y)/2 + "px")
}
const mouseleave = function(event,d) {
  tooltip
    .style("opacity", 0)
  d3.select(this)
    .style("stroke", "none")
    .style("opacity", 0.8)
}

// add the squares
svg.selectAll()
  .data(data, function(d) {return moment(d.create_time).week()+':'+moment(d.create_time).format('ddd');})
  .join("rect")
    .attr("x", function(d) { return x(moment(d.create_time).week()) })
    .attr("y", function(d) { return y(moment(d.create_time).format('ddd')) })
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("width", x.bandwidth() )
    .attr("height", y.bandwidth() )
    .style("fill", function(d) { return myColor(d.count)} )
    .style("stroke-width", 4)
    .style("stroke", "none")
    .style("opacity", 0.8)
  .on("mouseover", mouseover)
  .on("mousemove", mousemove)
  .on("mouseleave", mouseleave)
})

// Add title to graph
svg.append("text")
      .attr("x", 0)
      .attr("y", -50)
      .attr("text-anchor", "left")
      .style("font-size", "22px")
      .text("A d3.js heatmap");

// Add subtitle to graph
svg.append("text")
.attr("x", 0)
.attr("y", -20)
.attr("text-anchor", "left")
.style("font-size", "14px")
.style("fill", "grey")
.style("max-width", 400)
.text("A short description of the take-away message of this chart.");