var modules = [
  //`https://cdnjs.cloudflare.com/ajax/libs/d3/7.6.1/d3.min.js`,
  //`https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js`
  `../../../../libs/d3.v6.js`,
  `../../../../libs/jquery-3.6.0-min.js`,
  //`https://npmcdn.com/@reactivex/rxjs@5.0.0-beta.6/dist/global/Rx.umd.js`
]

const el = document.getElementById("anim")
const ia1 = document.getElementById("ia-1")
const ia2 = document.getElementById("ia-2")
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

  //zoom('ia-3', ia3)

  /*d3.select('#ia-3').on("click", () => {
    //if(lastPos%MAX_1 !== 0){  //disable this interactive area when we are at the very beginning or at the very end of the spritesheet (i.e. we are on frame 0)
      //document.getElementById("ia-1").style.pointerEvents = 'auto'
      let lastPosY = lastPos
      let endPosY = 0
      let iterations = Math.abs(Math.trunc((endPosY-lastPosY)/MIN_2))
      console.log(`iterations: ${Math.abs(Math.trunc((endPosY-lastPosY)/MIN_2))}`)
      console.log(`lastY: ${lastPosY}, endY: ${endPosY}`)
      function animate(i) {
        setTimeout(() => {
          lastPosY += MIN_2
          console.log(`i: ${i}, pos: ${lastPosY}`)
          el.style.backgroundPositionY = `${lastPosY}px`
          lastPos = lastPosY
          if (i-- > 0){
            animate(i)   //decrement i and call animate again if i > 0
          }else{
            console.warn(`i=${i} < ${iterations}, stopping animation`)
          }
        }, iterations*50)
      }
      animate(iterations-1)
    //}
  })*/

  d3.select("#reset").on("click", () => {
    el.style.backgroundPositionX = '0px'
    el.style.backgroundPositionY = `0px`
    ia1.style.pointerEvents = 'unset'
    setTimeout(() => { el.style.animation = "" }, 1500)
  })
})

let script = document.createElement('script')
script.setAttribute('src', 'https://unpkg.com/rxjs@7.5.5/dist/bundles/rxjs.umd.js')
script.setAttribute('id', "rxscript")
document.body.appendChild(script) 

