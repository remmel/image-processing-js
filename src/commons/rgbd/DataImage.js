import { decode } from 'fast-png'

export class DataImage{
  constructor(data, channels, width, height, fnRange) {
    if (data.length !== width * height * channels) throw 'wrong length'

    this.data = data
    this.channels = channels
    this.w = width
    this.h = height
    this.fn = fnRange
  }

  static async createFromRgbUrl(url) {
    let rgbData = await loadImageViaCanvas(url)
    return new DataImage(rgbData.data, 4, rgbData.width, rgbData.height) //or resize
  }

  //1440*1080 / 240*180 / 640x480
  /**
   *
   * @param x in output size format
   * @param y in output size format
   * @param ratio
   * @returns {number[]|*}
   */
  getPixel(x, y, ratio = 1) {
    var x2 = Math.floor(x / ratio) //in internal coordinate
    var y2 = Math.floor(y / ratio) //in internal coordinate
    if(x2 >= this.w) {debugger; throw "x2 is too big: "+x2}
    if(y2 >= this.h) throw "y2 is too big: "+y2
    var idx = (y2 * this.w + x2)
    if(idx >= this.w * this.h) throw `x,y are too big: idx:${idx} w:${this.w} h:${this.h} x2:${x2} y2:${y2}`
    if (this.channels === 4) {
      var r = this.data[idx * 4 + 0]
      var g = this.data[idx * 4 + 1]
      var b = this.data[idx * 4 + 2]
      return [r / 255.0, g / 255.0, b / 255.0]
    } else {
      var value = this.data[idx]
      return this.fn ? this.fn(value) : value
    }

  }
}

async function createImageTag(url) {
  return new Promise((resolve, reject) => {
    var img = new Image()
    img.crossOrigin = "Anonymous" //to avoid `The canvas has been tainted by cross-origin data` err
    img.src = url
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
  })
}

//alternative to OpenCV mat to read rgb image //TODO try to use it
export async function loadImageViaCanvas(url) {
  var img = await createImageTag(url)
  var canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height)
  var data = canvas.getContext('2d').getImageData(0, 0, img.width, img.height).data
  return {
    data: data,
    width: img.width,
    height: img.height
  }
}

/**
 * Load an image directly from the <img>. Could also create a canvas and provides its id (see history)
 * Mat src = Imgcodecs.imread(srcPath); Mat dst = new Mat(w, h, CvType.CV_16UC1);
 * @return cv.Mat
 */
async function loadImageAsCvMat(url) {
  var img = await createImageTag(url).catch(e => {})
  if(!img) return null
  return cv.imread(img)
}

export async function loadDepthData(urlDepth) {
  var arrayBuffer = await((await fetch(urlDepth)).arrayBuffer())

  var depthData
  if(urlDepth.endsWith('depth16.bin')) {
    depthData = new Int16Array(arrayBuffer)
  } else {
    depthData = (await decode(arrayBuffer)).data
  }
  return depthData
}
