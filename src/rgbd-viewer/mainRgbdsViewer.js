import * as THREE from 'three'
import {Euler, Vector3} from 'three'
import WebGlApp from '../WebGlApp'
import {loadDepth16BinMesh, loadDepth16BinMeshTexture, loadDepth16BinPointsResize,} from './RgbdLoader'
import {GUI} from 'three/examples/jsm/libs/dat.gui.module'
import {RAD2DEG} from '../pose-viewer/utils3d'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import {loadObj} from './LoadersHelper'
import {createPhoto360, createVideo360} from "./Sphere360";
import {generateRgbdUrls, loadRgbdAnim} from "./RgbdAnimLoader";

//to add label GUI: https://threejs.org/examples/#webgl_instancing_performance

// var folder = 'dataset/2021-02-26_210438_speaking1'
var sp1Folder = 'https://www.kustgame.com/ftp/2021-02-26_210438_speaking1'
var sp1Euler = new Euler(-91/RAD2DEG, -103/RAD2DEG, 176/RAD2DEG)
var sp1Pos = new Vector3(1.2, 1.4, 0)
var sp1UrlDepth = sp1Folder + '/00000601_depth16.bin', sp1UrlRgb = sp1Folder + '/00000601_image.jpg'

var folderCoucoustoolhires = 'dataset/2021-03-09_205154_coucoustoolhires'
var folderDance = 'dataset/2021-03-16_191017_dance'
var folderKinect = 'dataset/kinect'

var webglApp
var params = {}

export async function initRgbdsViewer() {
  webglApp = new WebGlApp()


  var folderCloseup = 'https://www.kustgame.com/ftp/closeup'
  loadDepth16BinMeshTexture(folderCloseup + '/00000294_depth16.bin', folderCloseup + '/00000294_image.jpg').then(m => {
    webglApp.scene.add(m)
    m.setRotationFromEuler(new Euler(1.25,1.33,-2.86))
    m.position.copy(new Vector3(-0.153,1.600,0.006))
    webglApp.canTransformControl(m)
  })

  // var folderTum = 'rgbd-viewer/tum'
  // loadTumPng(folderTum + "/1305031464.115837.png", folderTum + "/1305031464.127681.png").then(m=> {
  // loadTumPng(folderKinect + "/depth.png", folderKinect + "/rgb.jpg").then(m=> {
  //   m.rotateX(180/RAD2DEG)
  //   m.position.y = 1.5
  //   webglApp.scene.add(m)
  // })

  // loadDepth16BinMeshTexture(folderKinect + "/00000021_depth.png", folderKinect + "/00000021_image-0.jpg", KINECT_INTRINSICS).then(m => {
  //   webglApp.scene.add(m)
  //   m.rotateX(180/RAD2DEG)
  //   m.position.y = 1.5
  //   webglApp.canTransformControl(m)
  // })

  loadDepth16BinPointsResize(sp1UrlDepth, sp1UrlRgb).then(m => {
    webglApp.scene.add(m)
    m.setRotationFromEuler(sp1Euler)
    m.position.copy(sp1Pos)
    m.position.z += 4
    webglApp.canTransformControl(m)
  })

  loadDepth16BinMesh(sp1UrlDepth, sp1UrlRgb).then(m => {
    webglApp.scene.add(m)
    m.setRotationFromEuler(sp1Euler)
    m.position.copy(sp1Pos)
    m.position.z += -2
    webglApp.canTransformControl(m)
  })

  loadDepth16BinMeshTexture(sp1UrlDepth, sp1UrlRgb).then(m => {
    webglApp.scene.add(m)
    m.setRotationFromEuler(sp1Euler)
    m.position.copy(sp1Pos)
    m.position.z += 2
    webglApp.canTransformControl(m)
  })

  loadObj(
    '/rgbd-viewer/cubeWithTexture/cube.obj',
    '/rgbd-viewer/cubeWithTexture/cubetxt.mtl')
    .then(m => {
      m.scale.set(0.2,0.2,0.2)
      webglApp.scene.add(m)
      webglApp.canTransformControl(m)
    })

  // var urls = generateRgbdUrls(folderDance, 3738, 3771)
  // var onProgress = (percent) => params.plys_loading = Math.round(percent * 100)
  // loadRgbdAnim(urls, onProgress).then(({ m, animateCb }) => {
  //   webglApp.scene.add(m)
  //   m.setRotationFromEuler(new Euler(0.26,-1.32,-1.37))
  //   m.position.copy(new Vector3(.325,1.286,-0.423))
  //   webglApp.animateAdd(animateCb)
  //   webglApp.canTransformControl(m)
  // })

  var urls = generateRgbdUrls('https://www.kustgame.com/ftp/2021-02-26_210438_speaking1', 512, 601)
  loadRgbdAnim(urls).then(({ m, animateCb }) => {
    webglApp.scene.add(m)
    m.setRotationFromEuler(new Euler(1.95,-1.36,0.31))
    m.position.copy(new Vector3(1.111,1.329,0.113))
    webglApp.animateAdd(animateCb)
    webglApp.canTransformControl(m)
  })

  {
   var mesh = createPhoto360('https://www.kustgame.com/ftp/photovid360/PIC_20210318_180917.jpg')
    webglApp.scene.add( mesh )
  }

  webglApp.scene.add(createFloor())
  webglApp.scene.add(new THREE.AmbientLight(0xFFFFFF, 1)) //to render exactly the texture (photogrammetry)

  webglApp.animate()

  createGUI()
}

