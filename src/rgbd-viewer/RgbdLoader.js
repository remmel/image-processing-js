import * as THREE from 'three'
import {KINECT_INTRINSICS} from '../pose-viewer/datasetsloader/rgbdtum'

import {decode} from 'fast-png'
import { DataImage } from './DataImage'
import { rgb2hsv } from './ConvertColor'

export const HONOR20VIEW_DEPTH_INTRINSICS = {  //default my Honor 20 View intrinsics
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
  var obj3d = createObj3dPointsWithRGBDSameSize(depthPng.data, rgbMat.data, depthPng.width, depthPng.height, {x:intrinsics.fx, y:intrinsics.fy}, fnTumDepth)
  if(rgbMat) rgbMat.delete()
  return obj3d
}

//Probably I will remove that, in order to avoid using OpenCV
export async function loadDepth16BinPointsResize(urlDepth, urlRgb, intrinsics) {
  var response = await fetch(urlDepth)
  var arrayBuffer = response.ok ? await (response).arrayBuffer() : null

  let rgbMat = await loadImageAsCvMat(urlRgb)

  intrinsics = intrinsics || HONOR20VIEW_DEPTH_INTRINSICS //default my Honor 20 View intrinsics

  if(rgbMat.cols !== intrinsics.w) { //resize to have same size than depth
    rgbMat = resize(rgbMat, intrinsics.w, intrinsics.h)
  }

  // new Int16Array(arrayBuffer)[1] == new DataView(arrayBuffer).getInt16(1*2, true)
  var samples = new Int16Array(arrayBuffer)

  var fnDepth = (range) => (range & 0x1FFF) / 1000 // DEPTH16 format, with both distance and precision
  var obj3d = createObj3dPointsWithRGBDSameSize(samples, rgbMat.data, intrinsics.w, intrinsics.h, {x:intrinsics.fx, y:intrinsics.fy}, fnDepth)
  if(rgbMat) rgbMat.delete()
  return obj3d
}

/**
 * Creates Object3d from DEPTH_16 bin and jpg image (like dataset created by https://github.com/remmel/hms-AREngine-demo)
 * @param urlDepth url of the DEPTH_16 bin (https://developer.android.com/reference/android/graphics/ImageFormat#DEPTH16)
 * @param urlRgb url of the jpg image. If the jpg is not the same width x height of depth image, it will be automatically resized
 * @param intrinsics depth intrinsics {w,h,fx,fy,cx,cy} to simplify fx=fy; cx=w/2; cy=h/2
 * @return {THREE.Points}
 * TODO use fov instead
 */
export async function loadDepth16BinPoints(urlDepth, urlRgb, intrinsics) {
  var response = await fetch(urlDepth)
  var arrayBuffer = response.ok ? await (response).arrayBuffer() : null

  let rgb = await loadImageViaCanvas(urlRgb) // let rgbMat = await loadImageAsCvMat(urlRgb)

  intrinsics = intrinsics || HONOR20VIEW_DEPTH_INTRINSICS //default my Honor 20 View intrinsics

  // new Int16Array(arrayBuffer)[1] == new DataView(arrayBuffer).getInt16(1*2, true)
  var samples = new Int16Array(arrayBuffer)

  var fnDepth = (range) => (range & 0x1FFF) / 1000 // DEPTH16 format, with both distance and precision

  var depthImg = new DataImage(samples, 1, intrinsics.w, intrinsics.h, fnDepth)
  var rgbImg = new DataImage(rgb.data, 4, rgb.width, rgb.height)

  var w = depthImg.w, h=depthImg.h //wanted width
  // var w = rgbImg.w, h=rgbImg.h
  var obj3d = createObj3dPoints(depthImg, rgbImg, w, h, intrinsics.fx)
  // if(rgbMat) rgbMat.delete()
  return obj3d
}

/**
 * Colors are store in BufferGeometry:
 * `geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))`
 * @param {String} urlDepth
 * @param {String} urlRgb
 * @param {Object} intrinsics
 * @returns {Promise<Mesh>} Mesh<BufferGeometry,MeshPhongMaterial>
 */