// now wait for it to load...
script.onload = () => {
  // script has loaded, you can now use it safely
  console.warn('thank me later')
  // ... do something with the newly loaded script
  
  /*const source = window.rxjs.interval(1000);
  //sample last emitted value from source every 2s
  const example = window.rxjs.interval(2000);
  //output: 2..4..6..8..
  const subscribe = example.subscribe((val) => console.log(val));*/
  const lastPosY$ = new window.rxjs.BehaviorSubject(0)
  lastPosY$.subscribe(v => console.log(`lastPosY$ emitted ${v}`))

  /*const ia1Click$ = window.rxjs.fromEvent(ia1, 'click');
  ia1Click$.pipe(
    window.rxjs.exhaustMap(() => window.rxjs.interval(100).pipe(
      window.rxjs.withLatestFrom(lastPosY$.pipe(
        window.rxjs.map((lpY => {
          //console.log(`${lpY}`)
          return lpY%MAX_1
        }))
      )),
      window.rxjs.takeWhile(([i, lpY]) => {
        //console.info(`ia-1 ${lpY !== 0 ? 'enabled' : 'disabled'} because lpY=${lpY}`)
        return lpY !== 0
      }),//disable this interactive area when we are at the very beginning or at the very end of the spritesheet (i.e. we are on frame 0)
      window.rxjs.take(5)
    ))
  ).subscribe(([i, lPosY]) => {
    //console.log(`animating IA-1: ${i}, ${lPosY+MIN_1*i}`)
    el.style.backgroundPositionY = `-${lPosY+MIN_1*i}px`
    if(i === 4){
      console.info(`updating lastPosY$ with ${(lPosY+MIN_1*i)%MAX_1}`)
      lastPosY$.next((lPosY+MIN_1*i)%MAX_1)
    }
  })*/

  const ia2Click$ = window.rxjs.fromEvent(ia2, 'click')
  ia2Click$.pipe(
    window.rxjs.exhaustMap(() => window.rxjs.interval(100).pipe(
      window.rxjs.withLatestFrom(lastPosY$.pipe(
        window.rxjs.map((lpY => {
          console.log(`${lpY}`)
          return lpY%MAX_1
        }))
      )),
      window.rxjs.takeWhile(([i, lpY]) => {
        console.info(`ia-2 ${lpY === 0 ? 'enabled' : 'disabled'} because lpY=${lpY}`)
        return lpY === 0
      }),//disable this interactive area when we are at the very beginning or at the very end of the spritesheet (i.e. we are on frame 0)
      window.rxjs.take(5)
    ))
  ).subscribe(([i, lPosY]) => {
    console.log(`animating IA-2: ${i}, ${lPosY+MIN_1*i}`)
    el.style.backgroundPositionY = `-${lPosY+MIN_1*i}px`
    if(i === 4){
      console.info(`updating lastPosY$ with ${(lPosY+MIN_1*i)%MAX_1}`)
      lastPosY$.next((lPosY+MIN_1*i)%MAX_1)
    }
  })

  

  /*const ia1Zoom$ = window.rxjs.fromEvent(ia1, 'dblclick')
  ia1Zoom$.pipe(
    window.rxjs.exhaustMap(() => window.rxjs.interval(100).pipe(
      window.rxjs.withLatestFrom(lastPosY$.pipe(
        window.rxjs.map((lpY => {
          console.log(`${lpY}`)
          return lpY%MAX_1
        }))
      )),
      window.rxjs.takeWhile(([i, lpY]) => {
        console.info(`ia-3 ${Math.abs(lpY) === MID ? 'enabled' : 'disabled'} because lpY=${lpY}`)
        return Math.abs(lpY) === MID
      }),//disable this interactive area when we are at the very beginning or at the very end of the spritesheet (i.e. we are on frame 0)
      window.rxjs.take(5)
    ))
  ).subscribe(([i, lPosY]) => {
    console.log(`animating IA-3: ${i}, ${lPosY-MIN_1*i}`)
    el.style.backgroundPositionY = `-${lPosY-MIN_1*i}px`
    if(i === 4){
      console.info(`updating lastPosY$ with ${(lPosY-MIN_1*i)%MAX_1}`)
      lastPosY$.next((lPosY-MIN_1*i)%MAX_1)
    }
  })*/

  // How fast does the user has to click
  // so that it counts as double click
  const doubleClickDuration = 200;

  // Create a stream out of the mouse click event.
  const leftClick$ = window.rxjs.fromEvent(ia1, 'click')
  // We are only interested in left clicks, so we filter the result down
  .pipe(window.rxjs.filter((event) => event.button === 0));

// We have two things to consider in order to detect single or
// or double clicks.

  // 1. We debounce the event. The event will only be forwared 
  // once enough time has passed to be sure we only have a single click
  const debounce$ = leftClick$.pipe(window.rxjs.debounceTime(doubleClickDuration));

  // 2. We also want to abort once two clicks have come in.
  const clickLimit$ = leftClick$.pipe(
    window.rxjs.bufferCount(2),
  );


  // Now we combine those two. The gate will emit once we have 
  // either waited enough to be sure its a single click or
  // two clicks have passed throug
  const bufferGate$ = window.rxjs.race(debounce$, clickLimit$).pipe(
    // We are only interested in the first event. After that
    // we want to restart.
    window.rxjs.first(),
    window.rxjs.repeat(),
  );

  // Now we can buffer the original click stream until our
  // buffer gate triggers.
  leftClick$.pipe(
    window.rxjs.buffer(bufferGate$),
    // Here we map the buffered events into the length of the buffer
    // If the user clicked once, the buffer is 1. If he clicked twice it is 2
    window.rxjs.map(clicks => clicks.length),
    window.rxjs.tap((clicks) => console.log(`clicks: ${clicks}`)),
    window.rxjs.exhaustMap((clicks) => window.rxjs.interval(100).pipe(
      window.rxjs.map((i) => [clicks, i]),
      window.rxjs.withLatestFrom(lastPosY$.pipe(
        window.rxjs.map((lpY => {
          //console.log(`${lpY}`)
          return lpY%MAX_1
        }))
      )),
      window.rxjs.takeWhile(([[clicks, i], lpY]) => {
        //console.info(`ia-1 ${lpY !== 0 ? 'enabled' : 'disabled'} because lpY=${lpY}`)
        return lpY !== 0
      }),//disable this interactive area when we are at the very beginning or at the very end of the spritesheet (i.e. we are on frame 0)
      window.rxjs.take(5)
    ))
  ).subscribe(([[clicks, i], lPosY]) => {
    let pos

    if(clicks > 1){
      if(Math.abs(lPosY) === MID){
        pos = lPosY-MIN_1*i
        console.warn(`Double click`)
      }
    }else{
      pos = lPosY+MIN_1*i
      console.log(`Single click`)
    }

    if(clicks === 1 || (clicks > 1 && Math.abs(lPosY) === MID)){
      el.style.backgroundPositionY = `-${pos}px`
      if(i === 4){
        console.info(`updating lastPosY$ with ${pos}`)
        lastPosY$.next(pos)
      }
    }
  });
}