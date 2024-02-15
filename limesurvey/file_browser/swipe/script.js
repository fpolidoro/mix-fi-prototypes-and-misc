$("#ls-button-submit").prop("disabled",true);

const anim = document.getElementById("anim")
const ia1 = document.getElementById("ia-1")
const ia2 = document.getElementById("ia-2")

const MIN_1 = 233.8
const MAX_1 = MIN_1*(4)
const LAST_1 = MIN_1+MAX_1

const MIN_2 = 233.8
const MAX_2 = MIN_2*4
let lastPos = 0

const MID = 233.8*4

//use this to understand whether the user tried at least once all the actions (click-forward, click-back, double-click-back)
const actionDone = [0,0]
const overlayElements = document.querySelectorAll('.loading-overlay');
    
overlayElements.forEach(element => {
  element.style.display = 'none';
});

/*const source = window.rxjs.interval(1000);
//sample last emitted value from source every 2s
const example = window.rxjs.interval(2000);
//output: 2..4..6..8..
const subscribe = example.subscribe((val) => console.log(val));*/
const lastPosX$ = new window.rxjs.BehaviorSubject(0)
lastPosX$.subscribe(v => console.log(`lastPosY$ emitted ${ v }`))

$("#answer519483X3X8").hide()
$("#answer519483X3X8").val(0)

const ia2Click$ = window.rxjs.fromEvent(ia2, 'click')
ia2Click$.pipe(
  window.rxjs.exhaustMap(() => window.rxjs.interval(100).pipe(
    window.rxjs.withLatestFrom(lastPosX$.pipe(
      window.rxjs.map((lpY => {
        console.log(`${ lpY }`)
        return lpY/*%MAX_1*/
      }))
    )),
    window.rxjs.takeWhile(([i, lpY]) => {
      console.info(`ia-2 ${ lpY === 0 ? 'enabled' : 'disabled' } because lpY=${ lpY }`)
      return lpY === 0
    }),//disable this interactive area when we are at the very beginning or at the very end of the spritesheet (i.e. we are on frame 0)
    window.rxjs.take(5)
  ))
).subscribe(([i, lPosY]) => {
  console.log(`animating IA-2: ${ i }, ${ lPosY+MIN_1*i }`)
  anim.style.backgroundPositionX = `-${ lPosY+MIN_1*i }px`
  actionDone[0] = 1
  
  if(i === 1){  //hide interactive area
    ia2.style.display = "none"
  }else if(i === 4){
    console.info(`updating lastPosY$ with ${ (lPosY+MIN_1*i) }`)
    $("#i1").html("&#10004;");
    ia1.style.display = "block" //display next interactive area
    lastPosX$.next((lPosY+MIN_1*i)/*%MAX_1*/)
    $("#answer519483X3X8").val(actionDone.reduce((accumulator, currentValue) => accumulator + currentValue, 0)).trigger('keyup');
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
    return window.rxjs.fromEvent(anim, 'touchmove').pipe( //and switch to listen for touchmove events
      window.rxjs.tap((event) => event.preventDefault()),
      window.rxjs.takeUntil(window.rxjs.fromEvent(anim, 'touchend').pipe( //until a touchend is detected
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
    window.rxjs.map((touch) => ({ elapsed: elapsed, distance: touch.distance })),
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
        console.log(`${ lpY }`)
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
  console.log(`animating: ${ i }`)
  let pos = lPosY-MIN_1*i
  actionDone[1] = 2;

  anim.style.backgroundPositionX = `-${ pos }px`
  if(i === 1){  //hide interactive area
    ia1.style.display = "none"
  }else if(i === 4){
    $("#i2").html("&#10004;");
    console.info(`updating lastPosY$ with ${ pos }`)
    ia2.style.display = "block" //display next interactive area
    lastPosX$.next(pos)
    $("#answer519483X3X8").val(actionDone.reduce((accumulator, currentValue) => accumulator + currentValue, 0)).trigger('keyup');
  }
})

const g1 = document.getElementById("g1")
const guide1$ = window.rxjs.fromEvent(g1, 'click')
guide1$.pipe(
  window.rxjs.exhaustMap(() => window.rxjs.of($("#gi1")).pipe(
    window.rxjs.tap((gi1) => gi1.show()),
    window.rxjs.delay(5000),
    window.rxjs.tap((gi1) => gi1.hide())
  ))
).subscribe()

const g2 = document.getElementById("g2")
const guide2$ = window.rxjs.fromEvent(g2, 'click')
guide2$.pipe(
  window.rxjs.exhaustMap(() => window.rxjs.of($("#gi2")).pipe(
    window.rxjs.tap((gi2) => gi2.show()),
    window.rxjs.delay(5000),
    window.rxjs.tap((gi2) => gi2.hide())
  ))
).subscribe()