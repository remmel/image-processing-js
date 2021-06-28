import * as THREE from 'three'

import { decode } from 'fast-png'
import { DataImage, loadDepthData } from './DataImage'

export const HONOR20VIEW_DEPTH_INTRINSICS = {  //default my Honor 20 View intrinsics
  w: 240, //x
  h: 180, //y
  fx: 178.824,
  fy: 179.291,
  cx: 119.819,
  cy: 89.13,
  rangeToMeters: range => (range & 0x1FFF) / 1000 // DEPTH16 format, with both distance and precision
}

/**
 * Create a mesh from depth data
 * For education purpose, handle uv/color and indexed/unindexed
 * Best choice is indexed + UV
 * @return {Promise<Mesh>} Mesh<BufferGeometry,MeshPhongMaterial>
 */
export async function loadDepth16BinMesh(urlDepth, urlRgb, intrinsics = HONOR20VIEW_DEPTH_INTRINSICS) {
  var useVertexColors = false
  var depthData = await loadDepthData(urlDepth)
  var {w, h, fx, rangeToMeters} = intrinsics

  var rgbDataImage = useVertexColors ? await DataImage.createFromRgbUrl(urlRgb) : null

  var geometry = createGeometry(depthData, w, h, fx, rangeToMeters, true, rgbDataImage)

  var texture = await new THREE.TextureLoader().loadAsync(urlRgb)

  var material = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide,
    flatShading: true,
    map: useVertexColors ? null : texture,
    vertexColors: useVertexColors,
    // wireframe: true,
  })

  return new THREE.Mesh(geometry, material)
}

const THRESHOLD = 0.1

export function correctTriangle(ra, rb, rc) {
  if (ra > 0 && rb > 0 && rc > 0) {
    if (Math.abs(1 - ra / rb) < THRESHOLD && Math.abs(1 - rb / rc) < THRESHOLD && Math.abs(1 - rc / ra) < THRESHOLD)
      return true
  }
  return false
}

/**
 * Create a geometry from depth information
 * Can generate indexed or not mesh. Using colors or UV
 *
 * Index: this is better to use indices to avoid repeating position/color/uv
 * indices contains id for vertices (grouped by 3 for a face)
 * vertices.length/3 == colors.length/3 < w*h == 43200
 * vertices(97263) indices(186156)
 *
 * UnIndex: Nb faces = geometry.attributes.uv.length/2/3 = geometry.attributes.position.array.length/3/3
 * Color/Uv : if color is used pixel colors will be added in 'color' attribute
 *
 */
export function createGeometry(dData, width, height, focal, fnToZMm, useIndex = true, colorPixels = null, discard = null) {

  var positionsIdx = [], uvsIdx = [], colorsIdx = [], indices = [] //if uses index
  var positionsUn = [], uvsUn = [] //if doesnt use index

  var idxVerticesByXY = []

  if(dData.length !== width*height) throw "dData.length !== width*height <=> "+dData.length+" !== "+width*height
  var getZ = (x, y) => fnToZMm(dData[y * width + x])
  var getIdx = (x, y) => y * width + x

  var idVertex = 0
  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      var z3 = getZ(x, y)
      if(z3 === 0) continue
      var x3 = (x - width / 2) * z3 / focal
      var y3 = (y - height / 2) * z3 / focal

      if(discard !== null && discard(x3,y3,z3)) continue //used by bounding box to remove points

      if(useIndex) {
        positionsIdx.push(x3, y3, z3) //==vertices[idVertex*3+0]=x3
        if(colorPixels) colorsIdx.push(...colorPixels.getPixel(x, y, width / colorPixels.w))
        else uvsIdx.push(x/width, 1-y/height) // image is Y-flipped
      }

      idxVerticesByXY[getIdx(x,y)]={id: idVertex, z: z3, xyz: [x3, y3, z3]}  //to be able to find the 1d position of a vertices from it 2d position
      idVertex++ //idx in the vertices array (if useIndex is true)

      //faces
      if(x > 0 && y > 0) { // skip first row and col
        var nw = idxVerticesByXY[getIdx(x - 1, y - 1)]
        var ne = idxVerticesByXY[getIdx(x, y - 1)]
        var se = idxVerticesByXY[getIdx(x, y)] //current one, useless, just to check
        var sw = idxVerticesByXY[getIdx(x - 1, y)]

        var w = width-1 //if there are h*w range pixel, there will be (h-1)*(w-1)*2 triangles
        var h = height-1
        if(nw && sw && se && correctTriangle(nw.z, sw.z, se.z)) { //◣ anticlock
          if(useIndex) {
            indices.push(nw.id, sw.id, se.id)
          } else {
            positionsUn.push(...nw.xyz, ...sw.xyz, ...se.xyz) //9 values
            uvsUn.push((x-1)/w, 1-(y-1)/h, (x-1)/w, 1-y/h, x/w, 1-y/h) // 6 values
          }
        }

        if(nw && se && ne && correctTriangle(nw.z, se.z, ne.z)) { //◥ anticlock
          if(useIndex) {
            indices.push(nw.id, se.id, ne.id)
          } else {
            positionsUn.push(...nw.xyz, ...se.xyz, ...ne.xyz) //9 values
            uvsUn.push((x-1)/w, 1-(y-1)/h, x/w, 1-y/h, x/w, 1-(y-1)/h) // 6 values
          }
        }
      }
    }
  }

  var geometry = new THREE.BufferGeometry()
  if (useIndex) {
    geometry.setIndex(indices)
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionsIdx, 3))
    if (colorPixels) geometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsIdx, 3))
    else geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvsIdx, 2)) //values of uv
  } else {
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionsUn, 3))
    if (colorPixels) throw new Error("Doesn't handle not indexed color. Use Indexed color or UV")
    else geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvsUn, 2)) //values of uv
  }

  return geometry
}

