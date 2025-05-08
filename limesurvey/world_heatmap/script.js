$('#answer519483X8X62SQ003comment').hide()
$('#answer519483X8X62SQ001').prop('disabled', true).css('border-color', '#0dcaf0')
$('#answer519483X8X62SQ001').parent().css('position', 'relative')
$('#answer519483X8X62SQ001').after(`<div style="position: absolute;top: 0;left: 0;right: 0;bottom: 0;"></div>`)

$('.selector--inputondemand-addlinebutton').html(`<i class="fa fa-plus ri-add-line"></i> Add another culture`)

$('#question62').find('.answer-container').after(`
<div class="ls-answers">
<div class="question-item answer-item checkbox-item mb-1">
<div class="row">
<div class="col-auto"><input id="box519483X8X62SQ000" type="checkbox" /><label class="checkbox-label control-label" for="box519483X8X62SQ000">Prefer not to answer</label></div>
</div>
</div>
</div>`)

let curSubQuestionNo = '001'
let selectedCountries = [
    {
        d: undefined,
        pageX: NaN,
        pageY: NaN,
        bubble: undefined
    },
    {
        d: undefined,
        pageX: NaN,
        pageY: NaN,
        bubble: undefined
    }
]

const pointerHalo = 48	//radius of the pointer's halo

let projection = d3.geoEquirectangular().translate([480,250-$('#world').parent().prevAll().map((index, element) => $(element).outerHeight()).get().reduce((a, b) => a+b, 0)])
let geoGenerator = d3.geoPath().projection(projection);

const RED = 0
const GREEN = 1
let select$ = new window.rxjs.Subject()
let semaphore$ = new window.rxjs.BehaviorSubject(GREEN)

