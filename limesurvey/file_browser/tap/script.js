$("#ls-button-submit").prop("disabled",true);

const anim = document.getElementById("anim");
const ia1 = document.getElementById("ia-1");
const ia2 = document.getElementById("ia-2");

const MIN_1 = 233.8;
const MAX_1 = MIN_1*(4);
const LAST_1 = MIN_1+MAX_1;

const MIN_2 = 233.8;
const MAX_2 = MIN_2*4;
let lastPos = 0;

const MID = 233.8*4;

//use this to understand whether the user tried at least once all the actions (click-forward, click-back, double-click-back)
const actionDone = [0,0];


const i1 = document.getElementById("i1");
const i2 = document.getElementById("i2");

const overlayElements = document.querySelectorAll('.loading-overlay');
document.getElementById("answer519483X1X3").style.display='none'
$("#answer519483X1X3").val(0)//.trigger('keyup');


console.log(`RxJS loaded and found by question`);
overlayElements.forEach(element => {
  element.style.display = 'none';
});
/*const source = window.rxjs.interval(1000);
//sample last emitted value from source every 2s
const example = window.rxjs.interval(2000);
//output: 2..4..6..8..
const subscribe = example.subscribe((val) => console.log(val));*/
const lastPosX$ = new window.rxjs.BehaviorSubject(0);
lastPosX$.subscribe(pos => console.log(`lastPosX$ emitted ` + pos));

const ia2Click$ = window.rxjs.fromEvent(ia2, 'click');
ia2Click$.pipe(
  window.rxjs.exhaustMap(() => window.rxjs.interval(100).pipe(
    window.rxjs.withLatestFrom(lastPosX$.pipe(
      window.rxjs.map((lpY => {
        console.log(lpY);
        return lpY;//%MAX_1
      }))
    )),
    window.rxjs.takeWhile(([i, lpY]) => {
      console.info(`ia-2 ${lpY === 0 ? 'enabled' : 'disabled'} because lpY=`+lpY);
      return lpY === 0;
    }),//disable this interactive area when we are at the very beginning or at the very end of the spritesheet (i.e. we are on frame 0)
    window.rxjs.take(5)
  ))
).subscribe(([i, lPosY]) => {
  let pos = lPosY+MIN_1*i;
  console.log(`animating IA-2:`+ i + ' ' + pos);
  anim.style.backgroundPositionX = `-`+pos+`px`;
  actionDone[0] = 1;
  if(i === 1){  //hide interactive area
    ia2.style.display = "none";
  }else if(i === 4){
    console.info(`updating lastPosY$ with `+(lPosY+MIN_1*i)/*%MAX_1*/);
    $('#i1').html("&#10004;");
    ia1.style.display = "block"; //display next interactive area
    $("#answer519483X1X3").val(actionDone.reduce((accumulator, currentValue) => accumulator + currentValue, 0)).trigger('keyup');
    lastPosX$.next((lPosY+MIN_1*i)/*%MAX_1*/);
  }
});

const ia1Click$ = window.rxjs.fromEvent(ia1, 'click')
ia1Click$.pipe(
  window.rxjs.exhaustMap(() => window.rxjs.interval(100).pipe(
    window.rxjs.withLatestFrom(lastPosX$.pipe(
      window.rxjs.map((lpY => {
        console.log(`${ lpY }`)
        return lpY/*%MAX_1*/
      }))
    )),
    window.rxjs.takeWhile(([i, lpY]) => {
      console.info(`ia-2 ${ lpY === 0 ? 'enabled' : 'disabled' } because lpY=${ lpY }`)
      return lpY !== 0
    }),//disable this interactive area when we are at the very beginning or at the very end of the spritesheet (i.e. we are on frame 0)
    window.rxjs.take(5)
  ))
).subscribe(([i, lPosY]) => {
  console.log(`animating IA-2: ${ i }, ${ lPosY-MIN_1*i }`)
  anim.style.backgroundPositionX = `-${ lPosY-MIN_1*i }px`
  actionDone[1] = 2;
  if(i === 1){  //hide interactive area
    ia1.style.display = "none"
  }else if(i === 4){
    console.info(`updating lastPosY$ with ${ (lPosY-MIN_1*i) }`)
     $('#i2').html("&#10004;");
    $("#answer519483X1X3").val(actionDone.reduce((accumulator, currentValue) => accumulator + currentValue, 0)).trigger('keyup');
    ia2.style.display = "block" //display next interactive area
    lastPosX$.next((lPosY-MIN_1*i)/*%MAX_1*/)
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