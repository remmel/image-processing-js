import { rgb2hsv } from './ConvertColor'
import * as THREE from 'three'

/** @return {THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>} */
export async function loadDepthChae(url) {
  var img = await loadImageViaCanvas(url)
  /** @var {Uint8ArrayClamped} */ var imgdata = img.data

  var rgba = imgdata.subarray(0, 1024*512*4)

  var mindepth = 1757.81005859375, maxdepth = 2486.320068359375,
    focalLength = { 'x': 1988.536987304688, 'y': 1085.140380859375 },
    principalPoint = { 'x': 1988.536987304688, 'y': 1085.140380859375 }

  var focalLength2 = {x:focalLength.x/2, y:focalLength.y/2} //divided / 2 has this was focal for size x2

  var depth = new Int16Array(1024*512)
  var fnToZmeter = mm => mm / 1000

  var offset = 1024 * 512 * 4
  for (var i = 0; i < 1024 * 512; i++) {
    var r = img.data[i * 4 + 0 + offset]
    var g = img.data[i * 4 + 1 + offset]
    var b = img.data[i * 4 + 2 + offset]

    if (r > 0 || g > 0 || b > 0) {
      var hsv = rgb2hsv(r, g, b)
      depth[i] = hsv.h * (maxdepth - mindepth) + mindepth
    } else {
      //depth[i] = 1000 //in mm
    }
  }

  //depth array is expected by the fn to have 1 channel, cannot do something else
  var obj3d = createObj3dPointsWithRGBDSameSize(depth, rgba, 1024, 512,focalLength2, fnToZmeter)
  return obj3d
}

/** @return {THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>} */
export async function loadDepthGoat(url) {
  var img = await loadImageViaCanvas(url)
  /** @var {Uint8ArrayClamped} */ var data = img.data
  var w = img.width/2, h=img.height //image split vertically, should be 480x640

  var rgba = new Uint8Array(w*h*4)
  var depth = new Int16Array(w*h)

  // var mindepth = 1757.81005859375, maxdepth = 2486.320068359375,
  //   focalLength = { 'x': 1988.536987304688, 'y': 1085.140380859375 },
  //   principalPoint = { 'x': 1988.536987304688, 'y': 1085.140380859375 } //to be divided /2 has size is *2


  var fnToZmeter = mm => mm / 1000

  for(var x = 0; x<w; x++) {
    for(var y = 0; y<h; y++) {
      var idxDataColor = (x + w + y * 2 * w) * 4
      var idxDataDepth = (x + 0 + y * 2 * w) * 4

      //rgb
      var idxRgba = (x+y*w)*4
      rgba[idxRgba+0]=data[idxDataColor+0]
      rgba[idxRgba+1]=data[idxDataColor+1]
      rgba[idxRgba+2]=data[idxDataColor+2]

      // depth - //createObj3dPoints... is expecting a depth array with 1 channel, must do that stuff here and not in the fnToZmeter
      var r = img.data[idxDataDepth + 0]
      var g = img.data[idxDataDepth + 1]
      var b = img.data[idxDataDepth + 2]

      if (r > 0 || g > 0 || b > 0) {
        var hsv = rgb2hsv(r, g, b)
        depth[x+y*w] = hsv.h * 3 * 1000 //(maxdepth - mindepth) + mindepth  //in mm
      } else {
        // depth[x+y*w] = 1000 //in mm - for testing purposes
      }
    }
  }

  var intrMat = new THREE.Matrix3()
  intrMat.elements = [593.76177978515625, 0, 0, 0, 594.7872314453125, 0, 241.74200439453125, 319.98410034179688, 1]

  var focal = {x: intrMat.elements[0], y: intrMat.elements[4]}
  // intrMat.transpose()
  // let ifx = 1.0 / intrMat.elements[0]
  // let ify = 1.0 / intrMat.elements[4]
  // let itx = -intrMat.elements[2] / intrMat.elements[0]
  // let ity = -intrMat.elements[5] / intrMat.elements[4]
  // var iK = [ifx, ify, itx, ity]

  var obj3d = createObj3dPointsWithRGBDSameSize(depth, rgba, w, h, focal, fnToZmeter)
  return obj3d
}

/** @return {THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>} */
export async function loadDepthCustom(url, nearClipping, farClipping) {
  var img = await loadImageViaCanvas(url)
  /** @var {Uint8ArrayClamped} */ var data = img.data
  var w = img.width, h=img.height //image split vertically, should be 480x640

  var rgba = new Uint8Array(w*h*4)
  var depth = new Int16Array(w*h)

  // var mindepth = 1757.81005859375, maxdepth = 2486.320068359375,
  //   focalLength = { 'x': 1988.536987304688, 'y': 1085.140380859375 },
  //   principalPoint = { 'x': 1988.536987304688, 'y': 1085.140380859375 } //to be divided /2 has size is *2


  var fnToZmeter = mm => mm / 1000

  var check = []

  for(var x = 0; x<w; x++) {
    for(var y = 0; y<h; y++) {
      var idxDataColor = (x + w + y * 2 * w) * 4
      var idxDataDepth = (x + 0 + y * 2 * w) * 4

      //rgb
      var idxRgba = (x+y*w)*4
      rgba[idxRgba+0]=data[idxDataColor+0]
      rgba[idxRgba+1]=data[idxDataColor+1]
      rgba[idxRgba+2]=data[idxDataColor+2]

      // depth - //createObj3dPoints... is expecting a depth array with 1 channel, must do that stuff here and not in the fnToZmeter
      var r = img.data[idxDataDepth + 0]
      var g = img.data[idxDataDepth + 1]
      var b = img.data[idxDataDepth + 2]

      if (r > 0 || g > 0 || b > 0) {
        var hsv = rgb2hsv(r, g, b) //hsv.h between 0-1

        var dint = Math.round(hsv.h * 3000)
        depth[x+y*w] = dint //(maxdepth - mindepth) + mindepth  //in mm

        if(y === 0) {
          let v = check[dint]
          check[dint] = (v==undefined) ? 1 : v+1
        }

      } else {
        // depth[x+y*w] = 1000 //in mm - for testing purposes
      }
    }
  }

  var intrMat = new THREE.Matrix3()
  intrMat.elements = [593.76177978515625, 0, 0, 0, 594.7872314453125, 0, 241.74200439453125, 319.98410034179688, 1]

  var focal = {x: intrMat.elements[0], y: intrMat.elements[4]}
  // intrMat.transpose()
  // let ifx = 1.0 / intrMat.elements[0]
  // let ify = 1.0 / intrMat.elements[4]
  // let itx = -intrMat.elements[2] / intrMat.elements[0]
  // let ity = -intrMat.elements[5] / intrMat.elements[4]
  // var iK = [ifx, ify, itx, ity]

  var obj3d = createObj3dPointsWithRGBDSameSize(depth, rgba, w, h, focal, fnToZmeter)
  return obj3d
}
