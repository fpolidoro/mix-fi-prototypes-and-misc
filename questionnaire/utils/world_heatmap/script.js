let projection = d3.geoTransform({
		point: function(x, y) {
			this.stream.point(360+x * 2, 180-y  * 2);
		}
	})

let geoGenerator = d3.geoPath()
	.projection(projection);

/** Draw the click position on the map and, if click is valid, draw the bounding box and the centroid of the
 * nearest country. Otherwise, just draw the pointer with a gray color to signal that no valid selection has
 * been made
 * @param e The tap/click event, which can be either triggered by DOM path elements or propagated by events
 * occurring on the svg
 * @param d The path element to highlight. This corresponds to the country whose centroid is the nearest to
 * the pointer, if such country exists; undefined otherwise. Antarctica is not considered as a valid country
 * @param bubble Defines the caller of this function: if true, the event has been propagated by the svg
 * element, therefore the pointer center can use a lighter blue
 */
function handleSelection(e, d, bubble = false) {
	d3.select('#content g.map')
		.selectAll('path').attr('fill', '#ededed')
	if(d !== undefined && d.properties.name !== 'Antarctica'){
		let pixelArea = geoGenerator.area(d);
		let bounds = geoGenerator.bounds(d);
		let centroid = geoGenerator.centroid(d);
		let measure = geoGenerator.measure(d);

		d3.select('#content .info')
			.text(d.properties.name + ' (path.area = ' + pixelArea.toFixed(1) + ' path.measure = ' + measure.toFixed(1) + ')');

		/*d3.select('#content .bounding-box rect')
			.attr('x', bounds[0][0])
			.attr('y', bounds[0][1])
			.attr('width', bounds[1][0] - bounds[0][0])
			.attr('height', bounds[1][1] - bounds[0][1]);*/

		// d3.select('#content .centroid')
		// 	.style('display', 'inline')
		// 	.attr('transform', 'translate(' + centroid + ')');

		d3.select(`#${d.properties.ADM0_ISO}`).attr('fill', '#0dcaf0')
		d3.select('#content .poi')	//draw pointer
			.style('display', 'inline')
			.style('fill', bubble ? '#0dcaf0' : '#0a58ca')	//fill the circle with gray if selection is invalid
			.attr('transform', `translate(${e.clientX-5}, ${e.clientY - 25})`);
		console.log(`${d.properties.name}`)
	}else{	//selection is invalid, because there is no nearby country
		d3.select('#content .info').text(`Invalid selection`)
		// d3.select('#content .bounding-box rect')	//make the bounding rect invisible
		// 	.attr('x', 0)
		// 	.attr('y', 0)
		// 	.attr('width', 0)
		// 	.attr('height', 0);
		//d3.select('#content .centroid').style('display', 'none')	//hide the centroid
		d3.select('#content .poi')	//draw pointer
			.style('display', 'inline')
			.style('fill', d !== undefined && d.properties.name === 'Antarctica' ? '#a9a9a9' : '#ddd')	//fill the circle with gray if selection is invalid
			.attr('transform', `translate(${e.clientX-5}, ${e.clientY - 25})`);
	}
	e.stopPropagation();	//prevent the event from bubbling up to the parent (SVG) to avoid recursive calls to this method
}

function update(geojson) {
	let u = d3.select('#content g.map')
		.selectAll('path')
		.data(geojson.features);

	u.enter()
		.append('path')
		.attr('d', geoGenerator)
		.attr('fill', '#ddd')
		.attr('id', d => d.properties.ADM0_ISO)
		.on('click', handleSelection)
		.each(function(d) {	//prepare the map for storing the path of each country, which will be used by the click handlers to validate the user's input
			if(d.properties.name !== 'Antarctica'){
				countryPaths.set(d.properties.name, {centroid: geoGenerator.centroid(d), d: d, bounds: geoGenerator.bounds(d)})
			}
		});

	//handle clicks on areas other than the paths representing the countries
	const intersects = new Map()
	d3.select('svg').on('click', function(e, d) {
		console.log(`click on map`)
		intersects.clear()
		minDistance = Infinity
		minCountry = undefined
		minD = undefined
		const pointer = [e.clientX-5, e.clientY-25];	//pointer (mouse or finger)
		countryPaths.forEach((b, name) => {	//for each path representing a country...
			const [x1, y1] = b.bounds[0];
			const [x2, y2] = b.bounds[1];
			//...check whether pointer (including its halo) intersects their bounding box
			if (pointer[0]+32 >= x1 && pointer[0]-32 <= x2 && pointer[1]+32 >= y1 && pointer[1]-32 <= y2) {
				console.log(`Pointer intersects with ${name}`);
				intersects.set(name, b)	//the pointer intersects the box, so store the box in a map
			}
		})
		//intersects map now contains all the countries whose bounding box intersects with pointer
		intersects.forEach((b, name) => {	//loop on these boxes to find the closest country (centroid)
			const distance = Math.sqrt((pointer[0] - b.centroid[0]) ** 2 + (pointer[1] - b.centroid[1]) ** 2);
			//console.log(`Distance between pointer and centroid of ${name}: ${distance}`);
			if(distance < minDistance){
				minDistance = distance
				minCountry = name
				minD = b.d
			}
		})
		//check if intersects map contains items: if it's empty, it means we clicked in international waters in the middle of the ocean or near Antarctica
		if(intersects.size > 0){
			console.log(`Closest country is: ${minCountry}, distance: ${minDistance}`)
		}
		handleSelection(e, minD, true)	//fire click function to draw the cues on the map
	})
}

const countryPaths = new Map()

// REQUEST DATA
d3
.json('world_geojson_110m.json')
//.json('africa_geojson.json')
.then(function(json) {
	update(json)
});

