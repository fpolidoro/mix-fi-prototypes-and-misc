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

Date.prototype.getWeekOfMonth = function() {
    var firstWeekday = new Date(this.getFullYear(), this.getMonth(), 1).getDay() - 1;
    if (firstWeekday < 0) firstWeekday = 6;
    var offsetDate = this.getDate() + firstWeekday - 1;
    return Math.floor(offsetDate / 7)+1;
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
                //console.log(`[${i}]day_time: ${row.day_time}`)                 
                row.count = -1
                //console.log(`add ${new Date(+row.day_time)}`)
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
        var original_w = Math.trunc(thresholds.length/7)*gridsize
        if(original_w < viewportwidth){
            width = viewportwidth /*- marginright*/ - marginleft
        }else{ 
            width = original_w// - marginright - marginleft
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
            .attr("class", "x-axis-title")
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
        const x = d3.scaleTime().domain(dateTimeExtent)
        
        var x_axis = data_svg.append("g")
            .style("font-size", fontsizeaxis)
            .attr("transform", `translate(0, ${height})`)
            .attr("class", "x-axis")
            .call(d3.zoom().on("zoom", function (e) {
                //svg.attr("transform", d3.event.transform)
                //if(Math.abs(oldK - e.transform.k) > 0.8){
                    if(e.transform.k >= 1){
                        console.log(`Zoom in ${e.transform.k}`)
                    }else{
                        console.log(`Zoom out ${e.transform.k}`)
                    }

                    if(e.transform.k < 0.5){
                        span = 'h'
                    }else if(e.transform.k >= 0.5 && e.transform.k < 1){
                        span = 'd'
                    }else if(e.transform.k >= 1 && e.transform.k < 2){
                        span = 'w'
                    }else if(e.transform.k >= 2){
                        span = 'm'
                    }
                    if(oldSpan !== span){
                        //update(span)
                        x_zoom$.next(span)
                        oldSpan = span
                    }
                    oldK = e.transform.k
                //}
            }))

        var y = d3.scaleBand()
            .range([height, 0])
            //.padding(0.05);

        /*y_axis.call(d3.axisLeft(y).tickSize(0).tickPadding([16]))
            .style("font-size", fontsizeaxis)
            .select(".domain").remove()
            .selectAll("text")
            //.style("text-anchor", "end")
            .style("position", "fixed")
            .attr("transform", function(d,i){
                return "rotate(-90 " + (50 + 80*i) + " 50)";
            })*/

        var myColor = d3.scaleSequential()
            .interpolator(d3.interpolateInferno)
            .domain([30000, 100])

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
                .html(`${new Date(+d[0]).toString()} steps: ${d.count < 0 ? 'No data' : d.count}`)
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

        var y_zoom$ = new rxjs.BehaviorSubject('d')
        var x_zoom$ = new rxjs.BehaviorSubject('d')
        rxjs.combineLatest([
            x_zoom$.pipe(
                rxjs.operators.map(span => {
                    let ticks
                    let thresholds
                    let lambda

                    switch(span){
                        case 'm':
                            thresholds = d3.timeMonth.every(1).range(...dateTimeExtent)
                            ticks = thresholds
                            lambda = d => d.day_time instanceof Date ? d.day_time.getMonth() : -1
                            break
                        case 'w':
                            thresholds = d3.timeWeek.every(1).range(...dateTimeExtent)
                            ticks = thresholds
                            lambda = d => d.day_time instanceof Date ? d.day_time.getWeek() : -1
                            break
                        case 'h':
                            thresholds = d3.timeHour.every(1).range(...dateTimeExtent)
                            ticks = d3.timeHour.every(6).range(...dateTimeExtent)
                            lambda = () => {}   //TODO
                            break
                        case 'd':
                        default:
                            thresholds = d3.timeDay.every(1).range(...dateTimeExtent)
                            ticks = d3.timeMonday.every(1).range(...dateTimeExtent)
                            lambda = d => d.day_time instanceof Date ? d.day_time.valueOf() : -1
                    }
                    return {span: span, ticks: ticks, thresholds: thresholds, lambda: lambda}
                })
            ),
            y_zoom$.pipe(
                rxjs.operators.map(span => {
                    let ticks
                    let thresholds
                    let lambda
                    let offset
                    let label

                    switch(span){
                        case 'm':
                            thresholds = d3.timeMonth.every(1).range(...dateTimeExtent)
                            ticks = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                            lambda = d => d.day_time instanceof Date ? d.day_time.valueOf() : -1
                            offset = d => Math.abs(d3.utcMonday.count(d, data[data.length-1].day_time))
                            label = "%m"
                            break
                        case 'w':
                            thresholds = d3.timeWeek.every(1).range(...dateTimeExtent)
                            ticks = d3.range([0,6]).reverse()
                            lambda = d => d.day_time instanceof Date ? d.day_time.getDay() : -1
                            offset = d => Math.abs(d3.utcMonday.count(d, data[data.length-1].day_time))
                            label = "W%V"
                            break
                        case 'h':
                            thresholds = d3.timeHour.every(1).range(...dateTimeExtent)
                            ticks = d3.timeHour.every(6).range(...dateTimeExtent)
                            lambda = () => {}   //TODO
                            label = "%H"
                            break
                        case 'd':
                        default:
                            thresholds = d3.timeWeek.every(1).range(...dateTimeExtent)
                            ticks = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].reverse()
                            lambda = d => d.day_time instanceof Date ? d.day_time.getDay() : -1
                            offset = d => Math.abs(d3.utcMonday.count(d, data[data.length-1].day_time))
                            label = "W%V"
                    }
                    return {span: span, ticks: ticks, thresholds: thresholds, lambda: lambda, offset: offset, label: label}
                })
            )
        ]).subscribe(([xbun, ybun]) => {
            console.log(`combineLatest to update: (${xbun.span}, ${ybun.span})`)
            
            original_w = Math.trunc(xbun.thresholds.length/ybun.ticks.length)*gridsize
            
            if(original_w > viewportwidth){
                width = viewportwidth /*- marginright*/ - marginleft
            }else{
                width = original_w //- marginright - marginleft
            }

            data_svg.attr("width", width)
            x.range([0, width])
            console.log(width)

            let min = 0
            let max = 0
            const ddata = d3.rollup(data,
                v => {
                    let sum = d3.sum(v, d => d.count)
                    if(sum < min && sum > 0) min = sum
                    if(sum > max) max = sum
                    return sum
                },
                xbun.lambda,
                ybun.lambda
            )
            console.log(ddata)
            
            //compute max and min values for the domain of the legend and heatmap squares
            let maxr = Math.pow(10, max.toString().length-1)
            let minr = Math.pow(10, min.toString().length-1)
            myColor.domain([Math.ceil(max/maxr)*maxr, Math.floor(min/minr)*minr])

            x_axis.call(d3.axisBottom(x).tickValues(/*thresholds*/xbun.ticks).tickSize(0).tickFormat(d3.timeFormat(ybun.label))).select(".domain").remove()
            
            // Y axis: update now that we know the domain
            y.domain(ybun.ticks);  // d3.hist has to be called before the Y axis obviously

            y_axis
                .transition()
                .duration(1000)
                .call(d3.axisLeft(y).tickSize(0).tickValues(ybun.ticks));

            var u = data_svg.selectAll()
                .data(ddata)
            
            u.enter()
                .append("rect") // Add a new rect for each new elements
                .merge(u) // get the already existing elements as well
                .attr("x", function (d) {
                    console.log(d)
                    let count = ybun.offset(new Date(+d[0]))
                    let res = count * gridsize + 2
                    return res
                })
                .attr("y", function (d) {
                    let res = 0
                    //console.log(d[1])
                    d[1].forEach((v,k) => {
                        //console.log(`${k} ${v}`)
                        res += +k*gridsize + 0.5
                    })
                    //console.log(res)
                    return res
                })
                .attr("rx", 4)
                .attr("ry", 4)
                .attr("width", /*x.bandwidth()*/30)
                .attr("height", /*y.bandwidth()*/30)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave)
                //.on("click", tapsquare)
                .style("fill", function (d) {
                    let count = 0
                    d[1].forEach((v,k) => count += v)
                    return count < 0 ? '#efebe9' : myColor(count)
                })
                .style("stroke-width", 4)
                .style("stroke", "none")
                .style("opacity", 0.8)

            u.exit().remove()
        })


        const stepCount = (d) => d.map(dd => +dd.count < 0 ? 0 : +dd.count).reduce((p,c) => p+c)

        var oldK = 0
        var oldSpan = 'd'

        // // A function that builds the graph for a specific value of bin
        // function update(span) {

        //     var y_ticks = []
        //     d3.timeDay.every(1).range(...dateTimeExtent).map(t => t.getWeekDay('dd')).forEach(t => {
        //         if(y_ticks.findIndex(tt => tt === t) < 0)
        //             y_ticks.push(t)
        //     })
        //     original_w = Math.trunc(thresholds.length/7)*gridsize
            
        //     if(original_w > viewportwidth){
        //         width = viewportwidth /*- marginright*/ - marginleft
        //     }else{
        //         width = original_w //- marginright - marginleft
        //     }

        //     data_svg.attr("width", width)
        //     x.range([0, width])

        //     const mmonths = d3.rollup(data,
        //         v => d3.sum(v, d => d.count),
        //         d => d.day_time instanceof Date ? d.day_time.getMonth() : -1,
        //         d => d.day_time instanceof Date ? d.day_time.getWeekDay() : -1
        //     )
        //     console.log(mmonths)
        //     /*TODO: now must read the x on the first level of the map, and y on the second level of the map:
        //     the value is what the square is going to display */


        //     // set the parameters for the histogram
        //     var histogram = d3.histogram()
        //         .value(function(d) { return d.day_time })  // I need to give the vector of value
        //         .domain(x.domain())  // then the domain of the graphic
        //         .thresholds(/*x.ticks(nBin)*/thresholds) // then the numbers of bins
        //     var bins = histogram(data)

        //     x_axis.call(d3.axisBottom(x).tickValues(/*thresholds*/ticks).tickSize(0).tickFormat(d3.timeFormat("W%V"))).select(".domain").remove()
            
        //     //compute max of domain by taking the ceiling of the actual max (e.g. 27321 becomes 30000)
        //     let max = d3.max(bins, function(d) {
        //         return stepCount(d)
        //     })
        //     let power = Math.pow(10, max.toString().length-1)
        //     console.log(bins)
        //     console.log(`max steps: ${Math.ceil(max/power)*power}`)


        //     // Y axis: update now that we know the domain
        //     y.domain(y_ticks);  // d3.hist has to be called before the Y axis obviously

        //     y_axis
        //         .transition()
        //         .duration(1000)
        //         .call(d3.axisLeft(y).tickSize(0).tickValues(y_ticks));

        //     console.log(d3.utcMonday(data[0].day_time))
        //     var u = data_svg.selectAll()
        //         .data(data, function(d){
        //             //console.log(d)
        //         })
            
        //     u.enter()
        //         .append("rect") // Add a new rect for each new elements
        //         .merge(u) // get the already existing elements as well
        //         .attr("x", function (d) {
        //             //console.log(d)
        //             let count = Math.abs(d3.utcMonday.count(/*d3.utcYear(d.day_time)*/d.day_time, data[data.length-1].day_time))
        //             let res = count * gridsize + 2
        //             return res
        //         })
        //         .attr("y", function (d) {
        //             let res = 0
        //             if(d.day_time instanceof Date && !isNaN(d.day_time)){
        //                 switch(span){
        //                     /*case 'm':
        //                         res = d.day_time.getMonth() * gridsize + 0.5
        //                         break
        //                     case 'w':
        //                         res = d.day_time.getWeekOfMonth() * gridsize + 0.5
        //                         break
        //                     case 'h':
        //                         //no such granularity yet*/
        //                     case 'd':
        //                     default:
        //                         let day = d.day_time.getDay()-1
        //                         day = day < 0 ? 6 : day
        //                         res = day * gridsize + 0.5
        //                 }
        //             }
                    
        //             return res
        //         })
        //         .attr("rx", 4)
        //         .attr("ry", 4)
        //         .attr("width", /*x.bandwidth()*/30)
        //         .attr("height", /*y.bandwidth()*/30)
        //         .style("fill", function (d) {
        //             return d.count < 0 ? '#efebe9' : myColor(d.count)
        //         })
        //         .style("stroke-width", 4)
        //         .style("stroke", "none")
        //         .style("opacity", 0.8)
        //         /*.on("mouseover", mouseover)
        //         .on("mousemove", mousemove)
        //         .on("mouseleave", mouseleave)
        //         .on("click", tapsquare)*/

        //     u.exit().remove()
        // }

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

        //update(oldSpan)
    })
})