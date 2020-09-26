var img = new Image();
img.src = 'rhino.jpg';
var canvasOriginal = document.getElementById('original');
var ctxOriginal = canvasOriginal.getContext('2d');

ImageData.prototype.setRgba = function (x, y, rgba) {
    var index = 4 * (x + y * this.width);
    this.data[index + 0] = rgba.r;
    this.data[index + 1] = rgba.g;
    this.data[index + 2] = rgba.b;
    this.data[index + 3] = rgba.a;
};

ImageData.prototype.getRgba = function (x, y) {
    var index = 4 * (x + y * this.width);

    return {
        r: this.data[index + 0],
        g: this.data[index + 1],
        b: this.data[index + 2],
        a: this.data[index + 3],
    }
};


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
    var imgData2 = ctxGenerate.getImageData(0, 0, w, h);
    var imgDataOriginal = ctxOriginal.getImageData(0, 0, w, h);

    for (var x = 0; x < w; x++) {
        for (var y = 0; y < h; y++) {
            var rgba = imgDataOriginal.getRgba(x,y);
            var rgba2 = fn(rgba);
            imgData2.setRgba(x,y,rgba2);
        }
    }
    ctxGenerate.putImageData(imgData2, 0, 0);
}

img.onload = function () {
    ctxOriginal.drawImage(img, 0, 0);
    img.style.display = 'none';
    generateImage(fnCopy);
};