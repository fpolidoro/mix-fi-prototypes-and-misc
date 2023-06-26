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
const MIN_1 = 165.2
const MAX_1 = MIN_1*(5)
const LAST_1 = MIN_1+MAX_1

const MIN_2 = 165.2
const MAX_2 = MIN_2*3
let lastPos = 0

const MID = 165.2*4

Promise.all(
  modules.map((module, _) =>
    import(module)
  )
).then(() => {

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
    const lastPosY$ = new window.rxjs.BehaviorSubject(0)
    lastPosY$.subscribe(v => console.log(`lastPosY$ emitted ${v}`))

    let animatePinch$ = new window.rxjs.Subject()
    let semaphoreEnd$ = new window.rxjs.Subject()
    let semaphoreTimer$ = new window.rxjs.Subject()
    window.rxjs.zip(
      window.rxjs.fromEvent(el, 'touchstart').pipe( //listen for first touch down
        window.rxjs.take(1),
        window.rxjs.tap(() => console.log(`touchStart #1`)),
        window.rxjs.tap(() => semaphoreTimer$.next(true))
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
              start_touches: start1.touches.length > start2.touches.length ? start1.touches : start2.touches,
              touches: mm.touches,
            }
          }),
          window.rxjs.tap(mm => {
            console.log(mm)
            let angle = Math.atan2((mm.start_touches[0].clientY - mm.start_touches[1].clientY),
            (mm.start_touches[0].clientX - mm.start_touches[1].clientX))*180/Math.PI
            //console.log(`${angle}°`)

            if(mm.distance.current < mm.distance.start){
              console.warn(`Pinch IN`)
            }else{
              console.info(`Pinch OUT`)
            }

            let mid = {
              x: (mm.touches[0].clientX+mm.touches[1].clientX)/2,
              y: (mm.touches[0].clientY+mm.touches[1].clientY)/2
            }
      
            var rect = ia1.getBoundingClientRect();

            let direction = (angle >= -30 && angle <= 30) || (angle >= -210 && angle <= -150) || (angle >= 150 && angle <= 210) ? 'hor' : 'ver'
            let withinRect = mid.x > rect.left && mid.x < rect.right && mid.y > rect.top && mid.y < rect.bottom
            animatePinch$.next({
              pinch: mm.distance.current < mm.distance.start ? 'in' : 'out',
              direction: direction,
              target: withinRect
            })

            console.log(`${angle}°: ${direction}`)
            console.log(`${withinRect ? 'within' : 'outside'} target`)
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
      window.rxjs.filter(([_, mm]) => mm.direction === 'hor' && mm.target),
      window.rxjs.exhaustMap((clicks) => window.rxjs.interval(100).pipe(
        window.rxjs.map((i) => [clicks[1], i]),
        window.rxjs.withLatestFrom(lastPosY$.pipe(
          window.rxjs.map((lpY => {
            //console.log(`${lpY}`)
            return lpY%MAX_1
          }))
        )),
        window.rxjs.takeWhile(([[pinch, i], lpY]) => {
          return (lpY === 0 && pinch.pinch === 'in') || (lpY === MAX_1-MIN_1 && pinch.pinch === 'out')
        }),//disable this interactive area when we are at the very beginning or at the very end of the spritesheet (i.e. we are on frame 0)
        window.rxjs.take(5)
      )),
      window.rxjs.repeat()
    ).subscribe(([[pinch, i], lPosY]) => {
      let pos
      console.log(`lPosY: ${lPosY}`)
      if(pinch.pinch === 'in'){
        //if(lPosY === 0){
          pos = lPosY+MIN_1*i
        //}
        console.log(`pinch in`)
      }else{
        console.log(`pinch out`)
        //if(lPosY === MAX_1-MIN_1){
          pos = lPosY-MIN_1*i
        //}
      }
      
      el.style.backgroundPositionY = `-${pos}px`
      if(i === 4 && pos !== undefined){
        console.info(`updating lastPosY$ with ${pos}`)
        lastPosY$.next(pos)
      }
    })

    /** Observe the user's gestures: after the first touch, start a race between the pinch completion and a timer.
     * The winner determines whether any help should be provided to the user
     */
    semaphoreTimer$.pipe(
      window.rxjs.tap(() => console.log(`Starting race`)),
      window.rxjs.switchMap(() => window.rxjs.race(
        window.rxjs.timer(90000).pipe(
          window.rxjs.map(() => false)
        ),
        semaphoreEnd$.pipe(
          window.rxjs.map(() => true)
        )
      )),
      window.rxjs.tap((result) => {
        if(result){
          console.log(`gesture performed`)
        }else{
          console.error(`HAVING ISSUES?`)
        }
      })
    ).subscribe()
  }
})