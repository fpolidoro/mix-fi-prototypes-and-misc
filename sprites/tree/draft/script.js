var modules = [
  `https://cdnjs.cloudflare.com/ajax/libs/d3/7.6.1/d3.min.js`,
  `https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js`
  // `../../../../libs/d3.v6.js`,
  // `../../../../libs/jquery-3.6.0-min.js`
]

const el = document.getElementById("anim")
const ia1 = document.getElementById("ia-1")
const MIN_1 = 426.6
const MAX_1 = MIN_1*(3)
const LAST_1 = MIN_1+MAX_1

const MIN_2 = 223
const MAX_2 = MIN_2*3


Promise.all(
  modules.map((module, _) =>
    import(module)
  )
).then(() => {
  let lastPosY = 0
  let startK = 0

  function zoom(id, area){
    const zoom = d3.zoom()
    .on("start", e => {
      //console.info("zoom start")
      el.style.backgroundPositionX = `582px`
      el.style.backgroundPositionY = `${lastPosY}px`
      startK = e.transform.k
    })
    .on("zoom", e => {
      if(e.transform.k - startK > 0 && lastPosY <= -MIN_1){
        //console.log(`Zoom in ${e.transform.k}`)
        el.style.backgroundPositionY = `${lastPosY += MIN_1}px`
      }else if(e.transform.k - startK < 0 && lastPosY >= -MAX_1){
        //console.log(`Zoom out ${e.transform.k}`)
        el.style.backgroundPositionY = `${lastPosY -= MIN_1}px`
      }/*else{
        console.warn(`Zoom ${e.transform.k < 1 ? 'out':'in'}: ${e.transform.k}\nlastPosY: ${lastPosY}`)
      }*/
      //console.log(`zoom, bpy: ${el.style.backgroundPositionY}`)
    })
    .on("end", e => {
      //console.log(`zoom`)
      if(e.transform.k - startK > 0 && lastPosY <= -MIN_1){
        console.log(`Zoom in ${e.transform.k}`)
        el.style.backgroundPositionY = `${lastPosY = -LAST_1}px`
      }else if(e.transform.k - startK < 0 && lastPosY >= -MAX_1){
        console.log(`Zoom out ${e.transform.k}`)
        el.style.backgroundPositionY = `${lastPosY = 0}px`
      }
      area.style.pointerEvents = 'none'
      //console.info(`zoom end, bpy: ${el.style.backgroundPositionY}`)
    })
    d3.select(`#${id}`).call(zoom)
  }

  zoom('ia-1', ia1)
  
  d3.select("#ia-2").on("click", () => {
    el.style.backgroundPositionY = '0px'
    console.log(`iterations: ${Math.trunc(MAX_2/MIN_2)}`)
    let lastPosY = MAX_2
    function animate(i) {
      setTimeout(() => {
        lastPosY -= MIN_2
        console.log(`i: ${i}, pos: ${lastPosY}`)
        el.style.backgroundPositionY = `${lastPosY}px`
        if (--i > 1) animate(i)   //decrement i and call animate again if i > 0
      }, (MAX_2/MIN_2)*90)
    }
    animate(Math.trunc(MAX_2/MIN_2))
  })

  d3.select("#reset").on("click", () => {
    el.style.backgroundPositionX = '0px'
    el.style.backgroundPositionY = `0px`
    ia1.style.pointerEvents = 'unset'
    setTimeout(() => { el.style.animation = "" }, 1500)
  })
})