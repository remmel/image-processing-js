import * as THREE from 'three'
import { Group, Quaternion } from 'three'
import { addElement, createElement } from '../domUtils'
import { createGeometry, HONOR20VIEW_DEPTH_INTRINSICS } from './RgbdMeshLoader'
import { createRgbdUrls } from '../demoscenes'
import { loadDepthData } from './DataImage'
import { csv2objects } from '../../pose-viewer/csv'
import { closest } from '../../pose-viewer/utils'

/**
 * Class using VideoTexture for rgb and bins for depth,
 * but the timestamp is provided in poses.csv to sync rgb with depth
 */
export class RgbdVideoVFR extends Group {
  constructor(folder, clippingBox) {
    super()

    this.folder = folder
    this.name = 'Group-RgbdVideoVFR'

    // material
    /** @var {HTMLVideoElement} elVideo  */
    const elVideo = this.elVideo = createElement(`<video width='400' height='80'  controls loop playsinline preload='auto' crossorigin='anonymous'>`)

    elVideo.src = folder + "/video_ffmpeg.mp4" + '?ts=' + new Date().getTime()
    var texture = this.texture = new THREE.VideoTexture(this.elVideo)
    texture.minFilter = THREE.NearestFilter

    this.material = new THREE.MeshPhongMaterial({
      side: THREE.DoubleSide,
      flatShading: true,
      map: texture
    })

    this.geometries = []
    this.timesms = []
    this.offsetMs = 0 //color is offsetMs after depth

    window.VVFR = this

    if(clippingBox) { //word position clipping box
      clippingBox.geometry.computeBoundingBox()
      this.clippingBoxMin = clippingBox.geometry.boundingBox.min.clone()
        .multiply(clippingBox.scale)
        .add(clippingBox.position)
      this.clippingBoxMax = clippingBox.geometry.boundingBox.max.clone()
        .multiply(clippingBox.scale)
        .add(clippingBox.position)
    }


    this.loadGeometries().then(() => elVideo.play())
  }

  async loadGeometries() {
    var poses = await this.fetchPoses()

    var p = poses[0]
    this.setRotationFromQuaternion(new Quaternion(p.qx, p.qy, p.qz, p.qw).multiply(new Quaternion(1,0,0,0)))
    // //why should I rotate by z 90°??
    // var qquiteinverted = q.clone().invert().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,1.57)))

    var promises = []

    poses.forEach(p => {
      var url = createRgbdUrls(this.folder, p.frame)
      promises[parseInt(p.timems)] = this.createGeometryDepth(url.depth, parseInt(p.timems), HONOR20VIEW_DEPTH_INTRINSICS)
    })

    this.geometries = await Promise.all(promises)

    var geo = this.geometries.find(g => ![undefined, null].includes(g))

    // 1st frame
    var m = this.mesh = new THREE.Mesh(geo, this.material)
    this.add(m)

    this.geometries.forEach(g => {
      if(g) this.timesms.push(g.timems)
    })

  }

  async fetchPoses() {
    var txt = await (await fetch(this.folder + "/poses.csv")).text()
    return csv2objects(txt)
  }

  //or ontimeupdate
  update() {
    if(this.geometries.length === 0 || this.timesms.length === 0) return

    var frameIdx = this.getFrameIdx(this.elVideo.currentTime) //frameIdx is the same than timeMs recorded

    if(this.prevFrameIdx !== frameIdx) {
      this.mesh.geometry = this.geometries[frameIdx]
      if(this.prevFrameIdx !== undefined)
        this.geometries[this.prevFrameIdx].dispose()
      this.prevFrameIdx = frameIdx
    }
  }

  getFrameIdx(currentTime) {
    var closestTimems = closest(this.timesms, parseInt(currentTime*1000)+this.offsetMs)
    return closestTimems
  }

  async createGeometryDepth(urlDepth, timems, intrinsics = HONOR20VIEW_DEPTH_INTRINSICS) {
    var depthData = await loadDepthData(urlDepth)
    var {w, h, fx, rangeToMeters} = intrinsics

    var discard = this.clippingBoxMin && this.clippingBoxMax
      ? (x, y, z) => {
        //clipping box is word position relative, thus convert relative depth point to word point
        let p = new THREE.Vector3(x,y,z).applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(this.quaternion))
        //this.matrixWorld) //but only want to rotate them, not change position
        if (p.x < this.clippingBoxMin.x || p.x > this.clippingBoxMax.x) return true
        if (p.y < this.clippingBoxMin.y || p.y > this.clippingBoxMax.y) return true
        if (p.z < this.clippingBoxMin.z || p.z > this.clippingBoxMax.z) return true //my left my right
        return false
      }
      : null

    var geo = createGeometry(depthData, w, h, fx, rangeToMeters, true, null, discard)

    geo.timems = timems
    return geo
  }
}

function between(a, b, val) {
  return (a < b && a < val && val < b) || (b > a && b < val && val < a)
}


