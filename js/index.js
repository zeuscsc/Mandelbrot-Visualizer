const worker = new Worker("./js/worker.js");
const width = 1000;
const height = 1000;
let perviousParams = "";
let currentParams = window.location.search;
const canvas = document.createElement("canvas");
canvas.setAttribute("width", width);
canvas.setAttribute("height", height);

let offscreenCanvas= document.createElement("canvas");
document.body.appendChild(canvas);
const offsetWidth=canvas.offsetWidth;
const offsetHeight = canvas.offsetHeight;
const context = canvas.getContext("2d", { alpha: false });
let pixal = function (x, y, c) {
  context.fillStyle = c;
  context.fillRect(x, y, 3 * sampleRate, 3 * sampleRate);
};
const center = { x: width / 2, y: height / 2 };
const size = 200;
let zoom = 1;
let scale = size * zoom;
let offsetX = 0,
  offsetY = 0;
let sampleRate = 1;
let updated = false;
let updateParamsHistoryFunction;
let updateURLFunction;
let drag = false;
let dragStart, dragEnd;
let pointerCache = [];
let prevDiff = 0;
load();

function onWheel(event){
  zooming(zoom / (event.deltaY / 50));
}
function onMouseDown(event){ 
  if (event.button === 0) {
    dragStart = {
      x: event.pageX - offsetWidth,
      y: event.pageY - offsetHeight,
    };
    shiftStart();
  }
}
function onMouseMove(event){
  dragEnd = {
    x: event.pageX - offsetWidth,
    y: event.pageY - offsetHeight,
  };
  if (dragStart && dragEnd)
    shifting(dragStart.x - dragEnd.x, dragStart.y - dragEnd.y);
}
function onMouseUp(){
  shifted();
}
canvas.addEventListener("wheel", onWheel);
canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("mouseup",onMouseUp);

function offscreenCanvasResetEvents(){ 
  offscreenCanvas.addEventListener("wheel", onWheel);
  offscreenCanvas.addEventListener("mousedown", onMouseDown);
  offscreenCanvas.addEventListener("mousemove", onMouseMove);
  offscreenCanvas.addEventListener("mouseup",onMouseUp);
}
offscreenCanvasResetEvents()

let hammer = new Hammer(document.body, {
  domEvents: true,
});
setMobileEvents(hammer)
function setMobileEvents(hammer){ 
  hammer.get("pinch").set({
    enable: true,
  });
  hammer.on("pinchend", function (event) {
    if (event.scale > 1) {
      zooming(zoom / -event.scale);
    } else {
      zooming(zoom / (1 / event.scale));
    }
  });
  hammer.on("pan", function (event) {
    shiftStart();
    shifting(-event.deltaX / 10, -event.deltaY / 10);
  });
  hammer.on("panend", function () {
    shifted();
  });
}

function zooming(amount) {
  zoom -= amount;
  if (zoom < 1) zoom = 1;
  scale = size * zoom;
  save();
}
function shiftStart() {
  drag = true;
}
function shifting(deltaX, deltaY) {
  if (drag) {
    x = deltaX / offsetWidth;
    y = deltaY / offsetHeight;
    offsetX -= x / zoom;
    offsetY -= y / zoom;
    save();
    dragStart = dragEnd;
  }
}
function shifted() {
  drag = false;
}

draw();
save();
function draw() {
  if (isParamsChanged()) {
    sampleRate = 10;
    updated = false;
    update();
  } else {
    sampleRate = 1;
    if (!updated) {
      // update();
      offscreenCanvas= document.createElement("canvas");
      offscreenCanvas.setAttribute("width", width);
      offscreenCanvas.setAttribute("height", height);
      let offscreen = offscreenCanvas.transferControlToOffscreen();
      worker.postMessage([width,height,center.x, center.y,scale,offsetX,offsetY,size,sampleRate]);
      worker.postMessage({canvas:offscreen},[offscreen]);
      updated = true;
      updateURLFunction = setTimeout(() => {
        updateURL();
      }, 5000);
    }
  }
  setTimeout(() => {
    draw();
  }, 10);
}
worker.onmessage = (e) => {
  // console.log("Done")
  document.body.appendChild(offscreenCanvas);
  canvas.parentNode.removeChild(canvas);
  offscreenCanvasResetEvents();
}

function update() {
  offscreenCanvas.parentNode?.removeChild(offscreenCanvas)
  canvas.parentNode?.removeChild(canvas);
  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 1; y < width; y += sampleRate) {
    for (let x = 1; x < height; x += sampleRate) {
      let dx = (x - center.x) / scale - offsetX;
      let dy = (y - center.y) / scale - offsetY;
      let a = dx;
      let b = dy;
      for (let t = 1; t < size; t++) {
        let d = a * a - b * b + dx;
        b = 2 * (a * b) + dy;
        a = d;
        H = d > size;
        if (H) {
          let color = `rgb(${t * 3},${t},${t * 0.5})`;
          pixal(x, y, color);
          break;
        }
      }
    }
  }

  document.body.appendChild(canvas);
}
function load() {
  const urlParams = new URLSearchParams(window.location.search);
  zoom = urlParams.get("zoom") || 1;
  scale = size * zoom;
  offsetX = urlParams.get("offsetX") || 0;
  offsetY = urlParams.get("offsetY") || 0;
}
function save() {
  currentParams = { zoom, offsetX, offsetY };
  clearTimeout(updateParamsHistoryFunction);
  clearTimeout(updateURLFunction);
  updateParamsHistoryFunction = setTimeout(() => {
    perviousParams = currentParams;
  }, 1000);
}
function updateURL() {
  const url = new URL(window.location);
  url.searchParams.set("zoom", zoom);
  url.searchParams.set("offsetX", offsetX);
  url.searchParams.set("offsetY", offsetY);
  window.history.pushState({ zoom, offsetX, offsetY }, "Mandelbrot", url);
}
function isParamsChanged() {
  // console.log(window.location.search,perviousParams)
  return currentParams !== perviousParams;
}
