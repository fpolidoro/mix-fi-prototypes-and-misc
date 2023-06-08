var modules = [
  //`https://cdnjs.cloudflare.com/ajax/libs/d3/7.6.1/d3.min.js`,
  //`https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js`
  `../../../../libs/d3.v6.js`,
  `../../../../libs/jquery-3.6.0-min.js`
]

const el = document.getElementById("anim")
const ia1 = document.getElementById("ia-1")
const ia3 = document.getElementById("ia-3")
const MIN_1 = 272
const MAX_1 = MIN_1*(16)
const LAST_1 = MIN_1+MAX_1

const MIN_2 = 272
const MAX_2 = MIN_2*3
let lastPos = 0

const MID = 272*4

Promise.all(
  modules.map((module, _) =>
    import(module)
  )
).then(() => {
  let lastPosY = 0
  let startK = 0

  let touchCount = 2//0

  /*document.querySelector('#ia-3').addEventListener('touchstart', (e) => {
    touchCount = e.touches.length;
  })*/

  function zoom(id, area){
    const zoom = d3.zoom()
    .on("start", e => {
      if(Math.abs(lastPos) === MID && touchCount > 1){
        console.info("zoom start")
        el.style.backgroundPositionX = `0px`
        el.style.backgroundPositionY = `${lastPosY}px`
        startK = e.transform.k
      }
    })
    .on("zoom", e => {
      if(Math.abs(lastPos) === MID && touchCount > 1){
        /*if(e.transform.k - startK > 0 && lastPosY <= -MIN_1){
          //console.log(`Zoom in ${e.transform.k}`)
          el.style.backgroundPositionY = `${lastPosY += MIN_1}px`
        }else */if(e.transform.k - startK < 0 && lastPosY >= -MAX_1){
          console.log(`Zoom out ${e.transform.k}`)
          el.style.backgroundPositionY = `${lastPosY -= MIN_1}px`
        }/*else{
          console.warn(`Zoom ${e.transform.k < 1 ? 'out':'in'}: ${e.transform.k}\nlastPosY: ${lastPosY}`)
        }*/
        //console.log(`zoom, bpy: ${el.style.backgroundPositionY}`)
      }
    })
    .on("end", e => {
      if(Math.abs(lastPos) === MID && touchCount > 1){
        //console.log(`zoom`)
      /*if(e.transform.k - startK > 0 && lastPosY <= -MIN_1){
        console.log(`Zoom in ${e.transform.k}`)
        el.style.backgroundPositionY = `${lastPosY = -LAST_1}px`
      }else*/ if(e.transform.k - startK < 0 && lastPosY >= -MAX_1){
        console.log(`Zoom out ${e.transform.k}`)
        el.style.backgroundPositionY = `${lastPosY = 0}px`
      }
      //area.style.pointerEvents = 'none'
      //console.info(`zoom end, bpy: ${el.style.backgroundPositionY}`)
      }
    })
    d3.select(`#${id}`).call(zoom)
  }
  
  /*d3.select("#ia-2").on("click", () => {
    el.style.backgroundPositionY = '0px'
    console.log(`iterations: ${Math.trunc(MAX_2/MIN_2)}`)
    let lastPosY = MAX_2
    function animate(i) {
      setTimeout(() => {
        lastPosY -= MIN_2
        console.log(`i: ${i}, pos: ${lastPosY}`)
        el.style.backgroundPositionY = `${lastPosY}px`
        if (--i > 1) animate(i)   //decrement i and call animate again if i > 0
      }, (MAX_2/MIN_2)*30)
    }
    animate(Math.trunc(MAX_2/MIN_2))
  })*/

  d3.select("#ia-2").on("click", () => {
    if(lastPos%MAX_1 === 0){  //animate only if we are on the first frame
      //document.getElementById("ia-2").style.pointerEvents = 'auto'
      el.style.backgroundPositionY = '0px'
      console.log(`iterations: ${Math.trunc(MAX_2/MIN_2)}`)
      let lastPosY = 0
      function animate(i) {
        setTimeout(() => {
          lastPosY -= MIN_2
          console.log(`i: ${i}, pos: ${lastPosY}`)
          el.style.backgroundPositionY = `${lastPosY}px`
          lastPos = lastPosY
          if (i++ < Math.trunc(MAX_2/MIN_2)){
            animate(i)
          }   //decrement i and call animate again if i > 0
        }, (MAX_2/MIN_2)*50)
      }
      animate(0)
    }/*else{
      document.getElementById("ia-2").style.pointerEvents = 'none'
    }*/
  })

  d3.select("#ia-1").on("click", () => {
    if(lastPos%MAX_1 !== 0){  //disable this interactive area when we are at the very beginning or at the very end of the spritesheet (i.e. we are on frame 0)
      //document.getElementById("ia-1").style.pointerEvents = 'auto'
      console.log(`iterations: ${Math.trunc(MAX_2/MIN_2)}`)
      let lastPosY = lastPos
      let endPosY = lastPosY - MIN_2*3
      let iterations = Math.abs(Math.trunc((endPosY-lastPosY)/MIN_2))
      console.log(`lastY: ${lastPosY}, endY: ${endPosY}`)
      function animate(i) {
        setTimeout(() => {
          lastPosY -= MIN_2
          console.log(`i: ${i}, pos: ${lastPosY}`)
          el.style.backgroundPositionY = `${lastPosY}px`
          lastPos = lastPosY
          if (i++ < iterations){
            animate(i)   //decrement i and call animate again if i > 0
          }else{
            console.warn(`i=${i} < ${(endPosY-lastPosY)/MIN_2}, stopping animation`)
          }
        }, iterations*50)
      }
      animate(0)
    }/*else{
      document.getElementById("ia-1").style.pointerEvents = 'none'
    }*/
  })

  zoom('ia-3', ia3)

  d3.select("#reset").on("click", () => {
    el.style.backgroundPositionX = '0px'
    el.style.backgroundPositionY = `0px`
    ia1.style.pointerEvents = 'unset'
    setTimeout(() => { el.style.animation = "" }, 1500)
  })
})