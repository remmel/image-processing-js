import { idPad } from '../pose-viewer/utils'
import * as THREE from 'three'
import { Euler, NumberKeyframeTrack, Vector3 } from 'three'
import { loadDepth16BinMeshTexture } from './RgbdLoader'
import { RAD2DEG } from '../pose-viewer/utils3d'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export async function loadRgbdAnim(urls, onProgress) {
  onProgress = onProgress || (() => {})
  var objs3d = await loadDepth16BinList(urls, onProgress)
  let m = new THREE.Group()
  // var animateCb = dirtyAnimationAnimeCallbackViaGroup(m, objs3d)
  var animateCb = animationAnimeCallback(m, objs3d)
  return { m, animateCb }
}

// const visibleKF = new THREE.BooleanKeyframeTrack('.visible', [0,1], [true, false])
// const clip = new THREE.AnimationClip('Action', 2, [visibleKF])
// var mixer = new THREE.AnimationMixer(animationGroup)

// create a ClipAction and set it to play
// mixer.update(clock.getDelta())


/**
 * Load multiples rgbd images in parallel
 * @param onProgess
 * @returns {Promise<[THREE.Object3D]>}
 */
export async function loadDepth16BinList(urls, onProgess) {
  var objs3d = []

  var promises = [];
  var progress = 0

  for (let i = 0; i < urls.length; i++) {
    var { depth, rgb } = urls[i]
    promises.push(loadDepth16BinMeshTexture(depth, rgb).then(obj => { //loadDepth16BinPoints(
      objs3d[i] = obj
      if (onProgess) {
        progress++
        onProgess(progress / urls.length)
      }
    }))
  }

  await Promise.all(promises) //TODO return directly promise, or don't change anything?
  return objs3d //geometries
}

/**
 * Create an animation from a list of Object3D //TODO use animation instead, possible?
 * @param {THREE.Group} g
 * @param {[THREE.Object3D]} objs
 * @returns {function(): void}
 */
export function dirtyAnimationAnimeCallbackViaGroup(g, objs) {
  let objIdx = 0, frame = 0
  g.add(...objs)
  g.children.forEach(m => m.visible = false)
  return () => {
    frame++
    var speed = window.params && params.plys_speed ? params.plys_speed : 6
    if (frame % speed === 0) {
      if (objIdx === g.children.length) objIdx = 0
      g.children.forEach(m => m.visible = false)
      g.children[objIdx].visible = true
      objIdx++
    }
  }
}

/**
 * Create an animation from a list of Object3D
 * TODO check why export, ignore the animation (only 1)
 * @param {THREE.Object3D} obj
 * @param {[THREE.Object3D]} objs
 * @returns {function(): void}
 */
function animationAnimeCallback(g, objs) {
  var mixers = []
  var times = []
  var time_sec = 0;
  for (let i = 0; i < objs.length; i++) {
    times.push(time_sec)
    time_sec +=0.08 // time between each frame
  }

  for (let i = 0; i < objs.length; i++) {
    var m = objs[i]
    g.add(m)
    var values = new Array(objs.length).fill(false)
    values[i] = true
    const visibleKF = new THREE.BooleanKeyframeTrack('.visible', times, values)
    const clip = new THREE.AnimationClip('Action', time_sec, [visibleKF])
    var mixer = new THREE.AnimationMixer(m)
    const clipAction = mixer.clipAction(clip)
    clipAction.play()
    var clock = new THREE.Clock()
    mixers[i] = mixer
  }

  return () => {
    var mixerUpdateDelta = clock.getDelta()
    for (let i = 0; i < mixers.length; ++i) {
      mixers[i].update(mixerUpdateDelta)
    }
  }
}

export function generateRgbdUrls(folder, idmin, idmax) {
  var urls = []
  var count = idmax - idmin
  if (count <= 0) throw 'No images, wrong min/max'
  for (let id = idmin, i = 0; id < idmax; id++, i++) {
    var idStr = idPad(id)
    urls.push({
      depth: folder + '/' + idStr + '_depth16.bin',
      rgb: folder + '/' + idStr + '_image.jpg'
    })
  }
  return urls
}
