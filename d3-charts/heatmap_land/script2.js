var modules = [
    `https://cdnjs.cloudflare.com/ajax/libs/d3/7.6.1/d3.min.js`,
    `https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js`
    ]

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
            margin = {top: 24, bottom: 8, right: 32, left: 40}
    
        var oldData
        d3.csv("../../data/steps_10.csv").then(function (data) {
            console.log(`creation_time: ${data[0].day_time}: ${new Date(+data[0].day_time)}`)
            data.forEach(d => d.day_time = new Date(+d.day_time))
            data.sort((a, b) => new Date(+a.day_time).isBefore(new Date(+b.day_time)))
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
            //console.log(data.filter(d => d.day_time))
            const myGroups = []//Array.from(new Set(data.map(d => new Date(+d.day_time).getWeek()))).sort((a,b) => a > b)
            const myVars = []/*Array.from(new Set(data.map(d => new Date(+d.day_time)))).sort((a,b) => {
                var aday = a.getDay()-1 < 0 ? 6 : a.getDay()-1
                var bday = b.getDay()-1 < 0 ? 6 : b.getDay()-1
                                    
                return aday < bday
            }).map(d => d.getWeekDay('ddd')).filter((u,i,self) => self.indexOf(u) === i)
            console.log(myVars)*/

            //x_update_subject.subscribe(c => console.warn(c))
            //x_update_subject.next("bla")

            function x_update(span){
                switch(span){
                    case 'm':
                        myGroups = d3.group(data, d => d3.timeMonth.every(1).range(...dateTimeExtent))
                        break
                    case 'w':
                        myGroups = d3.group(data, d => d3.timeWeek.every(1).range(...dateTimeExtent))
                        break
                    case 'd':
                    default:
                        myGroups = d3.group(data, d => d3.timeDay.every(1).range(...dateTimeExtent))
                }

            }

            function y_update(span){

            }

            height = gridsize*7
            var width = myGroups.length > 1 ? (myGroups[myGroups.length-1] - myGroups[0])*gridsize : gridsize

            var svg = d3.select("#my_dataviz")
                .append("div")
                // Note the CSS rules for .chart
                .attr("class", "chart")
                //.style("max-width", width)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                // No margin-top required here, because the other element already took care of it
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                // Same, no margin-top
                .attr("transform", `translate(${margin.left}, 0)`);

            // Add title to graph
            d3.select("#my_dataviz")
                .append("text")
                .attr("x", viewportwidth/2)
                .attr("y", height + margin.top + margin.bottom)
                .attr("class", "y-axis-title")
                .style("max-width", viewportwidth)
                .style("margin-left", margin.left)
                .text("week");

            // Use the gradient to set the shape fill, via CSS.
            var axis = d3.select("#my_dataviz")
                .append("svg")
                .attr("class", "y-axis")
                .attr('width', margin.left)
                .attr('height', height + margin.top + margin.bottom)
                .style("top", margin.bottom + 1)

            var mainGradient = axis.append('defs')
                .append('linearGradient')
                .attr('id', 'mainGradient')
            
            mainGradient.append('stop')
                .attr('class', 'stop-left')
                .attr('offset', '0.9')

            mainGradient.append('stop')
                .attr('class', 'stop-right')
                .attr('offset', '1')

            axis.append("rect")
                .classed('filled', true)
                .attr('width', margin.left)
                .attr('height', height + margin.top + margin.bottom)
                
            axis = axis.append("g")
                .attr("transform", `translate(${margin.left}, 0)`)
                .on("click", function (d) {
                    console.log(`X clicked`)
                })

            var x_axis = d3.scaleBand()
                .range([0, width])
                .domain(myGroups)
                .padding(0.05);

            svg.append("g")
                .style("font-size", fontsizeaxis)
                .attr("transform", `translate(0, ${height})`)
                .call(d3.axisBottom(x_axis).tickSize(0).tickPadding([16]))
                .attr("class", "x_axis")
                .select(".domain").remove()
                .selectAll("text")
                .on("wheel.zoom", function(event, d){
                    event.preventDefault()
                    console.log("wheeled")
                })

            // axis.call(d3.axisBottom(x_axis).tickSize(0).tickPadding([16]))
            // 	.selectAll("text")
            // 	.style("text-anchor", "end")
            // 	.style("position", "fixed")
            // 	.attr("dx", 15)
            // 	.attr("dy", 5)
            // 	.attr("transform", "rotate(-65)");

            var y_axis = d3.scaleBand()
                .range([height, 0])
                .domain(/*["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]*/myVars)
                .padding(0.05);

            axis.call(d3.axisLeft(y_axis).tickSize(0).tickPadding([16]))
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

            svg.selectAll()
            .data(data, function (d) {
                return new Date(+d.day_time).getWeek()+':'+new Date(+d.day_time).getWeekDay('ddd');
            })
            .join("rect")
            /*.enter()
            .append("rect")*/
            .attr("x", function (d) {
                return x_axis(new Date(+d.day_time).getWeek())
            })
            .attr("y", function (d) {
                return y_axis(new Date(+d.day_time).getWeekDay('ddd'))
            })
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("width", x_axis.bandwidth())
            .attr("height", y_axis.bandwidth())
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
        })

    
})