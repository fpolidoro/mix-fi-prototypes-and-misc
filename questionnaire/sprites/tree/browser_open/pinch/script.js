var modules = [
  `https://cdnjs.cloudflare.com/ajax/libs/d3/7.6.1/d3.min.js`,
  `https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js`
  // `../../../../libs/d3.v6.js`,
  // `../../../../libs/jquery-3.6.0-min.js`,
  //`https://npmcdn.com/@reactivex/rxjs@5.0.0-beta.6/dist/global/Rx.umd.js`
]

const el = document.getElementById("anim")
const ia1 = document.getElementById("ia-1")
const ia2 = document.getElementById("ia-2")
const ia3 = document.getElementById("ia-3")

const MIN_1 = 233.8
const MAX_1 = MIN_1*(4)
const LAST_1 = MIN_1+MAX_1

const MIN_2 = 233.8
const MAX_2 = MIN_2*4
let lastPos = 0

const MID = 233.8*4

Promise.all(
  modules.map((module, _) =>
    import(module)
  )
).then(() => {
  const i1 = document.getElementById("i1")
  const i2 = document.getElementById("i2")
  const i3 = document.getElementById("i3")

  d3.select("#reset").on("click", () => {
    el.style.backgroundPositionX = '0px'
    el.style.backgroundPositionY = `0px`
    ia1.style.pointerEvents = 'unset'
    setTimeout(() => { el.style.animation = "" }, 1500)
  })

  let script = document.createElement('script')
  script.setAttribute('src', 'https://unpkg.com/rxjs@7.5.5/dist/bundles/rxjs.umd.js')
  script.setAttribute('id', "rxscript")
  document.body.appendChild(script) 
  const overlayElements = document.querySelectorAll('.loading-overlay');

  // now wait for it to load...
  script.onload = () => {
    // script has loaded, you can now use it safely
    console.warn('thank me later')
    // ... do something with the newly loaded script
    overlayElements.forEach(element => {  //hide the overlay
      element.style.display = 'none';
    });
    
    /*const source = window.rxjs.interval(1000);
    //sample last emitted value from source every 2s
    const example = window.rxjs.interval(2000);
    //output: 2..4..6..8..
    const subscribe = example.subscribe((val) => console.log(val));*/
    const lastPosX$ = new window.rxjs.BehaviorSubject(0)
    lastPosX$.subscribe(v => console.log(`lastPosY$ emitted ${v}`))

    const ia2Click$ = window.rxjs.fromEvent(ia2, 'click')
    ia2Click$.pipe(
      window.rxjs.exhaustMap(() => window.rxjs.interval(100).pipe(
        window.rxjs.withLatestFrom(lastPosX$.pipe(
          window.rxjs.map((lpY => {
            console.log(`${lpY}`)
            return lpY/*%MAX_1*/
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
      el.style.backgroundPositionX = `-${lPosY+MIN_1*i}px`
      if(i === 1){  //hide interactive area
        ia2.style.display = "none"
      }else if(i === 4){
        console.info(`updating lastPosY$ with ${(lPosY+MIN_1*i)/*%MAX_1*/}`)
        i1.classList.remove("fa-minus")
        i1.classList.add("fa-check")
        ia1.style.display = "block" //display next interactive area
        lastPosX$.next((lPosY+MIN_1*i)/*%MAX_1*/)
      }
    })

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
        window.rxjs.withLatestFrom(lastPosX$.pipe(
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
      if(clicks === 1){
        let pos = lPosY+MIN_1*i
        console.warn(`Double click`)
        el.style.backgroundPositionX = `-${pos}px`
        if(i === 4){
          i2.classList.remove("fa-minus")
          i2.classList.add("fa-check")
          console.info(`updating lastPosY$ with ${pos}`)
          lastPosX$.next(pos)
        }
      }
    });

    let animatePinch$ = new window.rxjs.Subject()
    let semaphoreEnd$ = new window.rxjs.Subject()
    window.rxjs.zip(
      window.rxjs.fromEvent(el, 'touchstart').pipe( //listen for first touch down
        window.rxjs.take(1),
        window.rxjs.tap(() => console.log(`touchStart #1`))
      ),
      window.rxjs.fromEvent(el, 'touchstart').pipe( //listen for second touch: fire only if touches are more than 1
        window.rxjs.filter(ev => ev.touches.length > 1),
        window.rxjs.tap(() => console.log(`touchStart #2`)),
        window.rxjs.take(1)
      )
    ).pipe(
      window.rxjs.mergeMap(([start1, start2]) => {
        console.log(start1)
        console.log(start2)
        let startDist = Math.hypot(start1.changedTouches[0].clientX - start2.changedTouches[0].clientX, start1.changedTouches[0].clientY-start2.changedTouches[0].clientY)
        console.log(`distance between s1,s2 = ${startDist}`)

        console.log(`touchDown`)
        return window.rxjs.fromEvent(el, 'touchmove').pipe(
          //window.rxjs.tap(mm => console.log(mm)),
          window.rxjs.filter(mm => mm.touches.length > 1),
          window.rxjs.map(mm => {
            console.log(mm.touches.length)
            let currentDist = Math.hypot(mm.touches[0].clientX-mm.touches[1].clientX, mm.touches[0].clientY-mm.touches[1].clientY)

            return {
              distance: {
                current: currentDist,
                start: startDist,
              },
              touches: mm.touches,
            }
          }),
          window.rxjs.tap(mm => {
            if(mm.distance.current < mm.distance.start){
              console.warn(`Pinch IN`)
              let mid = {
                x: (mm.touches[0].clientX+mm.touches[1].clientX)/2,
                y: (mm.touches[0].clientY+mm.touches[1].clientY)/2
              }
        
              var rect = ia1.getBoundingClientRect();
              var r = Math.abs(rect.top-rect.bottom)/2
              var cx = rect.left + Math.abs(rect.left-rect.right)/2
              var cy = rect.top + r
              //console.log(`rect: t=${rect.top}, l=${rect.left}, b=${rect.bottom}, r=${rect.right}`)
              //console.log(`cx: ${cx}, cy: ${cy}, r: ${r}`)
        
              var dist = (mid.x - cx) * (mid.x - cx) + (mid.y - cy) * (mid.y - cy)
              if(dist < r*r){
                console.warn(`end is within circle`)
              }else{
                console.log(`end is outside circle`)
              }
              
            }else{
              console.info(`Pinch OUT`)
            }

            animatePinch$.next({
              pinch: mm.distance.current < mm.distance.start ? 'in' : 'out',
              target: dist < r*r
            })
          }),
          window.rxjs.takeUntil(window.rxjs.fromEvent(el, 'touchend').pipe(
            window.rxjs.filter(end => end.touches.length < 2),  //stop when there are less than two fingers touching the screen
            window.rxjs.tap(() => console.info(`touchEnd`)),
            window.rxjs.tap(() => semaphoreEnd$.next())
          )),
        )
      }),
      window.rxjs.repeat()  //restart from zip after processing this multi-touch
    ).subscribe()
  
    semaphoreEnd$.pipe(
      window.rxjs.withLatestFrom(animatePinch$),
      window.rxjs.filter(([_, mm]) => mm.pinch === 'in' && mm.target),
      window.rxjs.exhaustMap((clicks) => window.rxjs.interval(100).pipe(
        window.rxjs.map((i) => [clicks, i]),
        window.rxjs.withLatestFrom(lastPosX$.pipe(
          window.rxjs.map((lpY => {
            console.log(`${lpY}`)
            return lpY//%MAX_1
          }))
        )),
        window.rxjs.takeWhile(([[clicks, i], lpY]) => {
          return lpY !== 0
        }),//disable this interactive area when we are at the very beginning or at the very end of the spritesheet (i.e. we are on frame 0)
        window.rxjs.take(5)
      )),
      window.rxjs.repeat()
    ).subscribe(([[_, i], lPosY]) => {
      let pos = lPosY-MIN_1*i

      el.style.backgroundPositionX = `-${pos}px`
      if(i === 1){  //hide interactive area
        ia1.style.display = "none"
      }else if(i === 4){
        i2.classList.remove("fa-minus")
        i2.classList.add("fa-check")
        console.info(`updating lastPosY$ with ${pos}`)
        ia2.style.display = "block" //display next interactive area
        lastPosX$.next(pos)
      }
    })
  }
})