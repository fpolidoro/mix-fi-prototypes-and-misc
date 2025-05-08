var modules = [
//`https://cdnjs.cloudflare.com/ajax/libs/d3/7.6.1/d3.min.js`,
//`https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js`,
//`https://cdnjs.cloudflare.com/ajax/libs/zingtouch/1.0.6/zingtouch.min.js`
`../../libs/zingtouch.js`,
`../../libs/d3.v6.js`,
`../../libs/jquery-3.6.0-min.js`
]

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

    var chart = document.getElementById("chart")
    var oldK = 0
    var oldZ
    let touchCount = 0

    document.querySelector('#target').addEventListener('touchstart', (e) => {
        touchCount = e.touches.length;
    });

    d3.select("#target").call(d3.zoom().on("zoom", function (e){
        console.log(e.transform)
        console.log(touchCount)
        // When 1 finger, do not zoom
        if (touchCount === 1) {
            console.warn(`zooming with one finger`)
            e.sourceEvent.stopPropagation();
            return;
        }

        //if(Math.abs(oldK - e.transform.k) > 0.8){
            console.log(e.transform)
            if(e.transform.k >= 1){
                console.log(`Zoom out ${e.transform.k}`)
                chart.src = "heatmap.svg"
            }else{
                console.log(`Zoom in ${e.transform.k}`)
                chart.src = "heatmap_reconf_x.svg"
                var left = $('#left')
                left.removeClass('slide-left')
                left.hide()
                var right = $('#right')
                right.removeClass('slide-right')
                right.hide()
            }
            oldK = e.transform.k
        //}
    })) 
})