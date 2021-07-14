
function openCvReady() {
    var img = new Image();
img.src = 'rhino.jpg';
    // img.src = 'HSV_color_solid_cylinder.png';

    img.onload = function () {
        var canvasOriginal = document.getElementById('original');
        var ctxOriginal = canvasOriginal.getContext('2d');
        canvasOriginal.width = img.width;
        canvasOriginal.height = img.height;
        ctxOriginal.drawImage(img, 0, 0);

        let src = cv.imread('original');
        let grayscaleMat = new cv.Mat();
        let hsvMat = new cv.Mat();
        let hsvTestMat = new cv.Mat(); //RGB -> HSV -> RGB
        let laplaceMat = new cv.Mat();

        cv.cvtColor(src, grayscaleMat, cv.COLOR_RGBA2GRAY, 0);
        cv.cvtColor(src, hsvMat, cv.COLOR_RGB2HSV, 0);
        cv.cvtColor(hsvMat, hsvTestMat, cv.COLOR_HSV2RGB, 0);

        cv.cvtColor(src, src, cv.COLOR_RGB2GRAY, 0);
        cv.Laplacian(src, laplaceMat, cv.CV_8U, 1, 2, 0, cv.BORDER_DEFAULT);



        cv.imshow('grayscale', grayscaleMat);
        cv.imshow('hsvTest', hsvTestMat);
        cv.imshow('hsv', hsvMat);
        cv.imshow('laplace', laplaceMat)
        src.delete();
        grayscaleMat.delete();
        hsvMat.delete();
        hsvTestMat.delete();

        document.hsvMat = hsvMat;
    };
}

var Module = {
    onRuntimeInitialized() { openCvReady(); }
};