export async function loadDepth16BinMesh(urlDepth, urlRgb, intrinsics) {
  var response = await fetch(urlDepth)
  var arrayBuffer = response.ok ? await (response).arrayBuffer() : null

  intrinsics = intrinsics || HONOR20VIEW_DEPTH_INTRINSICS

  var samples = new Int16Array(arrayBuffer)

  var fnDepth = (range) => (range & 0x1FFF) / 1000 // DEPTH16 format, with both distance and precision
  var {w, h, fx} = intrinsics

  let rgbMat = await loadImageAsCvMat(urlRgb)
  var rgbImg = new DataImage(rgbMat.data, 4, rgbMat.cols, rgbMat.rows) //or resize

  // var obj3d = createMeshWithColorUsingIndex(samples, w, h, fx, fnDepth, rgbImg)
  var obj3d = createMeshWithColor(samples, w, h, fx, fnDepth, rgbImg)

  if(rgbMat) rgbMat.delete()
  return obj3d
}

/**
 * Uses texture with uv, seems to be the best choice
 * @return {Promise<Mesh>} Mesh<BufferGeometry,MeshPhongMaterial>
 */
export async function loadDepth16BinMeshTexture(urlDepth, urlRgb, intrinsics) {
  var depthData;
  var depthBuffer = await((await fetch(urlDepth)).arrayBuffer())
  if(urlDepth.endsWith('depth16.bin')) {
    depthData = new Int16Array(depthBuffer)
  } else {
    depthData = (await decode(depthBuffer)).data
  }

  // depthData = urlDepth.endsWith('.depth16.bin') ?

  intrinsics = intrinsics || HONOR20VIEW_DEPTH_INTRINSICS //default my Honor 20 View intrinsics


  var fnDepth = (range) => (range & 0x1FFF) / 1000 // DEPTH16 format, with both distance and precision
  var {w, h, fx} = intrinsics

  var m = await createMeshWithTexture(depthData, w, h, fx, fnDepth, urlRgb)

  return m
}

function resize(rgbMat, w, h) {
  let dst = new cv.Mat();
  cv.resize(rgbMat, dst, new cv.Size(w, h), 0, 0, cv.INTER_AREA)
  if(document.getElementById('rgb'))
    cv.imshow('rgb', dst);
  rgbMat.delete()
  return dst
}

/** @return {THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>} */
function createObj3dPointsWithRGBDSameSize(dData, rgbData, width, height, focal, fnToZmeter) {
  var vertices = []
  var colors = []

  if(dData.length !== width*height) throw "dData.length !== width*height <=> "+dData.length+" !== "+width*height

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

      if (rgbImg) { //colors image has 4 channels RGBA
        var rgb = rgbImg.getPixel(i, j, rgbRatio)
        colors.push(...rgb)
      }
    }
  }
  return createPoints(vertices, colors)
}

const THRESHOLD = 0.1

