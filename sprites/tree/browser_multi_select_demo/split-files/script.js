const bPlay = document.getElementById('play');
const bStop = document.getElementById('stop');
const anim = document.getElementById('anim');

//observe clicks on play button
window.rxjs.fromEvent(bPlay, 'click').pipe(
    window.rxjs.tap(() => console.log('play')),
    window.rxjs.tap(() => { //play has been clicked...
        bPlay.classList.add('hide') //...hide play button
        anim.classList.add('animate')   //...add class to start animation
        bStop.classList.remove('hide')  //... and display stop button
    }),
    window.rxjs.exhaustMap(() => window.rxjs.race(  //now ignore events until animation is finished or stop button is clicked
            window.rxjs.fromEvent(bStop, 'click').pipe(window.rxjs.tap(() => console.log('stop'))),
            window.rxjs.interval(2500).pipe(window.rxjs.tap(() => console.log('2.5s elapsed')))
        ).pipe(window.rxjs.take(1)) //take only the first event emitted by the race winner
    ),
).subscribe(() => { //the animation must be terminated either because stop button has been clicked or because 2.5s elapsed
    bPlay.classList.remove('hide')  //display play button
    anim.classList.remove('animate')    //remove animation class
    bStop.classList.add('hide') //hide stop button
});