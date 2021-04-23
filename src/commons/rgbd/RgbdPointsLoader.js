//https://www.npmjs.com/package/pngjs#browser

//handle 16bit grayscale https://docs.opencv.org/master/dc/de6/tutorial_js_nodejs.html
//1m=5000 https://vision.in.tum.de/data/datasets/rgbd-dataset/file_formats
//https://stackoverflow.com/questions/66308827/how-to-load-16-bits-grayscale-png-in-opencv-js
// TODO use fov instead
import { decode } from 'fast-png'
import { KINECT_INTRINSICS } from '../../pose-viewer/datasetsloader/rgbdtum'
import { DataImage, loadDepthData, loadImageViaCanvas } from './DataImage'
import * as THREE from 'three'
import { createGeometry, HONOR20VIEW_DEPTH_INTRINSICS } from './RgbdMeshLoader'

/**
 * Load RGBD image, but both image must have same resolution. Otherwise uses loadDepth16BinPoints
 * I keep that fct for leaning purpose
 * @return {Promise<Points>}
 */
export async function loadDepth16BinPointsWithRGBDSameSize(urlDepth, urlRgb, intrinsics = HONOR20VIEW_DEPTH_INTRINSICS) {
  var depthData = await loadDepthData(urlDepth)
  let imgRgb = await loadImageViaCanvas(urlRgb)
  var {w, h, fx, fy, rangeToMeters} = intrinsics
  return createObj3dPointsWithRGBDSameSize(depthData, imgRgb.data, w, h, {x:fx, y:fy}, rangeToMeters)
}

/**
 * Creates Object3d from DEPTH_16 bin and jpg image (like dataset created by https://github.com/remmel/hms-AREngine-demo)
 * @param urlDepth url of the DEPTH_16 bin (https://developer.android.com/reference/android/graphics/ImageFormat#DEPTH16)
 * @param urlRgb url of the jpg image. If the jpg is not the same width x height of depth image, it will be automatically resized
 * @param intrinsics depth intrinsics {w,h,fx,fy,cx,cy} to simplify fx=fy; cx=w/2; cy=h/2
 * @return {THREE.Points}
 * TODO use fov instead
 */
export async function loadDepth16BinPoints(urlDepth, urlRgb, intrinsics = HONOR20VIEW_DEPTH_INTRINSICS) {
  var response = await fetch(urlDepth)
  var arrayBuffer = response.ok ? await (response).arrayBuffer() : null

  let rgb = await loadImageViaCanvas(urlRgb)

  var samples = new Int16Array(arrayBuffer)// new Int16Array(arrayBuffer)[1] == new DataView(arrayBuffer).getInt16(1*2, true)

  var fnDepth = range => (range & 0x1FFF) / 1000 // DEPTH16 format, with both distance and precision

  var depthImg = new DataImage(samples, 1, intrinsics.w, intrinsics.h, fnDepth)
  var rgbImg = new DataImage(rgb.data, 4, rgb.width, rgb.height)

  var w = depthImg.w, h=depthImg.h //wanted width
  // var w = rgbImg.w, h=rgbImg.h
  return createObj3dPoints(depthImg, rgbImg, w, h, intrinsics.fx)
}

function resize(rgbMat, w, h) {
  let dst = new cv.Mat();
  cv.resize(rgbMat, dst, new cv.Size(w, h), 0, 0, cv.INTER_AREA)
  if(document.getElementById('rgb'))
    cv.imshow('rgb', dst);
  rgbMat.delete()
  return dst
}

/**
 * Create a THREE.Points object from rgb and depth image having the same size
 * That same process could be done with createObj3dPoints but I'll keep that code for learning purpose
 * @return {THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>}
 */
function createObj3dPointsWithRGBDSameSize(dData, rgbData, width, height, focal, fnToZmeter) {
  var vertices = []
  var colors = []

  if(dData.length !== width*height) throw "dData.length !== width*height <=> "+dData.length+" !== "+width*height
  // if(rgbData.length !== width*height) throw "rgbData.length !== width*height <=> "+rgbData.length+" !== "+width*height

  for (var j = 0; j < width; j++) {
    for (var i = 0; i < height; i++) {
      var idx = (i * width + j)
      var range = dData[idx]
      if (range === 0) continue //no value
      var z = fnToZmeter(range)
      var x = (j - width / 2) * z / focal.x
      var y = (i - height / 2) * z / focal.y
      vertices.push(x, y, z) //in meters

      if (rgbData) { //colors image has 4 channels RGBA
        var r = rgbData[idx * 4 + 0]
        var g = rgbData[idx * 4 + 1]
        var b = rgbData[idx * 4 + 2]
        colors.push(r / 255.0, g / 255.0, b / 255.0)
      }
    }
  }
  return createPoints(vertices, colors)
}

/**
 * @return {THREE.Points}
 * @param {DataImage} depthImg
 * @param {DataImage} rgbImg
 * @param {Number} width wanted width
 * @param {Number} height wanted height
 * @param depthFocal
 * @return {Points<BufferGeometry, PointsMaterial>}
 */
function createObj3dPoints(depthImg, rgbImg, width, height, depthFocal) {
  var vertices = []
  var colors = []

  // check same ratio
  var depthRatio = width / depthImg.w //new img is {depthRatio} times bigger than depthImg
  var rgbRatio = rgbImg ? width / rgbImg.w : null
  var focal = depthFocal * depthRatio

  for (var j = 0; j < height; j++) {
    for (var i = 0; i < width; i++) {
      var z = depthImg.getPixel(i, j, depthRatio)
      if (z === 0) continue //no value
      var x = (i - width / 2) * z / focal
      var y = (j - height / 2) * z / focal
      vertices.push(x, y, z)

      if (rgbImg) colors.push(...rgbImg.getPixel(i, j, rgbRatio))
    }
  }
  return createPoints(vertices, colors)
}

/**
 * @param vertices
 * @param colors
 * @return {THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>}
 */
function createPoints(vertices, colors) {
  var geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  if (colors.length) {
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  }

  var material = new THREE.PointsMaterial({ size: 0.005 })
  material.vertexColors = colors.length > 0
  return new THREE.Points(geometry, material)
}
