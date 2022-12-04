var el = document.getElementById('anim');
function play() {
  el.style.animationPlayState = 'running';
}
function pause() {
  el.style.animationPlayState = 'paused';
}
function reset() {
  el.style.animation = 'none';
  el.offsetHeight; /* trigger reflow to apply the change immediately */
  el.style.animation = null;
}
function stop() {
  reset();
  pause();
}