var modules = [
`https://cdnjs.cloudflare.com/ajax/libs/d3/7.6.1/d3.min.js`,
`https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js`
]

Date.prototype.getWeek = function () {
    var target  = new Date(this.valueOf());
    var dayNr   = (this.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    var firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() != 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
}


Date.prototype.getWeekDay = function(format='') {
    const weekday = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    var isSunday = this.getDay()-1

    /*if(isSunday < 0){
        console.warn(`${this.toDateString()} is a Sunday: ${isSunday}, week ${weekday[6]}`)
    }*/
    isSunday = isSunday < 0 ? 6 : isSunday
    day = weekday[isSunday]

    return format.length === 0 ? day : day.substring(0, format.length);
}

Date.prototype.isBefore = function(date) {
    var current = this.valueOf()
    var other = date.valueOf()

    return current < other
}

Promise.all(
    modules.map((module, _) =>
        import(module)
    )
).then(() => {
    console.log(`modules loaded!`)
    var viewportwidth = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;

    var height = (window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight)/2;

    var gridsize = 32
    var fontsizeaxis = 11

    var //width = 800,
        //height = 400,
        margintop = 24,
        marginbottom = 8,
        marginright = 32,
        marginleft = 40

    var oldData
    d3.csv("../../data/steps_10.csv").then(function (data) {
        console.log(`creation_time: ${data[0].day_time}: ${new Date(+data[0].day_time)}`)
        data = data.filter((d, index) => data.findIndex(dd => dd.day_time === d.day_time) === index)
        data.forEach(d => d.day_time = new Date(+d.day_time))
        data.sort((a, b) => a.day_time.isBefore(b.day_time))
        var toSplice = []
        data.reverse().forEach((d,i) => {
            var current = +d.day_time
            /*if(i === 0){
                let firstDate = new Date(current)
                if(firstDate.getDay() !== 1){
                    toSplice.push({diff: -firstDate.getDay(), start: 0})
                    console.error(`first day is not a Monday: ${firstDate.getDay()}`)
                }
            }*/
            if(i < data.length-2){
                var next = +data[i+1].day_time
                var diff = Math.floor((next-current)/(24*3600*1000))
                if(diff < -1 || diff > 1){
                    console.log(`There are ${diff} days between ${new Date(current)} [${i}] and ${new Date(next)} [${i+1}]`)
                    toSplice.push({diff: Math.abs(diff)-1, start: i})
                    console.log(toSplice)
                }
            }
        })

        console.log(data.length)

        toSplice.forEach((d,k) => {
            var rows = []
            for(var i=0; i<Math.abs(d.diff); i++){
                console.log(`start ${d.start+i}`)
                var row = i === 0 ? Object.assign({}, data[d.start]) : Object.assign({}, rows[i-1])
                console.log(`[${i}]day_time: ${row.day_time}`)                 
                row.count = -1
                console.log(`add ${new Date(+row.day_time)}`)
                if(d.diff < 0){
                    row.day_time = +row.day_time - 24*3600*1000
                    rows.unshift(row)
                }else{
                    row.day_time = +row.day_time + 24*3600*1000
                    rows.push(row)
                } 
                
            }
            console.log(rows)
            var first = data.slice(k === 0 ? 0 : toSplice[k-1].start, d.start)
            var last = data.slice(d.start, data.length)
            data = first.concat(rows, last)
        })

        data.reverse()


        var dateTimeExtent = d3.extent(data, d => d.day_time)
        // used to bin data by a time interval consistently, here data is being binned in a 2 hour interval
        var thresholds = d3.timeDay.every(1).range(...dateTimeExtent)
        height = gridsize*7
        //var width = myGroups.length > 1 ? (myGroups[myGroups.length-1] - myGroups[0])*gridsize : gridsize

        var width
        if(thresholds.length*8 < viewportwidth){
            width = viewportwidth /*- marginright*/ - marginleft
        }else{ 
            width = thresholds.length*8 - marginright - marginleft
        }

        var data_svg = d3.select("#my_dataviz")
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

        // Add title to graph
        d3.select("#my_dataviz")
            .append("text")
            .attr("x", viewportwidth/2)
            .attr("y", height + margintop + marginbottom)
            .attr("class", "y-axis-title")
            .style("max-width", viewportwidth)
            .style("margin-left", marginleft)
            .text("week");

        // Use the gradient to set the shape fill, via CSS.
        var y_axis = d3.select("#my_dataviz")
            .append("svg")
            .attr("class", "y-axis")
            .attr('width', marginleft)
            .attr('height', height + margintop + marginbottom)
            .style("top", marginbottom + 1)

        var mainGradient = y_axis.append('defs')
            .append('linearGradient')
            .attr('id', 'mainGradient')
        
        mainGradient.append('stop')
            .attr('class', 'stop-left')
            .attr('offset', '0.9')

        mainGradient.append('stop')
            .attr('class', 'stop-right')
            .attr('offset', '1')

        y_axis.append("rect")
            .classed('filled', true)
            .attr('width', marginleft)
            .attr('height', height + margintop + marginbottom)
            
        y_axis = y_axis.append("g")
            .attr("transform", `translate(${marginleft}, 0)`)
            .on("click", function (d) {
                console.log(`Y clicked`)
            })

        // X axis: scale and draw:
        const x = d3.scaleTime()
        .domain(dateTimeExtent)
        
        var x_axis = data_svg.append("g")
            .style("font-size", fontsizeaxis)
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).tickSize(0).tickPadding([16]))
            .attr("class", "x_axis")
            .select(".domain").remove()
            .selectAll("text")
            .on("wheel.zoom", function(event, d){
                event.preventDefault()
                console.log("wheeled")
            })

        var y = d3.scaleBand()
            .range([height, 0])
            .padding(0.05);

        y_axis.call(d3.axisLeft(y).tickSize(0).tickPadding([16]))
            .style("font-size", fontsizeaxis)
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
        const stepCount = (d) => d.map(dd => +dd.count < 0 ? 0 : +dd.count).reduce((p,c) => p+c)

        var oldK = 0
        var oldSpan = 'd'

        // A function that builds the graph for a specific value of bin
        function update(span) {
            let ticks
            switch(span){
                case 'm':
                    thresholds = d3.timeMonth.every(1).range(...dateTimeExtent)
                    ticks = thresholds
                    break
                case 'w':
                    thresholds = d3.timeWeek.every(1).range(...dateTimeExtent)
                    ticks = thresholds
                    break
                case 'h':
                    thresholds = d3.timeHour.every(1).range(...dateTimeExtent)
                    ticks = d3.timeHour.every(6).range(...dateTimeExtent)
                    break
                case 'd':
                default:
                    thresholds = d3.timeDay.every(1).range(...dateTimeExtent)
                    ticks = d3.timeMonday.every(1).range(...dateTimeExtent)
            }
            var width
            if(thresholds.length*8 < viewportwidth){
                width = viewportwidth /*- marginright*/ - marginleft
            }else{ 
                width = thresholds.length*8 - marginright - marginleft
            }

            data_svg.attr("width", width)
            x.range([0, width])

            // set the parameters for the histogram
            var histogram = d3.histogram()
                .value(function(d) { return d.day_time; })  // I need to give the vector of value
                .domain(x.domain())  // then the domain of the graphic
                .thresholds(/*x.ticks(nBin)*/thresholds); // then the numbers of bins
            var bins = histogram(data);
            x_axis.call(d3.axisBottom(x).tickValues(/*thresholds*/ticks))
            let max = d3.max(bins, function(d) {
                return stepCount(d)
            })
            // Y axis: update now that we know the domain
            y.domain([0, max]);   // d3.hist has to be called before the Y axis obviously

            y_axis
                .transition()
                .duration(1000)
                .call(d3.axisLeft(y));

            data_svg.selectAll()
                .data(data, function (d) {
                    return d.day_time;
                })
                .join("rect")
                /*.enter()
                .append("rect")*/
                .attr("x", function (d) {
                    let res = d3.utcMonday.count(d3.utcYear(d.day_time), d.day_time) * gridsize + 2
                    console.log(res)
                    return res
                })
                .attr("y", function (d) {
                    let res = 0
                    if(d.day_time instanceof Date && !isNaN(d.day_time)){
                        res = d.day_time.getDay() * gridsize + 0.5
                        console.log(res)
                    }
                    
                    return res
                })
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("width", /*x.bandwidth()*/24)
                .attr("height", /*y.bandwidth()*/24)
                .style("fill", function (d) {
                    return d.count < 0 ? '#efebe9' : myColor(d.count)
                })
                .style("stroke-width", 4)
                .style("stroke", "none")
                .style("opacity", 0.8)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)
                .on("click", tapsquare)
        }

        // create a tooltip
        const tooltip = d3.select("#tile-details")
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
                .html(`${new Date(+d.day_time).toString()} steps: ${d.count < 0 ? 'No data' : d.count}`)
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
                console.log(`square deselected`)
            }else{
                if(oldData !== null){
                    tooltip
                        .style("opacity", 0)
                    d3.select(oldData)
                        .style("stroke", "none")
                        .style("opacity", 0.8)
                    console.log(`deselecting old`)
                }
                tooltip
                    .html(`${new Date(+d.day_time).toString()}, steps: ${d.count < 0 ? 'No data' : d.count}`)
                    .style("left", (event.x)/2 + "px")
                    .style("top", (event.y)/2 + "px")

                tooltip
                    .style("opacity", 1)
                d3.select(this)
                    .style("stroke", "#333")
                .style("opacity", 1)
                console.log(`selected square`)
                oldData = this
            }
        }

        const squaresize = gridsize/1.5
        const legend = d3.select('#legend')
        .append("svg")
        .attr("width", (squaresize*8) + marginleft + marginright)
        // No margin-top required here, because the other element already took care of it
        .attr("height", 64)
        .attr('transform', `translate(0, 8)`)
        .attr('class', 'legend')

        const categoriesCount = 7;

        const categories = [...Array(categoriesCount)].map((_, i) => {
            const upperBound = 30000 / categoriesCount * (categoriesCount - i);
            const lowerBound = 30000 / categoriesCount * (categoriesCount - i - 1);

            return {
                upperBound,
                lowerBound,
                color: d3.interpolateInferno(upperBound / 30000)
            };
        });

        categories.unshift({
            upperBound: -1,
            lowerBound: -1,
            color: '#efebe9'
        })

        legend
        .selectAll('rect')
        .data(categories)
        .enter()
        .append('rect')
        .attr('fill', d => d.color)
        .attr('x', (d, i) => (squaresize+2) * i + (i===0 ? 16 : 24))
        .attr("y", 20)
        .attr("rx", 4)
        .attr("ry", 4)
        .style("stroke-width", 4)
        .style("stroke", "none")
        .style("opacity", 0.8)
        .attr('width', squaresize)
        .attr('height', squaresize)

        legend
          .selectAll("text")
          .data(categories)
          .join("text")
          .attr("x", (d, i) => (squaresize+2) * i + (i === 0 ? 16 : squaresize+4))
          .attr("y", 32)
          .attr("dy", squaresize)
          .attr("text-anchor", "start")
          .attr("font-size", 11)
          .text(d => d.upperBound < 0 ? `N/D` : `${((30000 - d.lowerBound)/1000).toFixed(0)}k`);

        legend
          .append("text")
          .attr("x", 16)
          .attr("y", 12)
          .attr("font-size", 14)
          .text("Steps");

        update(oldSpan)
    })
})