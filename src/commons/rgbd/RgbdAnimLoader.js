import { accumulate, idPad } from '../../pose-viewer/utils'
import * as THREE from 'three'
import { loadDepth16BinMesh } from './RgbdMeshLoader'

/**
 * Thoses anim takes too much GPU RAM
 * ~12MB per frame (nvidia-smi), investige how to use less memory (1440x1080 jpg 1MB)
 * 1. .dispose() after each frame, but takes 200ms after to reload (done in 3d-viewer)
 * 2. frame by frame (with .visible or animation)
 * 3. VideoTexture : https://threejs.org/examples/?q=video#webxr_vr_video
 *    https://threejs.org/examples/?q=video#webgl_materials_video
 * 4. Compare with pointcloud / colored faces (26.5MB point cloud high, 0.1MB point cloud low)
 * 5. Edit video, and crop texture and depth
 * 6. Projected image?
 * 7. Load next 10 frames ahead of time, after dispose
 * 8. Kinect pointcloud video : https://threejs.org/examples/?q=video#webgl_video_kinect
 */
export async function loadRgbdAnim(urls, onProgress, type) {
  // console.log('count', urls.length)
  onProgress = onProgress || (() => {})
  var objs3d = await loadDepth16BinList(urls, onProgress)
  let m = new THREE.Group()
  var animateCb = null
  switch (type) {
    case TYPE.DIRTY:
      animateCb = dirtyAnimationAnimeCallbackViaGroup(m, objs3d)
      break
    case TYPE.BOOMERANG:
      animateCb = animationAnimeCallbackBoomrang(m, objs3d)
      break
    default:
      animateCb = animationAnimeCallback(m, objs3d)
  }
  return { m, animateCb }
}

export var TYPE = {
  DEFAULT: null,
  DIRTY: 'dirty',
  BOOMERANG: 'boomerang',
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
    promises.push(loadDepth16BinMesh(depth, rgb).then(obj => { //loadDepth16BinPoints(
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
 * @param {THREE.Group} g empty group
 * @param {[THREE.Object3D]} objs
 * @returns {function(): void}
 */
export function dirtyAnimationAnimeCallbackViaGroup(g, objs) {
  let objIdx = 0, frame = 0
  objs.forEach(m => {
    g.add(m)
    m.visible = false
  })
  return delta => {
    frame++
    var speed = 3 //TODO use ms instead ?
    if (frame % speed === 0) {
      if (objIdx === g.children.length) objIdx = 0
      g.children.forEach(m => m.visible = false)
      g.children[objIdx].visible = true
      objIdx++
    }
  }
}

/**
 * Create an animation from a list of n Object3D
 * We will creates n AnimationClip. Each AnimationClip has its own obj and will be visible on 1 frame
 * TODO check why export, ignore the animation (only 1)
 * @param {THREE.Object3D} g empty group
 * @param {[THREE.Object3D]} objs list of objects
 * @returns {function(delta): void} update fct
 */
function animationAnimeCallback(g, objs) {
  var mixers = []
  var duration = 0.08
  var times = accumulate(objs.length, duration)

  for (let i = 0; i < objs.length; i++) {
    var m = objs[i]
    g.add(m)
    var values = new Array(objs.length).fill(false)
    values[i] = true
    const visibleKF = new THREE.BooleanKeyframeTrack('.visible', times, values)
    const clip = new THREE.AnimationClip('Action', duration * objs.length, [visibleKF])
    var mixer = new THREE.AnimationMixer(m)
    const clipAction = mixer.clipAction(clip)
    clipAction.play()
    mixers[i] = mixer
  }

  return (delta) => {
    for (let i = 0; i < mixers.length; ++i) {
      mixers[i].update(delta)
    }
  }
}

/**
 * Create an animation with boomrang effect, to have half of objects of memory for same duration
 * @param {THREE.Object3D} g empty group
 * @param {[THREE.Object3D]} objs list of objects
 * @returns {function(delta): void} update fct
 * TODO first and middle/last might be repeated ABCDDCBA => ABCDCB
 */
function animationAnimeCallbackBoomrang(g, objs) {
  var mixers = []
  var duration = 0.08
  var times = accumulate(objs.length * 2 , duration)

  for (let i = 0; i < objs.length; i++) {
    var m = objs[i]
    g.add(m)
    var values = new Array(objs.length*2).fill(false)
    values[i] = true
    values[objs.length*2 - i - 1] = true //symmetry
    const visibleKF = new THREE.BooleanKeyframeTrack('.visible', times, values)
    const clip = new THREE.AnimationClip('Action', duration * objs.length * 2, [visibleKF])
    var mixer = new THREE.AnimationMixer(m)
    const clipAction = mixer.clipAction(clip)
    clipAction.play()
    mixers[i] = mixer
  }

  return (delta) => {
    for (let i = 0; i < mixers.length; ++i) {
      mixers[i].update(delta)
    }
  }
}

export function generateRgbdUrls(folder, idmin, idmax, inc) {
  inc = inc || 1
  var urls = []
  var count = idmax - idmin
  if (count <= 0) throw 'No images, wrong min/max'
  for (let id = idmin, i = 0; id < idmax; id+=inc, i+=inc) {
    var idStr = idPad(id)
    urls.push({
      depth: folder + '/' + idStr + '_depth16.bin',
      rgb: folder + '/' + idStr + '_image.jpg'
    })
  }
  return urls
}
