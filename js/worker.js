let pixal = function (context,x, y, c) {
    context.fillStyle = c;
    context.fillRect(x, y, 3 * sampleRate, 3 * sampleRate);
};
let width ;
let height ;
let center;
let offsetX ;
let offsetY ;
let size ;
let sampleRate ;
onmessage = (e) => {
    if(e.data.length > 0) {
        // console.log("args")
        let dataIndex=0;
        width = e.data[dataIndex++];
        height = e.data[dataIndex++];
        center = { x: e.data[dataIndex++], y: e.data[dataIndex++] };
        scale = e.data[dataIndex++];
        offsetX = e.data[dataIndex++];
        offsetY = e.data[dataIndex++];
        size = e.data[dataIndex++];
        sampleRate = e.data[dataIndex++];
    }else{
        // console.log("Drawing",width,height,center.x, center.y,scale,offsetX,offsetY,size,sampleRate)
        let canvas=e.data.canvas;
        const context = canvas.getContext("2d", { alpha: false });
        for (let y = 1; y < height; y += sampleRate) {
          for (let x = 1; x < width; x += sampleRate) {
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
                pixal(context,x, y, color);
                break;
              }
            }
          }
        }
        postMessage("done");
    }
};
