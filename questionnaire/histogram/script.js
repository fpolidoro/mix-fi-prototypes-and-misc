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

    // set the dimensions and margins of the graph
    const margin = {top: 10, right: 30, bottom: 30, left: 40}

    // append the svg object to the body of the page
    const svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", viewportwidth - margin.left - margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        `translate(${margin.left},${margin.top})`);

    // get the data
    d3.csv("../../data/steps_10.csv").then( function(data) {
        data = data.filter((d, index) => data.findIndex(dd => dd.day_time === d.day_time) === index)
        data.forEach(d => d.day_time = new Date(+d.day_time))
        data.sort((a, b) => a.day_time.isBefore(b.day_time))
        var toSplice = []
        data.reverse().forEach((d,i) => {
            var current = d.day_time.valueOf()
            if(i < data.length-2){
                var next = data[i+1].day_time.valueOf()
                var diff = Math.floor((next-current)/(24*3600*1000))
                if(diff < -1 || diff > 1){
                    toSplice.push({diff: Math.abs(diff)-1, start: i})
                }
            }
        })

        toSplice.forEach((d,k) => {
            var rows = []
            for(var i=0; i<Math.abs(d.diff); i++){
                var row = i === 0 ? Object.assign({}, data[d.start]) : Object.assign({}, rows[i-1])              
                row.count = -1
                if(d.diff < 0){
                    row.day_time = row.day_time.valueOf() - 24*3600*1000
                    rows.unshift(row)
                }else{
                    row.day_time = row.day_time.valueOf() + 24*3600*1000
                    rows.push(row)
                } 
                
            }
            var first = data.slice(k === 0 ? 0 : toSplice[k-1].start, d.start)
            var last = data.slice(d.start, data.length)
            data = first.concat(rows, last)
        })

        data.reverse()

        var dateTimeExtent = d3.extent(data, d => d.day_time)
        // used to bin data by a time interval consistently, here data is being binned in a 2 hour interval
        var thresholds = d3.timeDay.every(1).range(...dateTimeExtent)

        // X axis: scale and draw:
        const x = d3.scaleTime()
        //.domain([0, 1000])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
        //.range([0, width]);
        .domain(dateTimeExtent)
        .range([0, viewportwidth - margin.right - margin.left])

        var oldK = 0
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            /*.on("dblclick", function(e) {
                update('m')
            });*/
            .call(d3.zoom().on("zoom", function (e) {
                //svg.attr("transform", d3.event.transform)
                if(Math.abs(oldK - e.transform.k) > 0.8){
                    if(e.transform.k >= 1){
                        console.log(`Zoom in ${e.transform.k}`)
                    }else{
                        console.log(`Zoom out ${e.transform.k}`)
                    }
                    if(e.transform.k < 1){
                        update('d')
                    }else if(e.transform.k >= 1 && e.transform.k < 2){
                        update('w')
                    }else if(e.transform.k >= 2){
                        update('m')
                    }
                    oldK = e.transform.k
                }
            }))

        // Y axis: initialization
        var y = d3.scaleLinear()
            .range([height, 0]);
        var yAxis = svg.append("g")

        // A function that builds the graph for a specific value of bin
        function update(span) {
            switch(span){
                case 'm':
                    thresholds = d3.timeMonth.every(1).range(...dateTimeExtent)
                    break
                case 'w':
                    thresholds = d3.timeWeek.every(1).range(...dateTimeExtent)
                    break
                case 'd':
                default:
                    thresholds = d3.timeDay.every(1).range(...dateTimeExtent)
            }

            // set the parameters for the histogram
            var histogram = d3.histogram()
                .value(function(d) { return d.day_time; })  // I need to give the vector of value
                .domain(x.domain())  // then the domain of the graphic
                .thresholds(/*x.ticks(nBin)*/thresholds); // then the numbers of bins

            // And apply this function to data to get the bins
            var bins = histogram(data);

            // Y axis: update now that we know the domain
            y.domain([0, d3.max(bins, function(d) {
                return d.map(dd => +dd.count).reduce((p,c) => p+c)
            })]);   // d3.hist has to be called before the Y axis obviously
            yAxis
                .transition()
                .duration(1000)
                .call(d3.axisLeft(y));

            // Join the rect with the bins data
            var u = svg.selectAll("rect")
                .data(bins)

            // Manage the existing bars and eventually the new ones:
            u
                .enter()
                .append("rect") // Add a new rect for each new elements
                .merge(u) // get the already existing elements as well
                .transition() // and apply changes to all of them
                .duration(1000)
                .attr("x", 1)
                .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.map(dd => +dd.count).reduce((p,c) => p+c)) + ")"; })
                .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
                .attr("height", function(d) { return height - y(d.map(dd => +dd.count).reduce((p,c) => p+c)); })
                .style("fill", "#69b3a2")


            // If less bar in the new histogram, I delete the ones not in use anymore
            u
                .exit()
                .remove()
            }


        // Initialize with 20 bins
        update(20)

        // Listen to the button -> update if user change it
        d3.select("#nBin").on("input", function() {
            update(+this.value);
        });
    })
})