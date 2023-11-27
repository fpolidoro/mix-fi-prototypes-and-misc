var modules = [
  `https://cdnjs.cloudflare.com/ajax/libs/d3/7.6.1/d3.min.js`,
  `https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js`
  // `../../../../libs/d3.v6.js`,
  // `../../../../libs/jquery-3.6.0-min.js`,
  //`https://npmcdn.com/@reactivex/rxjs@5.0.0-beta.6/dist/global/Rx.umd.js`
]

const anim = document.getElementById("anim")
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
      anim.style.backgroundPositionX = `-${lPosY+MIN_1*i}px`
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

    const ia1Click$ = window.rxjs.fromEvent(ia1, 'click')
    ia1Click$.pipe(
      window.rxjs.exhaustMap(() => window.rxjs.interval(100).pipe(
        window.rxjs.withLatestFrom(lastPosX$.pipe(
          window.rxjs.map((lpY => {
            console.log(`${lpY}`)
            return lpY/*%MAX_1*/
          }))
        )),
        window.rxjs.takeWhile(([i, lpY]) => {
          console.info(`ia-2 ${lpY === 0 ? 'enabled' : 'disabled'} because lpY=${lpY}`)
          return lpY !== 0
        }),//disable this interactive area when we are at the very beginning or at the very end of the spritesheet (i.e. we are on frame 0)
        window.rxjs.take(5)
      ))
    ).subscribe(([i, lPosY]) => {
      console.log(`animating IA-2: ${i}, ${lPosY-MIN_1*i}`)
      anim.style.backgroundPositionX = `-${lPosY-MIN_1*i}px`
      if(i === 1){  //hide interactive area
        ia1.style.display = "none"
      }else if(i === 4){
        console.info(`updating lastPosY$ with ${(lPosY-MIN_1*i)/*%MAX_1*/}`)
        i2.classList.remove("fa-minus")
        i2.classList.add("fa-check")
        ia2.style.display = "block" //display next interactive area
        lastPosX$.next((lPosY-MIN_1*i)/*%MAX_1*/)
      }
    })
  }
})