function createMeshWithColor(dData, width, height, focal, fnToZMm, rgbImg) {
  var vertices = []
  var positions = []
  var colors = []

  var idxVerticesByXY = []
  var rgbRatio = rgbImg ? width / rgbImg.w : null

  if(dData.length !== width*height) throw "dData.length !== width*height <=> "+dData.length+" !== "+width*height
  var getZ = (x, y) => fnToZMm(dData[y * width + x])
  var getIdx = (x, y) => y * width + x

  var numVertice = 0
  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      var z3 = getZ(x, y)
      if(z3 === 0) continue
      var x3 = (x - width / 2) * z3 / focal
      var y3 = (y - height / 2) * z3 / focal
      vertices.push(x3, y3, z3)
      idxVerticesByXY[getIdx(x,y)]={id: numVertice, xyz: [x3, y3, z3]}  //to be able to find the 1d position of a vertices from it 2d position
      numVertice++

      //faces
      if(x > 0 && y > 0) {
        // 1)◤ 2)◢  - anticlockwise
        var nw = getZ(x - 1, y - 1) //do not "recalculate" that, as this is infonw.xyz.z
        var ne = getZ(x, y - 1)
        var se = z3
        var sw = getZ(x - 1, y)

        var infonw = idxVerticesByXY[getIdx(x - 1, y - 1)]
        var infone = idxVerticesByXY[getIdx(x, y - 1)]
        var infose = idxVerticesByXY[getIdx(x, y)] //current one, useless, just to check
        var infosw = idxVerticesByXY[getIdx(x - 1, y)]

        if(nw > 0 && se > 0 && sw > 0){ //◤and range not too different
          if (Math.abs(1 - nw / se) < THRESHOLD && Math.abs(1 - se / sw) < THRESHOLD && Math.abs(1 - sw / nw) < THRESHOLD){
            positions.push(...infonw.xyz, ...infosw.xyz, ...infose.xyz)
            var rgb = rgbImg.getPixel(x, y, rgbRatio)
            colors.push(...rgb, ...rgb, ...rgb) //duplicated data
          }
        }

        if(nw > 0 && ne > 0 && se > 0) { //◢ and range not too different
          if(Math.abs(1-nw/ne) < THRESHOLD && Math.abs(1-ne/se) < THRESHOLD && Math.abs(1-se/nw) < THRESHOLD){
            positions.push(...infonw.xyz, ...infose.xyz, ...infone.xyz)
            var rgb = rgbImg.getPixel(x, y, rgbRatio)
            colors.push(...rgb, ...rgb, ...rgb) //duplicated data
          }
        }
      }
    }
  }

  /**
   * Mesh : if not index
   * positions.length == colors.length (xyz and colors are repeated - 558468)
   * Faces are contained in positions directly then for 1st face abc : [xa,ya,za,xb,yb,zb,xc,yc,zc]
   */
  var geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  var material = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    vertexColors: true,
    flatShading: true,
  })

  return new THREE.Mesh(geometry, material)
}

/**
 * If rgb size == depth size, can use that one
 * To avoid repeating colors and xyz, use indices
 */
function createMeshWithColorUsingIndex(dData, width, height, focal, fnToZMm, rgbImg) {
  var vertices = []
  var colors = []
  var indices = []

  var idxVerticesByXY = []
  var rgbRatio = rgbImg ? width / rgbImg.w : null

  if (dData.length !== width * height) throw 'dData.length !== width*height <=> ' + dData.length + ' !== ' + width * height
  var getZ = (x, y) => fnToZMm(dData[y * width + x])
  var getIdx = (x, y) => y * width + x

  var numVertice = 0
  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      var z3 = getZ(x, y)
      if (z3 === 0) continue
      var x3 = (x - width / 2) * z3 / focal
      var y3 = (y - height / 2) * z3 / focal
      vertices.push(x3, y3, z3)
      idxVerticesByXY[getIdx(x, y)] = { id: numVertice, z: z3 }  //to be able to find the 1d position of a vertices from it 2d position
      numVertice++

      //faces
      if (x > 0 && y > 0) { //skip 1st row and 1st col
        // 1)◤ 2)◢  - anticlockwise
        var nw = idxVerticesByXY[getIdx(x - 1, y - 1)]
        var ne = idxVerticesByXY[getIdx(x, y - 1)]
        var se = idxVerticesByXY[getIdx(x, y)] //current one, useless, just to check
        var sw = idxVerticesByXY[getIdx(x - 1, y)]

        if (nw && se && sw) { //◤and range not too different
          if (Math.abs(1 - nw.z / se.z) < THRESHOLD
            && Math.abs(1 - se.z / sw.z) < THRESHOLD
            && Math.abs(1 - sw.z / nw.z) < THRESHOLD) {
            indices.push(nw.id, sw.id, se.id)
          }
        }

        if (nw && ne && se) { //◢ and range not too different
          if (Math.abs(1 - nw.z / ne.z) < THRESHOLD
            && Math.abs(1 - ne.z / se.z) < THRESHOLD
            && Math.abs(1 - se.z / nw.z) < THRESHOLD) {
            indices.push(nw.id, se.id, ne.id)
          }
        }
      }

      //colors
      if (rgbImg) { //colors image has 4 channels RGBA
        var rgb = rgbImg.getPixel(x, y, rgbRatio)
        colors.push(...rgb)
      }
    }
  }

  /**
   * mesh if index :
   * indices contains id for vertices (grouped by 3 for a face)
   * vertices.length/3 == colors.length/3 < w*h == 43200
   * vertices(97263) indices(186156)
   */
  var geometry = new THREE.BufferGeometry()
  geometry.setIndex(indices)
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

  var material = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    vertexColors: true, // useless
    flatShading: true
  })

  return new THREE.Mesh(geometry, material)
}

