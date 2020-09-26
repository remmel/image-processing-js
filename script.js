var img = new Image();
// img.src = 'rhino.jpg';
img.src = 'HSV_color_solid_cylinder.png';
var canvasOriginal = document.getElementById('original');
var ctxOriginal = canvasOriginal.getContext('2d');

img.onload = function () {
    canvasOriginal.width = img.width;
    canvasOriginal.height = img.height;
    ctxOriginal.drawImage(img, 0, 0);
    img.style.display = 'none';

    generateImage(canvasOriginal, document.getElementById('test-hsv'), fnHSVTest);
    generateImage(canvasOriginal, document.getElementById('only-hue'), fnHSVKeepHue);
    generateImage(canvasOriginal, document.getElementById('only-hue-saturation'), fnHSVKeepHueSaturation);
    generateImage(canvasOriginal, document.getElementById('only-hue-value'), fnHSVKeepHueValue);
};

//todo handle alpha + loop to get pixel color + understand why center is red instead of white

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


function fnRandom(rgba) {
    var r = Math.floor(Math.random() * 256);
    var g = Math.floor(Math.random() * 256);
    var b = Math.floor(Math.random() * 256);
    var a = 255;
    return {r,g,b,a};
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

function hsl2rgb(hsvl) {
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


function generateImage(canvasOriginal, canvasGenerate, fn) {
    var w = canvasOriginal.width;
    var h = canvasOriginal.height;
    canvasGenerate.width = w;
    canvasGenerate.height = h;

    // w = h = 5;
    var imgData2 = canvasGenerate.getContext('2d').getImageData(0, 0, w, h);
    var imgDataOriginal = canvasOriginal.getContext('2d').getImageData(0, 0, w, h);

    for (var x = 0; x < w; x++) {
        for (var y = 0; y < h; y++) {
            var rgba = imgDataOriginal.getRgba(x,y);
            var rgba2 = fn(rgba);
            imgData2.setRgba(x,y,rgba2);
        }
    }
    canvasGenerate.getContext('2d').putImageData(imgData2, 0, 0);
}