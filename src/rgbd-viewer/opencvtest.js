export function convertGrayscale(elIdFrom, elIdTo) {
  var img = new Image();
  img.src = 'experiments/ip/rhino.jpg';
  // img.src = 'HSV_color_solid_cylinder.png';

  img.onload = function () {
    var canvasOriginal = document.getElementById(elIdFrom);
    var ctxOriginal = canvasOriginal.getContext('2d');
    canvasOriginal.width = img.width;
    canvasOriginal.height = img.height;
    ctxOriginal.drawImage(img, 0, 0);

    let src = cv.imread(elIdFrom);
    let grayscaleMat = new cv.Mat();

    cv.cvtColor(src, grayscaleMat, cv.COLOR_RGBA2GRAY, 0);
    cv.imshow(elIdTo, grayscaleMat);

    src.delete();
    grayscaleMat.delete();
  };
}