function correctTriangle(ra, rb, rc) {
  if (ra > 0 && rb > 0 && rc > 0) {
    if (Math.abs(1 - ra / rb) < THRESHOLD && Math.abs(1 - rb / rc) < THRESHOLD && Math.abs(1 - rc / ra) < THRESHOLD)
      return true
  }
  return false
}

async function createMeshWithTexture(dData, width, height, focal, fnToZMm, rgbUrl) {
  var vertices = []
  var positions = []
  var uvs = []

  var idxVerticesByXY = []

  if(dData.length !== width*height) throw "dData.length !== width*height <=> "+dData.length+" !== "+width*height
  var getZ = (x, y) => fnToZMm(dData[y * width + x])
  var getIdx = (x, y) => y * width + x

  var numVertice = 0
  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      var z3 = getZ(x, y)
      if(z3 === 0) continue
      var x3 = (x - width / 2) * z3 / focal
      var y3 = (y - height / 2) * z3 / focal
      vertices.push(x3, y3, z3)
      idxVerticesByXY[getIdx(x,y)]={id: numVertice, xyz: [x3, y3, z3]}  //to be able to find the 1d position of a vertices from it 2d position
      numVertice++

      //faces
      if(x > 0 && y > 0) { // skip first row and col
        var nw = getZ(x - 1, y - 1) //do not "recalculate" that, as this is infonw.xyz.z
        var ne = getZ(x, y - 1)
        var se = z3
        var sw = getZ(x - 1, y)

        var infonw = idxVerticesByXY[getIdx(x - 1, y - 1)]
        var infone = idxVerticesByXY[getIdx(x, y - 1)]
        var infose = idxVerticesByXY[getIdx(x, y)] //current one, useless, just to check
        var infosw = idxVerticesByXY[getIdx(x - 1, y)]


        var w = width-1 //if there are h*w range pixel, there will be (h-1)*(w-1)*2 triangles
        var h = height-1
        if(correctTriangle(nw, sw, se)) { //◣ anticlock
          positions.push(...infonw.xyz, ...infosw.xyz, ...infose.xyz) //9 values
          uvs.push((x-1)/w, 1-(y-1)/h, (x-1)/w, 1-y/h, x/w, 1-y/h) // 6 values
        }

        if(correctTriangle(nw, se, ne)) { //◥ anticlock
          positions.push(...infonw.xyz, ...infose.xyz, ...infone.xyz)
          uvs.push((x-1)/w, 1-(y-1)/h, x/w, 1-y/h, x/w, 1-(y-1)/h) // 6 values
        }
      }
    }
  }

  /**
   * Mesh : if not index
   * Nb faces = geometry.attributes.uv.length/2/3 = geometry.attributes.position.array.length/3/3
   */
  var geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)) //values of uv

  // var texture = new THREE.TextureLoader().load(rgbUrl, () => {
  //   console.log(rgbUrl, 'loaded')
  // }) //TODO display progress, (e) => console.log("onLoad", e)

  var texture = await new THREE.TextureLoader().loadAsync(rgbUrl)

  var material = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    flatShading: true,
    map: texture,
    wireframe: true,
  })

  return new THREE.Mesh(geometry, material)
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
async function loadImageViaCanvas(url) {
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
