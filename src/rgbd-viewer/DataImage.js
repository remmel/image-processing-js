
export class DataImage{
  constructor(data, channels, width, height, fnRange) {
    if (data.length !== width * height * channels) throw 'wrong length'

    this.data = data
    this.channels = channels
    this.w = width
    this.h = height
    this.fn = fnRange
  }

  //1440*1080 / 240*180 / 640x480
  /**
   *
   * @param x in output size format
   * @param y in output size format
   * @param ratio
   * @returns {number[]|*}
   */
  getPixel(x, y, ratio) {
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
