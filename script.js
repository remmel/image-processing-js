var img = new Image();
img.src = 'rhino.jpg';
var canvasOriginal = document.getElementById('original');
var ctxOriginal = canvasOriginal.getContext('2d');


function fnCopy(rgba) {
    var r = rgba.r, g = rgba.g, b = rgba.b, a = rgba.a;
    return {r: r, g: g, b: b, a: a}
    //return rgba
}


function fnKeepRed(rgba) {
    return {r: rgba.r, g: rgba.r, b: rgba.r, a: rgba.a}
}


function fnRandom(rgba) {
    var r = Math.floor(Math.random() * 256)
    var g = Math.floor(Math.random() * 256)
    var b = Math.floor(Math.random() * 256)
    var a = 255;
    return {r: r, g: g, b: b, a: a}
}


function generateImage(fn) {
    var canvasGenerate = document.getElementById('generate');
    var ctxGenerate = canvasGenerate.getContext('2d');
    var w = canvasGenerate.width;
    var h = canvasGenerate.height;
    ctxGenerate.clearRect(0, 0, w, h);
    var id = ctxGenerate.getImageData(0, 0, w, h);
    var pixels = id.data;


    for (var x = 0; x < w; x++) {
        for (var y = 0; y < h; y++) {
            var imgDataOriginal = ctxOriginal.getImageData(x, y, 1, 1);
            var d = imgDataOriginal.data;
            var rgba = {r: d[0], g: d[1], b: d[2], a: d[3]};
            var rgba2 = fn(rgba);

            var off = (y * id.width + x) * 4;
            pixels[off] = rgba2.r;
            pixels[off + 1] = rgba2.g;
            pixels[off + 2] = rgba2.b;
            pixels[off + 3] = rgba2.a;
        }
    }
    ctxGenerate.putImageData(id, 0, 0);
}

img.onload = function () {
    ctxOriginal.drawImage(img, 0, 0);
    img.style.display = 'none';
    generateImage(fnCopy);
};