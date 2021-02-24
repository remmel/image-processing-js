var img = new Image();
img.src = 'rhino.jpg';
// img.src = 'HSV_color_solid_cylinder.png';
var canvasOriginal = document.getElementById('original');
var ctxOriginal = canvasOriginal.getContext('2d');

var zoom = document.getElementById('zoom');
Object.values(document.getElementsByTagName('canvas')).forEach(function(item) {
    item.addEventListener('mousemove', function (event) {
        var x = event.layerX;
        var y = event.layerY;
        var ctx = this.getContext('2d');
        var pixel = ctx.getImageData(x, y, 1, 1);
        var data = pixel.data;
        var rgba = 'rgba(' + data[0] + ', ' + data[1] + ', ' + data[2] + ', ' + (data[3] / 255) + ')';
        zoom.style.background = rgba;
        zoom.textContent = rgba;
    })
});

img.onload = function () {
    canvasOriginal.width = img.width;
    canvasOriginal.height = img.height;
    ctxOriginal.drawImage(img, 0, 0);
    img.style.display = 'none';

    generateImage(canvasOriginal, document.getElementById('grayscale-average'), fnGrayscaleAverage);
    generateImage(canvasOriginal, document.getElementById('grayscale-weighted'), fnGrayscaleWeighted);
    generateImage(canvasOriginal, document.getElementById('test-hsv'), fnHSVTest);
    generateImage(canvasOriginal, document.getElementById('only-hue'), fnHSVKeepHue);
    generateImage(canvasOriginal, document.getElementById('only-hue-saturation'), fnHSVKeepHueSaturation);
    generateImage(canvasOriginal, document.getElementById('only-hue-value'), fnHSVKeepHueValue);
    generateImageLaplace(canvasOriginal, document.getElementById('edge-laplace'));
};

//todo handle alpha + understand why center is red instead of white

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
    return rgba
}


function fnKeepRed(rgba) {
    var r = rgba.r, g = rgba.r, b = rgba.r, a = rgba.a;
    return {r,g,b,a};
}

function fnHSVTest(rgba) {
    var hsvl = rgb2hsvl(rgba);
    var rgba2 = hsl2rgb(hsvl);
    return rgba2;
}

function fnHSVKeepHueGrayscale(rgba) {
    var hsvl = rgb2hsvl(rgba);
    var hue = hsvl.h* 255;
    return {r:hue, g: hue, b: hue,a: 255};
}

function fnHSVKeepHue(rgba) {
    var hsvl = rgb2hsvl(rgba);
    hsvl.s=1;
    hsvl.v=1;
    return hsl2rgb(hsvl);
}

function fnHSVKeepHueSaturation(rgba) {
    var hsvl = rgb2hsvl(rgba);
    hsvl.v=1;
    var rgba2 = hsl2rgb(hsvl);
    return rgba2;
}

function fnHSVKeepHueValue(rgba) {
    var hsvl = rgb2hsvl(rgba);
    hsvl.s=1;
    var rgba2 = hsl2rgb(hsvl);
    return rgba2;
}

function fnGrayscaleWeighted(rgba) {
    var gray = (rgba.r * 0.299 + rgba.g * 0.587 + rgba.b * 0.114 );
    return {r:gray, g: gray, b: gray,a: 255};
}

function fnGrayscaleAverage(rgba) {
    var gray = (rgba.r + rgba.g + rgba.b) / 3;
    return {r:gray, g: gray, b: gray,a: 255};
}

function fnRandom(rgba) {
    var r = Math.floor(Math.random() * 256);
    var g = Math.floor(Math.random() * 256);
    var b = Math.floor(Math.random() * 256);
    var a = 255;
    return {r,g,b,a};
}

function fnEdgeLaplace(rgba) {

}

function rgb2hsvl(rgba) { //http://www.easyrgb.com/en/math.php
    //R, G and B input range = 0 ÷ 255
    //H, S and L output range = 0 ÷ 1.0

    var r = (rgba.r / 255);
    var g = (rgba.g / 255);
    var b = (rgba.b / 255);

    var min = Math.min(r, g, b); //Min value of RGB
    var max = Math.max(r, g, b); //Max value of RGB
    var delta = max - min; //Delta RGB value

    var l = (max + min) / 2;
    var v = max;

    var h = 0;
    var s = 0;

    if (delta !== 0.0) { //Not gray, chroma
        if (l < 0.5) s = delta / (max + min);
        else s = delta / (2 - max - min);

        var deltaR = (((max - r) / 6) + (delta / 2)) / delta;
        var deltaG = (((max - g) / 6) + (delta / 2)) / delta;
        var deltaB = (((max - b) / 6) + (delta / 2)) / delta;

        if (r === max) h = deltaB - deltaG;
        else if (g === max) h = (1 / 3) + deltaR - deltaB;
        else if (b === max) h = (2 / 3) + deltaG - deltaR;

        if (h < 0) h += 1;
        if (h > 1) h -= 1;
    }

    return {h,s,v,l};
}

