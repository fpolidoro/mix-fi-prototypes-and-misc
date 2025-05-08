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

Date.prototype.getMonthName = function(format=''){
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"]
    var month = months[this.getMonth()]
    
    return format.length === 0 ? month : month.substring(0, format.length)
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

Date.prototype.getWeekOfMonth = function() {
    var firstWeekday = new Date(this.getFullYear(), this.getMonth(), 1).getDay() - 1;
    if (firstWeekday < 0) firstWeekday = 6;
    var offsetDate = this.getDate() + firstWeekday - 1;
    return Math.floor(offsetDate / 7)+1;
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

        const dataArray = Array.from(new Set(data.map(d => new Date(+d.day_time))))
        //console.log(data.filter(d => d.day_time))
        const myGroups = dataArray.slice().sort((a,b) => a.getMonth() > b.getMonth()).map(d => d.getMonthName('mmm')).filter((u,i,self) => self.indexOf(u) === i)
        const groups = dataArray.slice().sort((a,b) => a.getMonth() > b.getMonth()).map(d => d.getMonth()).filter((u,i,self) => self.indexOf(u) === i)
        const myVars = dataArray.slice().map(d => d.getWeekOfMonth()).sort((a,b) => a < b).filter((u,i,self) => self.indexOf(u) === i).map(d => `w${d}`)
        console.log(myVars)
        console.log(myGroups)


        height = gridsize*6
    
        var width = groups.length > 1 ? (groups[groups.length-1] - groups[0] + 1)*gridsize : gridsize
        console.log(groups)

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

        // Add title to graph
        d3.select("#my_dataviz")
            .append("text")
            .attr("x", viewportwidth/2)
            .attr("y", height + margintop + marginbottom)
            .attr("class", "y-axis-title")
            .style("max-width", viewportwidth)
            .style("margin-left", marginleft)
            .text("month");

        // Use the gradient to set the shape fill, via CSS.
        var axis = d3.select("#my_dataviz")
            .append("svg")
            .attr("class", "y-axis")
            .attr('width', marginleft)
            .attr('height', height + margintop + marginbottom)
            .style("top", marginbottom + 1)

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
            .attr('width', marginleft)
            .attr('height', height + margintop + marginbottom)
            
        axis = axis.append("g")
            .attr("transform", `translate(${marginleft}, 0)`)
            .on("click", function (d) {
                console.log(`Y clicked`)
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
            .domain([120000, 10000])

        const stepCount = function(d) {
            let count = data.filter(dd => {
                let ddate = new Date(+dd.day_time)
                let date = new Date(+d.day_time)
                return ddate.getMonth() === date.getMonth() && ddate.getWeekOfMonth() === date.getWeekOfMonth()
            })

            var cnt = 0
            count.forEach(c => c.count < 0 ? cnt += 0 : cnt += +c.count)

            return cnt
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
            var cnt = stepCount(d)
            var date = new Date(+d.day_time)

            tooltip
                .html(`${date.getMonthName()} ${date.getFullYear()}, week ${date.getWeekOfMonth()}, total steps: ${cnt <= 0 ? 'No data' : cnt}`)
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

                var cnt = stepCount(d)
                var date = new Date(+d.day_time)

                tooltip
                    .html(`${date.getMonthName()} ${date.getFullYear()}, week ${date.getWeekOfMonth()}, total steps: ${cnt <= 0 ? 'No data' : cnt}`)
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
            let date = new Date(+d.day_time)
            return date.getMonthName('mmm')+':'+date.getWeekOfMonth();
        })
        .join("rect")
        .attr("x", function (d) {
            return x_axis(new Date(+d.day_time).getMonthName('mmm'))
        })
        .attr("y", function (d) {
            return y_axis(`w${new Date(+d.day_time).getWeekOfMonth()}`)
        })
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("width", x_axis.bandwidth())
        .attr("height", y_axis.bandwidth())
        .style("fill", function (d) {
            var cnt = stepCount(d)//new Date(+d.day_time).getMonth()+':'+new Date(+d.day_time).getWeekOfMonth();

            return cnt === 0 ? '#efebe9' : myColor(cnt)
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