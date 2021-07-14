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
 * TODO (0,0,0) must be feets
 */
export class RgbdVideoVFR extends Group {
  constructor(folder, showClippingBox, onProgress) {
    super()

    this.folder = folder
    this.name = 'Group-RgbdVideoVFR'
    this.showClippingBox = showClippingBox

    //progressbar. Let say that mpg is 50% and depthsbin 50%
    this.onProgress = onProgress || (() => {})
    this.progressRgb = 0 //0-1
    this.progressDepths = 0 //0-1

    // material
    /** @var {HTMLVideoElement} elVideo  */
    const elVideo = this.elVideo = createElement(`<video width='400' height='80' muted controls loop playsinline preload='auto' crossorigin='anonymous'>`)

    elVideo.src = folder + "/video_ffmpeg.mp4" //+ '?ts=' + new Date().getTime()
    var texture = this.texture = new THREE.VideoTexture(this.elVideo)
    texture.minFilter = THREE.NearestFilter

    this.material = new THREE.MeshPhongMaterial({
      side: THREE.DoubleSide,
      flatShading: true,
      map: texture
    })

    elVideo.onloadeddata = (e) => {
      this.progressRgb = 1
      this.updateProgress()
    }

    this.geometries = []
    this.timesms = []
    this.offsetMs = 0 //color is offsetMs after depth

    // window.VVFR = this

    //create it directly as we might need it right after creation (no await)
    this.clippingBox = new THREE.Mesh( //position set later
      new THREE.BoxGeometry(), //(0.7, 1.85, 1)
      new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true }),
    )

    this.loadGeometries().then(() => elVideo.play())
  }

  /**
   * wait for user click to start sound, otherwise Chrome prevent "annoying" sound
   * alternative is to start video here instead //this.autoplay = false;  this.geoloaded = false
   * https://sites.google.com/a/chromium.org/dev/audio-video/autoplay
   */
  run() {
    this.elVideo.muted = false
  }

  //calculate clipping box bounding + show clippingbox if required
  calculateClippingBox(config) {
    this.clippingBox.position.set(...config.clippingbox.position)
    this.clippingBox.scale.set(...config.clippingbox.scale)

    //to display and move the box
    this.clippingBox.geometry.computeBoundingBox() //as no 1m box, nothing special
    this.clippingBoxMin = this.clippingBox.geometry.boundingBox.min.clone() //-0.5
      .multiply(this.clippingBox.scale)
      .add(this.clippingBox.position)
    this.clippingBoxMax = this.clippingBox.geometry.boundingBox.max.clone() //0.5
      .multiply(this.clippingBox.scale)
      .add(this.clippingBox.position)

    if(this.showClippingBox) {
      console.log("clippingBox min/max", this.clippingBoxMin, this.clippingBoxMax)
      this.add(this.clippingBox)
    }
  }

  async loadGeometries() {
    var config = await await (await fetch(this.folder + "/config.json")).json()

    this.rotationConfig = new Quaternion(...config.quaternion).multiply(new Quaternion(1,0,0,0)) //same info in poses[0]
    //an alternative is to claculate the reverse rotation to apply at clippingbox, in order to able same rotation to video group
    //var qquiteinverted = q.clone().invert().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,1.57))) //why should I rotate by z 90°??

    this.calculateClippingBox(config)

    var poses = await this.fetchPoses()

    var promises = []

    poses.forEach(p => {
      var url = createRgbdUrls(this.folder, p.frame)
      let promiseGeo = this.createGeometryDepth(url.depth, parseInt(p.timems), HONOR20VIEW_DEPTH_INTRINSICS)
      promises[parseInt(p.timems)] = promiseGeo
      promiseGeo.then(() => {
        this.progressDepths += 1/poses.length
        this.updateProgress()
      })
    })

    this.geometries = await Promise.all(promises)
    this.progressDepths = 1 //because prev value was not exactly 1 (0.999999)
    this.updateProgress()

    var geo = this.geometries.find(g => ![undefined, null].includes(g))

    // 1st frame
    var m = this.mesh = new THREE.Mesh(geo, this.material)
    this.mesh.setRotationFromQuaternion(this.rotationConfig)
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
        let p = new THREE.Vector3(x,y,z).applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(this.rotationConfig))
        //this.matrixWorld) //but only want to rotate them, not change position
        //TODO always min < max ?
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

  updateProgress() {
    this.onProgress((this.progressRgb+this.progressDepths)/2)
  }
}



