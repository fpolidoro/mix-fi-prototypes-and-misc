var modules = [
  //`https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js`
]

const anim = document.getElementById("anim")
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
  const i1 = document.getElementById("i1")
  const i2 = document.getElementById("i2")
  const i3 = document.getElementById("i3")

  let script = document.createElement('script')
  script.setAttribute('src', 'https://unpkg.com/rxjs@7.5.5/dist/bundles/rxjs.umd.js')
  script.setAttribute('id', "rxscript")
  document.body.appendChild(script) 

  // now wait for it to load...
  script.onload = () => {
    // script has loaded, you can now use it safely
    console.warn('RxJS loaded')
    
    const lastPosY$ = new window.rxjs.BehaviorSubject(0)
    lastPosY$.subscribe(v => console.log(`lastPosY$ emitted ${v}`))

    let animatePinch$ = new window.rxjs.Subject()
    let semaphoreEnd$ = new window.rxjs.Subject()
    window.rxjs.zip(
      window.rxjs.fromEvent(anim, 'touchstart').pipe( //listen for first touch down
        window.rxjs.take(1),
        window.rxjs.tap(() => console.log(`touchStart #1`))
      ),
      window.rxjs.fromEvent(anim, 'touchstart').pipe( //listen for second touch: fire only if touches are more than 1
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
        return window.rxjs.fromEvent(anim, 'touchmove').pipe(
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
              /*if(dist < r*r){
                console.warn(`end is within circle`)
              }else{
                console.log(`end is outside circle`)
              }*/
              
            }else{
              console.info(`Pinch OUT`)
            }

            animatePinch$.next({
              pinch: mm.distance.current < mm.distance.start ? 'in' : 'out',
              target: dist < r*r
            })
          }),
          window.rxjs.takeUntil(window.rxjs.fromEvent(anim, 'touchend').pipe(
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
        window.rxjs.withLatestFrom(lastPosY$.pipe(
          window.rxjs.map((lpY => {
            //console.log(`${lpY}`)
            return lpY%MAX_1
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

      anim.style.backgroundPositionY = `-${pos}px`
      if(i === 1){  //hide interactive area
        ia1.style.display = "none"
      }else if(i === 4){
        i3.classList.remove("fa-minus")
        i3.classList.add("fa-check")
        console.info(`updating lastPosY$ with ${pos}`)
        ia2.style.display = "block"
        lastPosY$.next(pos)
      }
    })
  }
})