window.onerror = function(e){
    document.getElementById('target-hammer').innerHTML = e.toString();
}


var myElement = document.getElementById('target-hammer');

var mc = new Hammer.Manager(myElement);

// create a pinch and rotate recognizer
// these require 2 pointers
var pinch = new Hammer.Pinch();

var prevZoom = 0
var prevZoomSetter = 0
var oldPinch = 'NONE'
var currentPinch = 'NONE'
const maxZoom = 25
const minZoom = 0.25

function pinchType(type) {
    var result
    switch(type){
        case 'pinchin':
            result = 'IN'
            break
        case 'pinchout':
            result = 'OUT'
            break
        default:
            result = 'NONE'
    }
    return result
}

function computeZoom(level){
    console.warn(`zoom ${level}`)
    if(currentPinch !== oldPinch || oldPinch === 'NONE'){
       prevZoom = level
       prevZoomSetter = level
    }else if(prevZoomSetter < level || prevZoomSetter > level+1){
        if(level >= 1 && prevZoom < maxZoom) prevZoom += level
        else if(level < 1 && prevZoom > minZoom) prevZoom -= level
        if(prevZoom !== maxZoom && prevZoom !== minZoom)
            prevZoomSetter = level
    }
}

mc.add(new Hammer.Pinch({ threshold: 0.5, pointers: 0 }))
mc.on("pinchstart pinchmove pinchend", onPinch);
function onPinch(ev) {
    if (ev.type == 'pinchstart') {
        console.log('PINCHSTART');
    } else if (ev.type == 'pinchmove') {
        console.log('PINCHMOVE');
        console.log(`Pinch detected: ${ev.additionalEvent === 'pinchin' ? 'IN' : ev.additionalEvent === 'pinchout' ? 'OUT' : 'OTHER'}`)
        console.log(JSON.stringify(ev))
        myElement.textContent = ''
        myElement.append(`pinch ${ev.additionalEvent === 'pinchin' ? 'IN' : ev.additionalEvent === 'pinchout' ? 'OUT' : 'OTHER'}`,
            document.createElement("br"),
            `prevZoom: ${prevZoom}`,
            document.createElement("br"),
            `dX: ${ev.deltaX}`,
            document.createElement("br"),
            `dY: ${ev.deltaY}`,
            document.createElement("br"),
            `dist: ${ev.distance}`,
            document.createElement("br"),
            `scale: ${ev.scale}`,
            document.createElement("br"),
            `angle: ${ev.angle}`,
            document.createElement("br"),
            `rotation: ${ev.rotation}`,
        )

        if(ev.additionalEvent === 'pinchin'){
            myElement.style.background = "lightblue"
        }else if(ev.additionalEvent === 'pinchout'){
            myElement.style.background = "pink"
        }
        
        currentPinch = pinchType(ev.additionalEvent)

        if(ev.scale >= 3){
            computeZoom(3)
        }else if(ev.scale >= 2){
            computeZoom(2)
        }else if(ev.scale >= 1){
            computeZoom(1)
        }else if(ev.scale >= 0.5){
            computeZoom(0.5)
        }else if(ev.scale >= 0.25){
            computeZoom(0.25)
        }
        console.warn(`zoom ${prevZoom}`)

        oldPinch = currentPinch
    } else if (ev.type == 'pinchend') {
        console.log('PINCHEND');
        myElement.style.background = "white"
        oldPinch = currentPinch
        currentPinch = 'NONE'
    } 
}


 // add to the Manager
 //mc.add([pinch]);