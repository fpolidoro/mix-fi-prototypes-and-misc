let projection = /*d3.geoMercator()
	 .scale(150)
	 .translate([480, 320])*/
	// .center([0, 0]);
    d3.geoEquirectangular();

let geoGenerator = d3.geoPath()
	.projection(projection);

function handleMouseover(e, d) {
	let pixelArea = geoGenerator.area(d);
	let bounds = geoGenerator.bounds(d);
	let centroid = geoGenerator.centroid(d);
	let measure = geoGenerator.measure(d);

	d3.select('#content .info')
		.text(d.properties.name + ' (path.area = ' + pixelArea.toFixed(1) + ' path.measure = ' + measure.toFixed(1) + ')');

	d3.select('#content .bounding-box rect')
		.attr('x', bounds[0][0])
		.attr('y', bounds[0][1])
		.attr('width', bounds[1][0] - bounds[0][0])
		.attr('height', bounds[1][1] - bounds[0][1]);

	d3.select('#content .centroid')
		.style('display', 'inline')
		.attr('transform', 'translate(' + centroid + ')');
    console.log(`${d.properties.name}`)
}

function update(geojson) {
	let u = d3.select('#content g.map')
		.selectAll('path')
		.data(geojson.features);

	u.enter()
		.append('path')
		.attr('d', geoGenerator)
		.on('mouseover', handleMouseover);
}



// REQUEST DATA
d3
.json('world_geojson_110m.json')
//.json('africa_geojson.json')
.then(function(json) {
		update(json)
	});