function update(geojson) {
	let u = d3.select('svg g.map')
		.selectAll('path')
		.data(geojson.features);

	u.enter()
		.append('path')
		.attr('d', geoGenerator)
		.attr('fill', '#ededed')
		.attr('id', d => d.properties.ADM0_ISO)
		.on('click', (e, d) => select$.next([e, d, false]))
		.each(function(d) {	//prepare the map for storing the path of each country, which will be used by the click handlers to validate the user's input
			if(d.properties.name !== 'Antarctica'){
			    countryPaths.set(d.properties.name, { centroid: geoGenerator.centroid(d), d: d, bounds: geoGenerator.bounds(d) })
			}
		});

	//handle clicks on areas other than the paths representing the countries
	const intersects = new Map()
	d3.select('svg').on('click', function(e, d) {
		console.log(`click on map`)
		let offsetY = -$('#world').position().top;
		intersects.clear()
		minDistance = Infinity
		minCountry = undefined
		minD = undefined
		const pointer = [e.pageX-$('#world').position().left, e.pageY+offsetY];	//pointer (mouse or finger)
		countryPaths.forEach((b, name) => {	//for each path representing a country...
			const [x1, y1] = b.bounds[0];
			const [x2, y2] = b.bounds[1];
			//...check whether pointer (including its halo) intersects their bounding box
			if (pointer[0]+pointerHalo >= x1 && pointer[0]-pointerHalo <= x2 && pointer[1]+pointerHalo >= y1 && pointer[1]-pointerHalo <= y2) {
				console.log(`Pointer intersects with ${ name }`);
				intersects.set(name, b);	//the pointer intersects the box, so store the box in a map
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
			console.log(`Closest country is: ${ minCountry }, distance: ${ minDistance }`)
		}
		select$.next([e, minD, true]);	//fire click function to draw the cues on the map
	})
}

const countryPaths = new Map()

// request data
d3.json('/upload/surveys/519483/files/world_110m_inv.jpg').then((json) => update(json));

//handle gradient overlays to signal scroll availability
const gradL = $('.gradL')
const gradR = $('.gradR')
window.rxjs.fromEvent($('#svg-container'), 'scroll').pipe(
    window.rxjs.startWith(null) //this is to rearrange the gradients as soon as the page is loaded
).subscribe(() => {
    if ($('#svg-container').scrollLeft() == 0) {
        console.log(`Reached 0`);
        gradL.hide()
    }else if($('#svg-container').scrollLeft() == $('#svg-container')[0].scrollLeftMax){
        console.log(`Reached right`)
        gradR.hide()
    }else{
        gradL.show()
        gradR.show()
    }
})

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
let handlePointers$ = window.rxjs.pipe(
    window.rxjs.tap(([e, d, bubble]) => {
        d3.select('svg g.map')
    		.selectAll('path').attr('fill', '#ededed')
    		
    	let offsetX = -$('#world').position().left;
    	let offsetY = -$('#world').position().top;
    	
    	selectedCountries[+curSubQuestionNo-1] = {
            d: d ,
            pageX: e.pageX+offsetX,
            pageY: e.pageY+offsetY,
            bubble: bubble
        }
        console.log(selectedCountries)
    	
    	selectedCountries.forEach((country, index) => {
    	    if(country.d !== undefined && country.d.properties.name !== 'Antarctica'){
                d3.select(`#${ country.d.properties.ADM0_ISO }`).attr('fill', '#0dcaf0')
        		d3.select(`svg .poi#culture00${ index+1 }`)	//draw pointer
        			.style('display', 'inline')
        			.style('fill', country.bubble ? '#0dcaf0' : '#0a58ca')	//fill the circle with gray if selection is invalid
        			.attr('transform', `translate(${ country.pageX }, ${ country.pageY })`);
        		console.log(`${ index }: ${ country.d.properties.name }`)
        		$(`#answer519483X8X62SQ00${ index+1 }`).val(`${ country.d.properties.SUBREGION } (${ country.d.properties.name })`).trigger('keyup')  
        	}else{	//selection is invalid, because there is no nearby country
        		console.log(`${ index }: Invalid selection`)
    		    if(!isNaN(country.pageX) && !isNaN(country.pageY)){
    		        d3.select(`svg .poi#culture00${ index+1 }`)	//draw pointer
            			.style('display', 'inline')
            			.style('fill', country.d !== undefined && country.d.properties.name === 'Antarctica' ? '#a9a9a9' : '#ddd')	//fill the circle with gray if selection is invalid
            			.attr('transform', `translate(${ country.pageX }, ${ country.pageY })`);
    		    }else{
    		        d3.select(`svg .poi#culture00${ index+1 }`)	//hide pointer
            			.style('display', 'none')
    		    }
    		    $(`#answer519483X8X62SQ00${ index+1 }`).val(null).trigger('keyup')
    	    }  
    	})
    	e.stopPropagation();	//prevent the event from bubbling up to the parent (SVG) to avoid recursive calls to this method
    })
)

//handle selections on the map
select$.pipe(
    window.rxjs.tap(() => {
        //when a selection occurs, check whether the checkbox is checked and, if it is...
        if(cbNoAnswer.prop('checked') && $(`#answer519483X8X62SQ001`).val() === 'Prefer not to answer'){
            semaphore$.next(RED)    //...set the semaphore to red
            cbNoAnswer.prop('checked', false)   //...remove the tick
            $('#selector--inputondemand-519483X8X62').show()    //...and display the forms
        }else console.log(`Checkbox not checked, proceed`)
    }),
    handlePointers$,
    window.rxjs.tap(() => semaphore$.next(GREEN))   //reset the semaphore so that the checkbox change observer can resume its observation
).subscribe()

const cbNoAnswer = $('#box519483X8X62SQ000')

//handle the changes on the Prefer not to answer checkbox
window.rxjs.fromEvent(cbNoAnswer, 'change').pipe(
    window.rxjs.skipUntil(semaphore$.pipe(  //ignore the events if semaphore is red. Red means that select$ is firing the change event and handling it on its own
        window.rxjs.filter((light) => light === GREEN)
    )),
    window.rxjs.mergeMap((event) => 
        window.rxjs.iif(() => cbNoAnswer.prop('checked'),
        window.rxjs.defer(() => window.rxjs.of(1).pipe( //Prefer not to answer is checked...
            window.rxjs.map(() => {
                $('#selector--inputondemand-519483X8X62').hide()    //...hide the form...
                selectedCountries = [
                    {
                        d: undefined,
                        pageX: NaN,
                        pageY: NaN,
                        bubble: undefined
                    },
                    {
                        d: undefined,
                        pageX: NaN,
                        pageY: NaN,
                        bubble: undefined
                    }
                ]
                
                return [Object.assign(event, { pageX: NaN, pageY: NaN }), undefined, false]
            }),
            handlePointers$,    //...reset the pointers
            window.rxjs.tap(() => { //...and fill the first form with Prefer not to answer
                $('#answer519483X8X62SQ001').val('Prefer not to answer').trigger('keyup')
            })
        )),
        window.rxjs.defer(() => window.rxjs.of(1).pipe( //Checkbox just unckecked, display the forms
            window.rxjs.tap(() => {
                $('#selector--inputondemand-519483X8X62').show()
                $('#answer519483X8X62SQ001').val(null).trigger('keyup')
                $('#answer519483X8X62SQ002').val(null).trigger('keyup')
            })
        ))
        
    ))
).subscribe()

const addLineBtn = document.getElementsByClassName('selector--inputondemand-addlinebutton')[0]
//observe the clicks on input fields to highlight the borders and select the corresponding mark
window.rxjs.merge(
    window.rxjs.fromEvent($('#answer519483X8X62SQ001').next(), 'click').pipe(window.rxjs.map(() => [1,2])),
    window.rxjs.fromEvent(cbNoAnswer, 'change').pipe(
        window.rxjs.map(() => [1,2])
    ),
    window.rxjs.fromEvent($('.selector--inputondemand-addlinebutton'), 'click').pipe(
        window.rxjs.tap(() => console.log(`clicked add line`)),
        window.rxjs.tap(() => {
            $('#answer519483X8X62SQ002').prop('disabled', true)
            $('#answer519483X8X62SQ002').parent().css('position', 'relative')
            $('#answer519483X8X62SQ002').after(`<div style="position: absolute;top: 0;left: 0;right: 0;bottom: 0;"></div>`)
        }),
        window.rxjs.switchMap(() => window.rxjs.fromEvent($('#answer519483X8X62SQ002').next(), 'click').pipe(
            window.rxjs.startWith(null),    //fire immediately, because we have to mirror the click on Add line
            window.rxjs.map(() => [2,1]))
        )
    )
).pipe(
    window.rxjs.tap(([enable, disable]) => {
        $(`#answer519483X8X62SQ00${ enable }`).css('border-color', '#0dcaf0')
        $(`#answer519483X8X62SQ00${ disable }`).css('border-color', '#ddd')
        curSubQuestionNo = `00${ enable }`
    })
).subscribe()