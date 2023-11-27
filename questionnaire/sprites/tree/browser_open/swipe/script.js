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
    const lastPosX$ = new window.rxjs.BehaviorSubject(0)
    lastPosX$.subscribe(v => console.log(`lastPosY$ emitted ${v}`))

    const ia2Click$ = window.rxjs.fromEvent(ia2, 'click')
    ia2Click$.pipe(
      window.rxjs.exhaustMap(() => window.rxjs.interval(100).pipe(
        window.rxjs.withLatestFrom(lastPosX$.pipe(
          window.rxjs.map((lpY => {
            console.log(`${lpY}`)
            return lpY//%MAX_1
          }))
        )),
        window.rxjs.takeWhile(([i, lpY]) => {
          console.info(`ia-2 ${lpY === 0 ? 'enabled' : 'disabled'} because lpY=${lpY}`)
          return lpY === 0
        }),//disable this interactive area when we are at the very beginning or at the very end of the spritesheet (i.e. we are on frame 0)
        window.rxjs.take(5)
      ))
    ).subscribe(([i, lPosY]) => {
      let pos = lPosY+MIN_1*i
      console.log(`animating IA-2: ${i}, ${pos}`)
      el.style.backgroundPositionX = `-${pos}px`
      if(i === 4){
        console.info(`updating lastPosY$ with ${pos}`)
        i1.classList.remove("fa-minus")
        i1.classList.add("fa-check")
        lastPosX$.next(pos)
      }
    })

    /** Observes the elapsed time between a `touchstart` and `touchend` events */
    let elapsed$ = new window.rxjs.ReplaySubject(1)
    let touch$ = new window.rxjs.ReplaySubject(1)
    //listen for fling event
    window.rxjs.fromEvent(ia1, 'touchstart').pipe(
      window.rxjs.tap(() => {
        //console.log(`Fling start`)
        elapsed$.next(null) //at touchstart reset the elapsed time
        touch$.next(null) //reset also the touch observable
      }),
      window.rxjs.exhaustMap((start) => {
        let startDate = new Date()  //take the current time
        //console.log(`Fling exhaust`)
        return window.rxjs.fromEvent(el, 'touchmove').pipe( //and switch to listen for touchmove events
          window.rxjs.takeUntil(window.rxjs.fromEvent(el, 'touchend').pipe( //until a touchend is detected
            //window.rxjs.tap(() => console.log(`Fling end`)),
            window.rxjs.tap((end) => {
              let elapsed = new Date().getTime() - startDate.getTime()
              let touch = {
                duration: elapsed,
                start: {
                  x: start.touches[0].clientX,
                  y: start.touches[0].clientY
                },
                end: {
                  x: end.changedTouches[0].clientX,
                  y: end.changedTouches[0].clientY
                },
                distance: Math.hypot(start.touches[0].clientX - end.changedTouches[0].clientX, start.touches[0].clientY-end.changedTouches[0].clientY)
              }
              elapsed$.next(elapsed)
              touch$.next(touch)
            }), //when touchend emits, take the current time again and push it to elapsed$ observable
          ))
        )
      })
    ).subscribe()

    let fling$ = elapsed$.pipe(
      window.rxjs.filter((elapsed) => { //check whether the gesture is a fling or a drag: a fling is a very quick gesture (less than 150ms)
        return elapsed !== null && elapsed < 150
      }),
      window.rxjs.exhaustMap((elapsed) => touch$.pipe(
        window.rxjs.filter((touch) => touch !== null),
        window.rxjs.take(1),
        window.rxjs.map((touch) => ({elapsed: elapsed, distance: touch.distance})),
        window.rxjs.tap((vals)=> console.log(vals)),
        window.rxjs.filter((vals) => vals.distance > 10),
        window.rxjs.tap(() => console.warn(`Fling`))
      )),
    )

    fling$.pipe(
      window.rxjs.exhaustMap((fling) => window.rxjs.interval(100).pipe(
        window.rxjs.map((i) => [fling, i]),
        window.rxjs.withLatestFrom(lastPosX$.pipe(
          window.rxjs.map((lpY => {
            console.log(`${lpY}`)
            return lpY//%MAX_1
          }))
        )),
        window.rxjs.takeWhile(([[clicks, i], lpY]) => {
          //console.info(`ia-1 ${lpY !== 0 ? 'enabled' : 'disabled'} because lpY=${lpY}`)
          return lpY !== 0
        }),//disable this interactive area when we are at the very beginning or at the very end of the spritesheet (i.e. we are on frame 0)
        window.rxjs.take(5)
      ))
    ).subscribe(([[fling, i], lPosY]) => {
      console.log(`animating: ${i}`)
      let pos = lPosY-MIN_1*i

      el.style.backgroundPositionX = `-${pos}px`
      if(i === 4){
        i2.classList.remove("fa-minus")
        i2.classList.add("fa-check")
        console.info(`updating lastPosY$ with ${pos}`)
        lastPosX$.next(pos)
      }
    })
  }
})