var width = window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth;

var height = (window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight)/2;

var gridsize = 48

var //width = 800,
	//height = 400,
	margintop = 24,
	marginbottom = 8,
	marginright = 32,
	marginleft = 40

var oldData

d3.csv("data/steps.csv").then(function (data) {

	data.sort((a, b) => moment(a.create_time).isBefore(moment(b.create_time)))
	// Labels of row and columns -> unique identifier of the column called 'day_time' and 'source_type'
	const myGroups = Array.from(new Set(data.map(d => moment(d.create_time).week()))).sort((a,b) => a > b)
	const myVars = Array.from(new Set(data.map(d => moment(d.create_time)))).sort((a,b) => b.weekday() > a.weekday()).map(d => d.format('ddd'))

	console.warn(gridsize*(data.length/7))
	height = gridsize*7
	width = myGroups.length > 1 ? (myGroups[myGroups.length-1] - myGroups[0])*gridsize : gridsize

	var svg = d3.select("#my_dataviz")
		.append("div")
		// Note the CSS rules for .chart
		.attr("class", "chart")
		//.style("max-width", width)
		.append("svg")
		.attr("width", width + marginleft + marginright)
		// No margin-top required here, because the other element already took care of it
		.attr("height", height + margintop + marginbottom)
		.append("g")
		// Same, no margin-top
		.attr("transform", `translate(${marginleft}, 0)`);

	// Add the axis *after* adding the SVG, because the order matters in HTML
	var axis = d3.select("#my_dataviz")
		.append("svg")
		.attr("class", "y-axis")
		.attr("width", marginleft + 1)
		// Add 2 so you have a little bit of room left for the black bar
		// i.e. margin top has to be less than total height!
		.style("top", marginbottom + 1)
		.attr("height", height + margintop + marginbottom)
		.append("g")
		.attr("transform", `translate(${marginleft}, 0)`)

	var x_axis = d3.scaleBand()
		.range([0, width])
		.domain(myGroups)
		.padding(0.05);

	svg.append("g")
		.style("font-size", 15)
		.attr("transform", `translate(0, ${height})`)
		.call(d3.axisBottom(x_axis).tickSize(0).tickPadding([16]))
		.attr("class", "x_axis")
		.select(".domain").remove()
		.selectAll("text")
		.on("click", function (d) {
			console.log(`X clicked`)
		});

	// axis.call(d3.axisBottom(x_axis).tickSize(0).tickPadding([16]))
	// 	.selectAll("text")
	// 	.style("text-anchor", "end")
	// 	.style("position", "fixed")
	// 	.attr("dx", 15)
	// 	.attr("dy", 5)
	// 	.attr("transform", "rotate(-65)");

	var y_axis = d3.scaleBand()
		.range([height, 0])
		.domain(myVars)
		.padding(0.05);

	axis.call(d3.axisLeft(y_axis).tickSize(0).tickPadding([16]))
		.style("font-size", 15)
		.select(".domain").remove()
		.selectAll("text")
		//.style("text-anchor", "end")
		.style("position", "fixed")
		.attr("transform", function(d,i){
			return "rotate(-90 " + (50 + 80*i) + " 50)";
		})

	var myColor = d3.scaleSequential()
		.interpolator(d3.interpolateInferno)
		.domain([30000, 100])

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

	const tapsquare = function(event, d) {
		if(this === oldData){
			oldData = null
			tooltip
				.style("opacity", 0)
			d3.select(this)
				.style("stroke", "none")
				.style("opacity", 0.8)
		}else{
			if(oldData !== null){
				tooltip
					.style("opacity", 0)
				d3.select(oldData)
					.style("stroke", "none")
					.style("opacity", 0.8)	
			}
			tooltip
				.html(`${moment(d.create_time).format('DD/MM')} steps: ${d.count}`)
				.style("left", (event.x)/2 + "px")
				.style("top", (event.y)/2 + "px")

			tooltip
				.style("opacity", 1)
			d3.select(this)
				.style("stroke", "#333")
			.style("opacity", 1)
			oldData = this
		}
	}

	svg.selectAll()
		.data(data, function (d) {
			return moment(d.create_time).week()+':'+moment(d.create_time).format('ddd');
		})
		.join("rect")
		/*.enter()
		.append("rect")*/
		.attr("x", function (d) {
			return x_axis(moment(d.create_time).week())
		})
		.attr("y", function (d) {
			return y_axis(moment(d.create_time).format('ddd'))
		})
		.attr("rx", 4)
		.attr("ry", 4)
		.attr("width", x_axis.bandwidth())
		.attr("height", y_axis.bandwidth())
		.style("fill", function (d) {
			return myColor(d.count)
		})
		.style("stroke-width", 4)
		.style("stroke", "none")
		.style("opacity", 0.8)
		.on("mouseover", mouseover)
		.on("mousemove", mousemove)
		.on("mouseleave", mouseleave)
		.on("click", tapsquare)

})

function wheel($div,deltaY){
	var step = 30;
	var pos = $div.scrollTop();
	var nextPos = pos + (step*(-deltaY))
	console.log("DelatY: " + deltaY + ", Step: " + step + ", nextPos: " + nextPos);
	$div.scrollTop(nextPos);
}

$('.chart').on('scroll', function(event, delta, deltaX, deltaY) {
	 wheel($(this),deltaY);
	 event.preventDefault();
	 console.log(`wheeling`)
});