function hsl2rgb(hsvl) { //check with https://gist.github.com/mjackson/5311256
    var h = hsvl.h, s = hsvl.s, v = hsvl.v, l = hsvl.l;

    var r = v*255, g = v*255, b=v*255, a=255;

    if ( s !== 0.0 ) {
        var_h = h * 6
        if ( var_h == 6 ) var_h = 0      //H must be < 1
        var_i = Math.floor( var_h )             //Or ... var_i = floor( var_h )
        var_1 = v * ( 1 - s )
        var_2 = v * ( 1 - s * ( var_h - var_i ) )
        var_3 = v * ( 1 - s * ( 1 - ( var_h - var_i ) ) )

        if      ( var_i == 0 ) { var_r = v     ; var_g = var_3 ; var_b = var_1 }
        else if ( var_i == 1 ) { var_r = var_2 ; var_g = v     ; var_b = var_1 }
        else if ( var_i == 2 ) { var_r = var_1 ; var_g = v     ; var_b = var_3 }
        else if ( var_i == 3 ) { var_r = var_1 ; var_g = var_2 ; var_b = v     }
        else if ( var_i == 4 ) { var_r = var_3 ; var_g = var_1 ; var_b = v     }
        else                   { var_r = v     ; var_g = var_1 ; var_b = var_2 }

        r = var_r * 255;
        g = var_g * 255;
        b = var_b * 255;
    }
    return {r,g,b,a}
}


function generateImage(canvasSrc, canvasDst, fn) {
    var w = canvasSrc.width;
    var h = canvasSrc.height;
    canvasDst.width = w;
    canvasDst.height = h;

    // w = h = 5;
    var imgDataSrc = canvasSrc.getContext('2d').getImageData(0, 0, w, h);
    var imgDataDst = canvasDst.getContext('2d').getImageData(0, 0, w, h);

    for (var x = 0; x < w; x++) {
        for (var y = 0; y < h; y++) {
            var rgbaSrc = imgDataSrc.getRgba(x,y);
            var rgbaDst = fn(rgbaSrc);
            imgDataDst.setRgba(x,y,rgbaDst);
        }
    }
    canvasDst.getContext('2d').putImageData(imgDataDst, 0, 0);
}

function generateImageLaplace(canvasSrc, canvasDst) {
    var w = canvasSrc.width;
    var h = canvasSrc.height;
    canvasDst.width = w;
    canvasDst.height = h;

    // w = h = 5;
    var imgDataSrc = canvasSrc.getContext('2d').getImageData(0, 0, w, h);
    var imgDataGray = canvasSrc.getContext('2d').getImageData(0, 0, w, h);
    var imgDataDst = canvasDst.getContext('2d').getImageData(0, 0, w, h);

    // 1. Grayscale
    for (var x = 0; x < w; x++) {
        for (var y = 0; y < h; y++) {
            var rgbaSrc = imgDataSrc.getRgba(x,y);
            var rgbaDst = fnGrayscaleWeighted(rgbaSrc);
            imgDataGray.setRgba(x,y,rgbaDst);
        }
    }

    // todo use imgData with only 1 channel

    // 2. Apply filter
    for (var x = 0; x < w; x++) {
        for (var y = 0; y < h; y++) {
            if(x>0 && x<w-1 && y>0 && y<h-1) { //do not go out of array
                var value =
                    imgDataGray.getRgba(x-1,y-1).r *-1 + imgDataGray.getRgba(x,y-1).r *-1 + imgDataGray.getRgba(x+1,y-1).r *-1
                + imgDataGray.getRgba(x-1,y).r *-1 + imgDataGray.getRgba(x,y).r *8 + imgDataGray.getRgba(x+1,y-1).r *-1
                + imgDataGray.getRgba(x-1,y+1).r *-1 + imgDataGray.getRgba(x,y+1).r *-1 + imgDataGray.getRgba(x+1,y+1).r *-1;

                imgDataDst.setRgba(x,y,{r:value, g:value, b:value, a:255});
            }
        }
    }
    canvasDst.getContext('2d').putImageData(imgDataDst, 0, 0);
}
