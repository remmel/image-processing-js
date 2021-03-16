import * as THREE from 'three'
import WebGlApp from '../WebGlApp'
import {
  loadDepth16BinPointsResize,
  loadDepth16BinPoints,
  loadDepth16BinMesh,
  loadImage, getImageDataViaCanvas, loadDepth16BinMeshTexture,
} from '../rgbd-viewer/LoaderRgbd'
import { Euler, Quaternion, Vector3 } from 'three'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module'
import { RAD2DEG } from '../pose-viewer/utils3d'
import { idPad } from '../pose-viewer/utils'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { loadObj } from '../rgbd-viewer/LoadersHelper'

//to add label GUI: https://threejs.org/examples/#webgl_instancing_performance

// var folder = 'dataset/2021-02-26_210438_speaking1'
var folder = 'https://www.kustgame.com/ftp/2021-02-26_210438_speaking1'
var speaking1Euler = new Euler(-91/RAD2DEG, -103/RAD2DEG, 176/RAD2DEG)
var speaking1Pos = new Vector3(1.2, 1.4, 0)

var folder2 = 'dataset/2021-03-09_205154_coucoustoolhires'

var webglApp
var params = {}

async function init() {
  webglApp = new WebGlApp()

  var urlDepth = folder + '/00000601_depth16.bin', urlRgb = folder + '/00000601_image.jpg'

  var canAttachTransformControl = []

  // loadDepth16BinPoints(urlDepth, urlRgb).then(m => {
  //   webglApp.scene.add(m)
  //   m.setRotationFromEuler(speaking1Euler)
  //   m.position.copy(speaking1Pos)
  //   canAttachTransformControl.push(m)
  // })



  // loadDepth16BinPointsResize(urlDepth, urlRgb).then(m => {
  //   webglApp.scene.add(m)
  //   m.setRotationFromEuler(speaking1Euler)
  //   m.position.copy(speaking1Pos)
  //   m.position.z += 2
  //   canAttachTransformControl.push(m)
  // })

  // loadDepth16BinMesh(urlDepth, urlRgb).then(m => {
  //   webglApp.scene.add(m)
  //   m.setRotationFromEuler(speaking1Euler)
  //   m.position.copy(speaking1Pos)
  //   m.position.z += -2
  // })

  loadDepth16BinMeshTexture(urlDepth, urlRgb).then(m => {

    webglApp.scene.add(m)
    m.setRotationFromEuler(speaking1Euler)
    m.position.copy(speaking1Pos)
    m.position.z += 2
    canAttachTransformControl.push(m)
  })

  addRemyAndAnimation().then(({ m, animateCb }) => {
    webglApp.scene.add(m)
    webglApp.animateAdd(animateCb)
    canAttachTransformControl.push(m)
    // webglApp.animateAdd(guiPositionAnimateCb(m, 0))
  })

  webglApp.scene.add(createFloor())
  webglApp.scene.add(new THREE.AmbientLight(0xFFFFFF, 1)) //to render exactly the texture (photogrammetry)
  // webglApp.scene.add( new THREE.HemisphereLight( 0x9FC5E8, 0xB45F06 ) ); //to get some "shadow"

  loadObj(
    'https://www.kustgame.com/ftp/cocina/depthmaps-lowlowalignhighest.obj',
    'https://www.kustgame.com/ftp/cocina/depthmaps-lowlowalignhighest.mtl', () => {})
    .then(m => {
      m.scale.set(0.157, 0.157, 0.157)
      m.position.copy(new Vector3(0,1.7,0))
      m.setRotationFromEuler(new Euler(0.25,0.00,0.01))
      webglApp.scene.add(m)
      canAttachTransformControl.push(m)
    })

  webglApp.animate()

  webglApp.attachTransformOnClick(canAttachTransformControl)

  createGUI()
}

function guiPositionAnimateCb(m, zoffset) {
  zoffset |= 0
  return () => {
    m.setRotationFromEuler(new THREE.Euler(params.rx / RAD2DEG, params.ry / RAD2DEG, params.rz / RAD2DEG))
    m.position.set(params.tx, params.ty, params.tz + zoffset)
  }
}

function createGUI() {
  // var q = new Quaternion(-0.44389683,0.5598062,0.5267938,-0.46050537)

  params = {
    pointsize: 0.005,
    plys_speed: 3,
    plys_loading: 0,
    rx: speaking1Euler.x * RAD2DEG,
    ry: speaking1Euler.y * RAD2DEG,
    rz: speaking1Euler.z * RAD2DEG,
    tx: speaking1Pos.x,
    ty: speaking1Pos.y,
    tz: speaking1Pos.z
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

async function addRemyMeshTexture() {
  var m = await loadDepth16BinMeshTexture(folder + '/00000601_depth16.bin',
    folder + '/00000601_image.jpg')
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

export function generateRgbdUrls(folder, idmin, idmax) {
  var urls = []
  var count = idmax - idmin
  if (count <= 0) throw 'No images, wrong min/max'
  for (let id = idmin, i = 0; id < idmax; id++, i++) {
    var idStr = idPad(id)
    urls.push({
        depth: folder + '/' + idStr + '_depth16.bin',
        rgb: folder + '/' + idStr + '_image.jpg?a'
      })
  }
  return urls
}

async function addRemyAndAnimation() {
  var loadingCallback = (percent) => params.plys_loading = Math.round(percent * 100)
  var urls = generateRgbdUrls(folder2, 3738, 3741) //3771)
  var objs3d = await loadDepth16BinList(urls, loadingCallback)
  let m = new THREE.Group()
  m.setRotationFromEuler(new Euler(2.95,1.02,1.73))
  m.position.copy(new Vector3(-1.155,1.248,0.044))
  var animateCb = dirtyAnimationAnimeCallbackViaGroup(m, objs3d)
  return { m, animateCb }
}

async function addCubeWithTexture() {
  loadObj(
    '/rgbd-viewer/cubeWithTexture/cube.obj',
    '/rgbd-viewer/cubeWithTexture/cubetxt.mtl')
    .then(m => {
      webglApp.scene.add(m)
    })
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
    if (frame % params.plys_speed === 0) {
      if (objIdx === g.children.length) objIdx = 0
      g.children.forEach(m => m.visible = false)
      g.children[objIdx].visible = true
      objIdx++
    }
  }
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
      // obj.material = objs[objIdx].material
    }
  }
}

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

function createFloor() {
  var geo = new THREE.PlaneBufferGeometry(3, 3)
  var mat = new THREE.MeshBasicMaterial({ color: 0x777777, side: THREE.DoubleSide })
  var plane = new THREE.Mesh(geo, mat)
  plane.rotation.x = 90/RAD2DEG
  return plane
}

window.main = init



