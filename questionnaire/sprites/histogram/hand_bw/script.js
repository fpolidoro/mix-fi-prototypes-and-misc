var modules = [
  //`https://cdnjs.cloudflare.com/ajax/libs/d3/7.6.1/d3.min.js`,
  //`https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js`
  `../../../../libs/d3.v6.js`,
  `../../../../libs/jquery-3.6.0-min.js`
]

const el = document.getElementById("anim")
const MIN = 256
const MAX = MIN*3
const LAST = MIN+MAX


Promise.all(
  modules.map((module, _) =>
    import(module)
  )
).then(() => {
  let lastPosY = 0
  let startK = 0
  const zoom = d3.zoom()
    .on("start", e => {
      //console.info("zoom start")
      el.style.backgroundPositionY = `${lastPosY}px`
      startK = e.transform.k
    })
    .on("zoom", e => {
      if(e.transform.k - startK > 0 && lastPosY <= -MIN){
        //console.log(`Zoom in ${e.transform.k}`)
        el.style.backgroundPositionY = `${lastPosY += MIN}px`
      }else if(e.transform.k - startK < 0 && lastPosY >= -MAX){
        //console.log(`Zoom out ${e.transform.k}`)
        el.style.backgroundPositionY = `${lastPosY -= MIN}px`
      }/*else{
        console.warn(`Zoom ${e.transform.k < 1 ? 'out':'in'}: ${e.transform.k}\nlastPosY: ${lastPosY}`)
      }*/
      //console.log(`zoom, bpy: ${el.style.backgroundPositionY}`)
    })
    .on("end", e => {
      if(e.transform.k - startK > 0 && lastPosY <= -MIN){
        //console.log(`Zoom in ${e.transform.k}`)
        el.style.backgroundPositionY = `${lastPosY = -LAST}px`
      }else if(e.transform.k - startK < 0 && lastPosY >= -MAX){
        //console.log(`Zoom out ${e.transform.k}`)
        el.style.backgroundPositionY = `${lastPosY = 0}px`
      }
      //console.info(`zoom end, bpy: ${el.style.backgroundPositionY}`)
    });

  d3.select("#anim").call(zoom)
  d3.select("#reset").on("click", () => {
    el.style.backgroundPositionY = `0px`
  })
})