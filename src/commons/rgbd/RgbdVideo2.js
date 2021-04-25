import * as THREE from 'three'
import { Group } from 'three'
import { createElement } from '../domUtils'
import { createGeometry, HONOR20VIEW_DEPTH_INTRINSICS } from './RgbdMeshLoader'
import { createRgbdUrls } from '../demoscenes'
import { loadDepthData } from './DataImage'

/**
 * Class using VideoTexture for rgb and bins for depth
 */
export class RgbdVideo2 extends Group {
  constructor(folder, fps = 25) {
    super()

    this.folder = folder
    this.fps = fps

    // material
    /** @var {HTMLVideoElement} elVideo  */
    const elVideo = this.elVideo = createElement(`<video controls muted loop playsinline preload='auto' crossorigin='anonymous'>`)

    elVideo.src = folder + "/video/output_color_1440x1080.mp4" //+ '?ts=' + new Date().getTime()
    var texture = this.texture = new THREE.VideoTexture(this.elVideo)
    texture.minFilter = THREE.NearestFilter

    var material = this.material = new THREE.MeshPhongMaterial({
      side: THREE.DoubleSide,
      flatShading: true,
      map: texture
    })

    this.geometries = [];

    //geometry
    createGeometryDepth(folder + "/00000354_depth16.bin").then(geometry=> {
      var m = this.mesh = new THREE.Mesh(geometry, material)
      this.add(m)
    })

    this.loadGeometries().then(() => elVideo.play())
  }

  async loadGeometries() {
    var promises = []
    for(var i = 354, idx = 0; i<= 469; i++, idx++) {
      var url = createRgbdUrls(this.folder, i)
      promises.push(createGeometryDepth(url.depth))
    }

    this.geometries = await Promise.all(promises)
  }

  //or ontimeupdate
  update() {
    if(this.geometries.length === 0) return

    var frameIdx = Math.floor(this.elVideo.currentTime * this.fps)
    // handle offset
    frameIdx = (frameIdx+1)%this.geometries.length
    if(!this.geometries[frameIdx]) return console.error("geo not found at "+frameIdx)
    this.mesh.geometry = this.geometries[frameIdx]

    if(this.prevFrameIdx !== undefined && this.prevFrameIdx !== frameIdx)
      this.geometries[this.prevFrameIdx].dispose()

    this.prevFrameIdx = frameIdx
  }
}

async function createGeometryDepth(urlDepth, intrinsics = HONOR20VIEW_DEPTH_INTRINSICS) {
  var depthData = await loadDepthData(urlDepth)
  var {w, h, fx, rangeToMeters} = intrinsics
  return createGeometry(depthData, w, h, fx, rangeToMeters)
}
