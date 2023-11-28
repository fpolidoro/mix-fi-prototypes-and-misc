var modules = [
  `https://cdnjs.cloudflare.com/ajax/libs/d3/7.6.1/d3.min.js`,
  //`https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js`,
  `https://cdn.bootcss.com/jquery/3.6.0/jquery.min.js`
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

//use this to understand whether the user tried at least once all the actions (click-forward, click-back, double-click-back)
const actionDone = [0,0,0]

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
  
  // $('#qs-question-box-sunburst-dbl-back-daemon').hide()
  // $('#qs-question-box-sunburst-dbl-back-daemon-help').hide()
  // document.querySelector('#qs-question-box-sunburst-dbl-back-daemon input-ui').setAttribute('input-value', 0);
  // document.querySelector('#qs-question-box-sunburst-dbl-back-daemon-help input-ui').setAttribute('input-value', 0);
  
  const overlayElements = document.querySelectorAll('.loading-overlay');

  // now wait for it to load...
  script.onload = () => {
    overlayElements.forEach(element => {  //hide the overlay
      element.style.display = 'none';
    });

    // script has loaded, you can now use it safely
    const lastPosY$ = new window.rxjs.BehaviorSubject(0)
    lastPosY$.subscribe(v => console.log(`lastPosY$ emitted ${v}`))
  
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
      if(i === 1){  //hide interactive area
        ia2.style.display = "none"
      }else if(i === 4){
        console.info(`updating lastPosY$ with ${(lPosY+MIN_1*i)%MAX_1}`)
        lastPosY$.next((lPosY+MIN_1*i)%MAX_1)
        i1.classList.remove("fa-minus")
        i1.classList.add("fa-check")
        ia1.style.display = "block" //display next interactive area
        // actionDone[0] = 1
        // document.querySelector('#qs-question-box-sunburst-dbl-back-daemon input-ui').setAttribute('input-value', actionDone.reduce(
        //     (accumulator, currentValue) => accumulator + currentValue, 0));
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
          if(i === 1){  //hide interactive area
            ia1.style.display = "none"
          }else if(i === 4){
            //actionDone[2] = 4
            i2.classList.remove("fa-minus")
            i2.classList.add("fa-check")
            ia2.style.display = "block"
          } 
        }
      }else{
        pos = lPosY+MIN_1*i
        console.log(`Single click`)
        if(i === 4){
          //actionDone[1] = 2
          i3.classList.remove("fa-minus")
          i3.classList.add("fa-check")

          if(pos === MAX_1){  //display/hide the interactive areas: we have just reached the root
            ia1.style.display = "none"
            ia2.style.display = "block"
          }
        }
      }
  
      if(clicks === 1 || (clicks > 1 && Math.abs(lPosY) === MID)){
        el.style.backgroundPositionY = `-${pos}px`
        if(i === 4){
          console.info(`updating lastPosY$ with ${pos}`)
          lastPosY$.next(pos)
          // document.querySelector('#qs-question-box-sunburst-dbl-back-daemon input-ui').setAttribute('input-value', actionDone.reduce(
          //   (accumulator, currentValue) => accumulator + currentValue, 0));
        }
      }
    });
  }
})