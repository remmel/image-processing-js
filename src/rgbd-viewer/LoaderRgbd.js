import * as THREE from 'three'
import {KINECT_INTRINSICS} from '../pose-viewer/datasetsloader/rgbdtum'

import {decode} from 'fast-png' //see png-16-bit-grayscale.md

export const HONOR20VIEW_DEPTH_INTRINSICS = {
  w: 240, //x
  h: 180, //y
  fx: 178.824,
  fy: 179.291,
  cx: 119.819,
  cy: 89.13,
}


//https://www.npmjs.com/package/pngjs#browser

//handle 16bit grayscale https://docs.opencv.org/master/dc/de6/tutorial_js_nodejs.html
//1m=5000 https://vision.in.tum.de/data/datasets/rgbd-dataset/file_formats
//https://stackoverflow.com/questions/66308827/how-to-load-16-bits-grayscale-png-in-opencv-js
// TODO use fov instead
export async function loadTumPng(urlDepth, urlRgb, intrinsics) {
  var binDepth = await((await fetch(urlDepth)).arrayBuffer())
  let depthPng = await decode(binDepth)

  let rgbMat = await loadImageAsCvMat(urlRgb) //TODO do not use opencv has useless - only for resize

  intrinsics = intrinsics || KINECT_INTRINSICS
  if(depthPng.width != rgbMat.width) { //resize rgb
    rgbMat = resize(rgbMat, depthPng.width, depthPng.height)
  }

  var fnTumDepth = (range) => range / 5000 // Tum format: 1<=>0.2mm _ 5000 <=> 1m
  var {vertices, colors} = calculateVectricesAndColors(depthPng.data, rgbMat.data, depthPng.width, depthPng.height, intrinsics.fx, fnTumDepth)

  var obj3d = createObject3DPoints(vertices, colors)

  if(rgbMat) rgbMat.delete()
  return obj3d
}

/**
 * Creates Object3d from DEPTH_16 bin and jpg image (like dataset created by https://github.com/remmel/hms-AREngine-demo)
 * @param urlDepth url of the DEPTH_16 bin (https://developer.android.com/reference/android/graphics/ImageFormat#DEPTH16)
 * @param urlRgb url of the jpg image. If the jpg is not the same width x height of depth image, it will be automatically resized
 * @param intrinsics depth intrinsics {w,h,fx,fy,cx,cy} to simplify fx=fy; cx=w/2; cy=h/2
 * TODO use fov instead
 */
export async function loadDepth16Bin(urlDepth, urlRgb, intrinsics) {
  var response = await fetch(urlDepth)
  var arrayBuffer = response.ok ? await (response).arrayBuffer() : null

  let rgbMat = await loadImageAsCvMat(urlRgb, 'rgb')

  intrinsics = intrinsics || HONOR20VIEW_DEPTH_INTRINSICS //default my Honor 20 View intrinsics

  if(rgbMat.cols != intrinsics.w) { //resize to have same size than depth
    rgbMat = resize(rgbMat, intrinsics.w, intrinsics.h)
  }

  // new Int16Array(arrayBuffer)[1] == new DataView(arrayBuffer).getInt16(1*2, true)
  var samples = new Int16Array(arrayBuffer)

  var fnDepth = (range) => (range & 0x1FFF) / 1000 // DEPTH16 format, with both distance and precision
  var {vertices, colors} = calculateVectricesAndColors(samples, rgbMat.data, intrinsics.w, intrinsics.h, intrinsics.fx, fnDepth)

  var obj3d = createObject3DPoints(vertices, colors)
  if(rgbMat) rgbMat.delete()
  return obj3d
}

function resize(rgbMat, w, h) {
  let dst = new cv.Mat();
  cv.resize(rgbMat, dst, new cv.Size(w, h), 0, 0, cv.INTER_AREA);
  cv.imshow('rgb', dst);
  rgbMat.delete()
  return dst
}

function calculateVectricesAndColors(dData, rgbData, width, height, focal, fnToZMm) {
  var vertices = []
  var colors = []

  if(dData.length !== width*height) throw "dData.length !== width*height <=> "+dData.length+" !== "+width*height

  for (var u = 0; u < width; u++) {
    for (var v = 0; v < height; v++) {
      var idx = (v * width + u)
      var range = dData[idx]
      if (range === 0) continue //no value
      var z = fnToZMm(range)
      var x = (u - width / 2) * z / focal
      var y = (v - height / 2) * z / focal
      vertices.push(x, y, z)

      if (rgbData) { //colors image has 4 channels RGBA
        var r = rgbData[idx * 4 + 0]
        var g = rgbData[idx * 4 + 1]
        var b = rgbData[idx * 4 + 2]
        colors.push(r / 255.0, g / 255.0, b / 255.0)
      }
    }
  }
  return { vertices, colors }
}

function createObject3DPoints(vertices, colors) {
  var geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  if (colors.length) {
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  }

  var material = new THREE.PointsMaterial({ size: 0.005 })
  material.vertexColors = colors.length > 0
  return new THREE.Points(geometry, material)
}

async function loadImage(url) {
  return new Promise((resolve, reject) => {
    var img = new Image()
    img.src = url
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
  })
}

//CvType.CV_16UC1
// Mat src = Imgcodecs.imread(srcPath);
// Mat dst = new Mat(w, h, CvType.CV_16UC1);
async function loadImageAsCvMat(url) {
  var img = await loadImage(url).catch(e => {})
  if(!img) return null
  return cv.imread(img)
}

async function loadImageAsCvMatViaCanvas(url, elId) {
  var img = await loadImage(url).catch(e => {})
  if(!img) return null
  var canvasOriginal = document.getElementById(elId)
  var ctxOriginal = canvasOriginal.getContext('2d')
  canvasOriginal.width = img.width
  canvasOriginal.height = img.height
  ctxOriginal.drawImage(img, 0, 0)
  return cv.imread(elId)
}

