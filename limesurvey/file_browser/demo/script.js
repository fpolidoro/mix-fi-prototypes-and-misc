$('.sortable-rank').css('min-height', `${ 176*3 }px`);  //to fix the bug that prevents drop on mobile version

//observe tree mutations on .sortable-rank list. Whenever a mutation happens,
//trigger an event on mutations$
const mutations$ = new window.rxjs.ReplaySubject()
const observer = new MutationObserver((mutationList) => {
    for (const mutation of mutationList) {
        if (mutation.type === "childList") {
          mutations$.next()
        }
    }
})
const targetNode = document.getElementById("sortable-rank-14");

//observe the mutations debounced by 100ms. For each event, check the number of
//children of .sortable-rank and if it's 0, disable the next button
mutations$.pipe(
    window.rxjs.debounceTime(100)    
).subscribe(() => {
    $("#ls-button-submit").prop("disabled", $('#sortable-rank-14').children().length === 0);
    //console.log(`Next ${ $('#sortable-rank-14').children().length === 0 ? 'disabled' : 'enabled' }`)
    //console.log(`rank has ${ $('#sortable-rank-14').children().length } children`)
})
observer.observe(targetNode, { childList: true, subtree: true })