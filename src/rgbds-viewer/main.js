import * as THREE from 'three'
import WebGlApp from '../WebGlApp'
import {
  loadDepth16BinPointsResize,
  loadDepth16BinPoints,
  loadDepth16BinMesh,
  loadImage, getImageDataViaCanvas,
} from '../rgbd-viewer/LoaderRgbd'
import { Euler, Quaternion, Vector3 } from 'three'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module'
import { RAD2DEG } from '../pose-viewer/utils3d'
import { idPad } from '../pose-viewer/utils'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

//to add label GUI: https://threejs.org/examples/#webgl_instancing_performance

// var folder = 'dataset2/2021-02-26_210438_speaking1'
var folder = 'https://www.kustgame.com/ftp/2021-02-26_210438_speaking1'

var webglApp
var params = {}

async function init() {
  webglApp = new WebGlApp(document.body)

  addRemyPoints().then(({m, animeCb}) => {
    webglApp.scene.add(m)
    webglApp.animateAdd(animeCb)
  })

  addRemyMesh().then(m => {
    webglApp.scene.add(m)
  })

  // addHorse().then(({mesh, mixer}) => {
  //   webglApp.scene.add(mesh)
  //   let prevTime = Date.now();
  //   webglApp.animateAdd(() => {
  //     if (mixer) {
  //       const time = Date.now()
  //       mixer.update((time - prevTime) * 0.001)
  //       prevTime = time
  //     }
  //   })
  // })

  addRemyAndAnimation().then(({ m, animateCb }) => {
    webglApp.scene.add(m)
    webglApp.animateAdd(animateCb)
  })

  webglApp.scene.add(createFloor())
  webglApp.scene.add(new THREE.AmbientLight(0xFFFFFF, 1)) //to render exactly the texture (photogrammetry)
  // webglApp.scene.add( new THREE.HemisphereLight( 0x9FC5E8, 0xB45F06 ) ); //to get some "shadow"

  webglApp.animate()

  createGUI()
}

function createGUI() {
  // var q = new Quaternion(-0.44389683,0.5598062,0.5267938,-0.46050537)
  var euler = new Euler(-91/RAD2DEG, -103/RAD2DEG, 176/RAD2DEG)
  var t = new Vector3(1.2, 1.4, 0)

  params = {
    enableWind: true,
    showBall: false,
    pointsize: 0.005,
    plys_speed: 3,
    plys_loading: 0,
    rx: euler.x * RAD2DEG,
    ry: euler.y * RAD2DEG,
    rz: euler.z * RAD2DEG,
    tx: t.x,
    ty: t.y,
    tz: t.z
  }

  const gui = new GUI()
  gui.add(params, 'pointsize').min(0.005).max(0.05).name('Point Size')

  var folderRot = gui.addFolder('Position')
  folderRot.open()
  folderRot.add(params, 'rx', -180, 180)
  folderRot.add(params, 'ry', -180, 180)
  folderRot.add(params, 'rz', -180, 180)
  folderRot.add(params, 'tx', -5, 5).step(.1)
  folderRot.add(params, 'ty', -5, 5).step(.1)
  folderRot.add(params, 'tz', -5, 5).step(.1)

  var folder = gui.addFolder('Animation')
  folder.open()
  folder.add(params, 'plys_speed', 1, 50).step(1).name('Speed')
  folder.add(params, 'plys_loading', 0, 100).name('Loading').listen()
}

async function addRemyPointsResize() {
  var m = await loadDepth16BinPointsResize(folder + '/00000601_depth16.bin', folder + '/00000601_image.jpg')
  // var q = new Quaternion(-0.44389683,0.5598062,0.5267938,-0.46050537)
  // m.setRotationFromQuaternion(q)
  // m.position.set(-2.3739648,0.06929223,-0.19393142)
  m.setRotationFromEuler(new THREE.Euler(params.rx / RAD2DEG, params.ry / RAD2DEG, params.rz / RAD2DEG))
  m.position.set(params.tx, params.ty, params.tz + 2)
  return m
}

async function addRemyPoints() {
  var m = await loadDepth16BinPoints(folder + '/00000601_depth16.bin?a', folder + '/00000601_image.jpg?a')

  var animeCb = () => {
    m.material.size = params.pointsize
    m.setRotationFromEuler(new THREE.Euler(params.rx / RAD2DEG, params.ry / RAD2DEG, params.rz / RAD2DEG))
    m.position.set(params.tx, params.ty, params.tz + 2)
  }
  return { m, animeCb }
}

async function addRemyMesh() {
  var m = await loadDepth16BinMesh(folder + '/00000601_depth16.bin',
    folder + '/00000601_image.jpg')
  m.setRotationFromEuler(new THREE.Euler(params.rx / RAD2DEG, params.ry / RAD2DEG, params.rz / RAD2DEG))
  m.position.set(params.tx, params.ty, params.tz - 2)
  return m
}

async function addHorse() {
  var gltf = await new GLTFLoader().loadAsync('https://threejs.org/examples/models/gltf/Horse.glb')
  var mesh = gltf.scene.children[0]
  mesh.scale.set(0.01, 0.01, 0.01)
  window.MESH = mesh
  window.GLTF = gltf
  var mixer = new THREE.AnimationMixer(mesh)
  mixer.clipAction(gltf.animations[0]).setDuration(1).play()
  return {mesh, mixer}
}

function generateRgbdUrls(folder, idmin, idmax) {
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

async function addRemyAndAnimation() {
  var loadingCallback = (percent) => params.plys_loading = Math.round(percent * 100)
  var urls = generateRgbdUrls(folder, 512, 601) //601
  var objs3d = await loadDepth16BinList(urls, loadingCallback)
  let m = objs3d[0].clone()
  var animateCb = dirtyAnimationAnimeCallback(m, objs3d)
  return { m, animateCb }
}

/**
 * Create an animation from a list of Object3D //TODO use animation instead, possible?
 * @param {THREE.Object3D} obj
 * @param {[THREE.Object3D]} objs
 * @returns {function(): void}
 */
function dirtyAnimationAnimeCallback(obj, objs) {
  let objIdx = 0, frame = 0
  return () => {
    frame++
    if (objs && frame % params.plys_speed === 0) {
      objIdx++
      if (objIdx === objs.length) objIdx = 0
      obj.geometry = objs[objIdx].geometry //stupidly create multiple material for nothing, I know
      obj.setRotationFromEuler(new THREE.Euler(params.rx / RAD2DEG, params.ry / RAD2DEG, params.rz / RAD2DEG))
      obj.position.set(params.tx, params.ty, params.tz)
      obj.material.size = params.pointsize
    }
  }
}

/**
 * Load multiples rgbd images in parallel
 * @param onProgess
 * @returns {Promise<[THREE.Object3D]>}
 */
async function loadDepth16BinList(urls, onProgess) {
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

function createFloor() {
  var geo = new THREE.PlaneBufferGeometry(3, 3)
  var mat = new THREE.MeshBasicMaterial({ color: 0x777777, side: THREE.DoubleSide })
  var plane = new THREE.Mesh(geo, mat)
  plane.rotation.x = 90/RAD2DEG
  return plane
}

window.main = init



