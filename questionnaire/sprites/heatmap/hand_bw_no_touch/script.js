const el = document.getElementById("anim")
const playButton = document.getElementById("play")
const stopButton = document.getElementById("stop")

playButton.addEventListener("click", () => {
  el.classList.add("animate")
})

stopButton.addEventListener("click", () => {
  el.classList.remove("animate")
})