function createGUI() {
  // var q = new Quaternion(-0.44389683,0.5598062,0.5267938,-0.46050537)

  params = {
    pointsize: 0.005,
    plys_speed: 3,
    plys_loading: 0,
    rx: sp1Euler.x * RAD2DEG,
    ry: sp1Euler.y * RAD2DEG,
    rz: sp1Euler.z * RAD2DEG,
    tx: sp1Pos.x,
    ty: sp1Pos.y,
    tz: sp1Pos.z
  }

  const gui = new GUI()
  var folder = gui.addFolder('Animation')
  folder.open()
  folder.add(params, 'plys_speed', 1, 50).step(1).name('Speed')
  folder.add(params, 'plys_loading', 0, 100).name('Loading').listen()
}

async function addRemyPointsResize() {
  var m = await loadDepth16BinPointsResize(sp1Folder + '/00000601_depth16.bin', sp1Folder + '/00000601_image.jpg')
  // var q = new Quaternion(-0.44389683,0.5598062,0.5267938,-0.46050537)
  // m.setRotationFromQuaternion(q)
  // m.position.set(-2.3739648,0.06929223,-0.19393142)
  m.setRotationFromEuler(new THREE.Euler(params.rx / RAD2DEG, params.ry / RAD2DEG, params.rz / RAD2DEG))
  m.position.set(params.tx, params.ty, params.tz + 2)
  return m
}

async function addRemyMeshTexture() {
  var m = await loadDepth16BinMeshTexture(sp1Folder + '/00000601_depth16.bin',
    sp1Folder + '/00000601_image.jpg')
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


async function addCubeWithTexture() {
  loadObj(
    '/rgbd-viewer/cubeWithTexture/cube.obj',
    '/rgbd-viewer/cubeWithTexture/cubetxt.mtl')
    .then(m => {
      webglApp.scene.add(m)
    })
}


function createFloor() {
  var geo = new THREE.PlaneBufferGeometry(3, 3)
  var mat = new THREE.MeshBasicMaterial({ color: 0x777777, side: THREE.DoubleSide })
  var plane = new THREE.Mesh(geo, mat)
  plane.rotation.x = 90/RAD2DEG
  return plane
}

export async function initPhoto360() {
  webglApp = new WebGlApp()

  var mesh = createPhoto360('https://www.kustgame.com/ftp/photovid360/PIC_20201231_205333.jpg')
  webglApp.scene.add(mesh)

  webglApp.animate()
}

export async function initVideo360() {
  webglApp = new WebGlApp()

  var mesh = createVideo360("https://www.kustgame.com/ftp/photovid360/PIC_20201231_205342.mp4")
  webglApp.scene.add(mesh)

  webglApp.animate()
}
