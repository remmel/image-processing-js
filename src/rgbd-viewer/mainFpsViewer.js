import * as THREE from 'three'
import { Euler, Vector3 } from 'three'
import WebGlApp from '../WebGlApp'
import { loadDepth16BinMeshTexture, loadDepth16BinPointsResize } from './RgbdLoader'
import { RAD2DEG } from '../pose-viewer/utils3d'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { loadObj } from './LoadersHelper'
import { GameFps } from '../commons/fps/GameFps'
import { loadSceneCocina, loadSceneApartof, sp1 as sp1 } from '../commons/demoscenes'
import { addElement } from '../commons/domUtils'

//to add label GUI: https://threejs.org/examples/#webgl_instancing_performance
//https://discourse.threejs.org/t/how-to-draw-3d-graphics-on-google-map/3796/4

var sp1Folder = sp1.folder
var sp1Euler = new Euler(-91/RAD2DEG, -103/RAD2DEG, 176/RAD2DEG)
var sp1Pos = new Vector3(1.2, 1.4, 0)
var sp1UrlDepth = sp1Folder + '/00000601_depth16.bin', sp1UrlRgb = sp1Folder + '/00000601_image.jpg'

var folderCoucoustoolhires = 'dataset/2021-03-09_205154_coucoustoolhires'
var folderDance = 'dataset/2021-03-16_191017_dance'
var folderKinect = 'dataset/kinect'

var webglApp
var params = {}

var loadingHtml = `
  <span style='position: absolute;
    text-align: center;
    top: 10px;
    width: 100%;
    user-select: none;'>
      Loading...
  </span>
`

var scenesHtml = `
  <div style='position: absolute;
    top: 5px; 
    right: 5px;'>
      <select onchange='document.location="?scene="+this.value'>
          <option>- Scene -</option>
          <option>apartof</option>
          <option>cocina</option>
      </select>
  </div>
`

export async function initFpsViewer() {
  webglApp = new WebGlApp()
  var gameFps = null //dumb gameFps

  var elLoading = addElement(loadingHtml)

  /** @param percentage {Number} : float between 0-1 included */
  function onProgress(percentage) {
    elLoading.innerText = percentage === 1 ? '' : 'Loading ' + Math.round(percentage * 100) + '%'
  }

  var elScene = addElement(scenesHtml)

  switch (getMode()) {
    case MODE.FPS:
      gameFps = new GameFps(webglApp.camera, webglApp.renderer.domElement)
      webglApp.animateAdd(delta => gameFps.update(delta))
      break
    case MODE.EDITOR:
      webglApp.enableOrbitControls()
      webglApp.scene.add(new THREE.GridHelper(20, 20))
      break
    case MODE.VR:
      webglApp.enableVr()
  }

  switch (getScene()) {
    case "cocina":
      loadSceneCocina(webglApp, gameFps, onProgress)
      break
    case "apartof":
      loadSceneApartof(webglApp, gameFps, onProgress)
      break
  }


  // var folderCloseup = 'https://www.kustgame.com/ftp/closeup'
  // loadDepth16BinMeshTexture(folderCloseup + '/00000294_depth16.bin', folderCloseup + '/00000294_image.jpg').then(m => {
  //   webglApp.scene.add(m)
  //   m.setRotationFromEuler(new Euler(1.25,1.33,-2.86))
  //   m.position.copy(new Vector3(-0.153,1.600,0.006))
  //   webglApp.canTransformControl(m)
  // })

  // var folderTum = 'rgbd-viewer/tum'
  // loadTumPng(folderTum + "/1305031464.115837.png", folderTum + "/1305031464.127681.png").then(m=> {
  // loadTumPng(folderKinect + "/depth.png", folderKinect + "/rgb.jpg").then(m=> {
  //   m.rotateX(180/RAD2DEG)
  //   m.position.y = 1.5
  //   webglApp.scene.add(m)
  // })

  // var folderKinectVsHonor = "dataset/kinect/closeup_kinectvshonor20view/"
  // loadDepth16BinMeshTexture(folderKinectVsHonor + "/00000019_depth.png", folderKinectVsHonor + "/00000019_image.jpg", KINECT_INTRINSICS).then(m => {
  //   webglApp.scene.add(m)
  //   // m.rotateX(180/RAD2DEG)
  //   // m.position.y = 1.5
  //   m.position.copy(new Vector3(-0.356,1.500,0.399))
  //   m.setRotationFromEuler(new Euler(3.14,0.00,0.00))
  //   // webglApp.canTransformControl(m)
  //
  //   // setTimeout(() => exportGltf(webglApp.scene), 2000)
  // })
  // var txtKinect = await createText('Kinect 360')
  // txtKinect.position.copy(new Vector3(-0.729,1.043,-0.308))
  // webglApp.scene.add(txtKinect)
  // // webglApp.canTransformControl(txtKinect)
  //
  //
  // loadDepth16BinMeshTexture(folderKinectVsHonor + "/00001254_depth16.bin", folderKinectVsHonor + "/00001254_image.jpg").then(m => {
  //   webglApp.scene.add(m)
  //   // m.rotateX(180/RAD2DEG)
  //   // m.position.y = 1.5
  //   m.position.copy(new Vector3(-0.468,1.408,-0.123))
  //   m.setRotationFromEuler(new Euler(-0.09,1.36,-1.53))
  //   // webglApp.canTransformControl(m)
  //
  //   // setTimeout(() => exportGltf(webglApp.scene), 2000)
  // })

  // var txtHonor = await createText('Honor View 20')
  // txtHonor.position.copy(new Vector3(0.000,1.056,-0.341))
  // txtHonor.setRotationFromEuler(new Euler(1.49,-1.55,1.49))
  // webglApp.scene.add(txtHonor)
  // webglApp.canTransformControl(txtHonor)


  // loadObj(cocinaObj.obj, cocinaObj.mtl, e => console.log(e)).then(m => {
  //   m.scale.set(0.157, 0.157, 0.157)
  //   m.rotation.x = 15 * 3.14 / 180
  //   m.position.y = 1.69
  //
  //   //     m.position.copy(new Vector3(0,1.7,0))
  //   //     m.setRotationFromEuler(new Euler(0.25,0.00,0.01))
  //   webglApp.scene.add(m)
  // })

  var folder = 'dataset/20210318_160008.obj'
  // loadObj(folder + '/20210318_160008.obj', folder + '/1616079453433.mtl', e => console.log(e)).then(m => {
  //   //     m.position.copy(new Vector3(0,1.7,0))
  //   //     m.setRotationFromEuler(new Euler(0.25,0.00,0.01))
  //   console.log('obj', m)
  //   webglApp.scene.add(m)
  //   // gameFps.canCollide(m)
  // })





  // loadDepth16BinPointsResize(sp1UrlDepth, sp1UrlRgb).then(m => {
  //   webglApp.scene.add(m)
  //   m.setRotationFromEuler(sp1Euler)
  //   m.position.copy(sp1Pos)
  //   m.position.z += 4
  //   webglApp.canTransformControl(m)
  // })
  //
  // loadDepth16BinMesh(sp1UrlDepth, sp1UrlRgb).then(m => {
  //   webglApp.scene.add(m)
  //   m.setRotationFromEuler(sp1Euler)
  //   m.position.copy(sp1Pos)
  //   m.position.z += -2
  //   webglApp.canTransformControl(m)
  // })
  //
  // loadDepth16BinMeshTexture(sp1UrlDepth, sp1UrlRgb).then(m => {
  //   webglApp.scene.add(m)
  //   m.setRotationFromEuler(sp1Euler)
  //   m.position.copy(sp1Pos)
  //   m.position.z += 2
  //   webglApp.canTransformControl(m)
  // })
  //
  // loadObj(
  //   '/rgbd-viewer/cubeWithTexture/cube.obj',
  //   '/rgbd-viewer/cubeWithTexture/cubetxt.mtl')
  //   .then(m => {
  //     m.scale.set(0.2,0.2,0.2)
  //     webglApp.scene.add(m)
  //     webglApp.canTransformControl(m)
  //   })

  // var urls = generateRgbdUrls(folderDance, 3738, 3771)
  // var onProgress = (percent) => params.plys_loading = Math.round(percent * 100)
  // loadRgbdAnim(urls, onProgress).then(({ m, animateCb }) => {
  //   webglApp.scene.add(m)
  //   m.setRotationFromEuler(new Euler(0.26,-1.32,-1.37))
  //   m.position.copy(new Vector3(.325,1.286,-0.423))
  //   webglApp.animateAdd(animateCb)
  //   webglApp.canTransformControl(m)
  // })

  // var urls = generateRgbdUrls(sp1.folder, 512, 601)
  // loadRgbdAnim(urls).then(({ m, animateCb }) => {
  //   webglApp.scene.add(m)
  //   m.setRotationFromEuler(new Euler(1.95,-1.36,0.31))
  //   m.position.copy(new Vector3(1.111,1.329,0.113))
  //   webglApp.animateAdd(animateCb)
  //   webglApp.canTransformControl(m)
  // })

  // webglApp.scene.add(createFloor())
  webglApp.scene.add(new THREE.AmbientLight(0xFFFFFF, 1)) //to render exactly the texture (photogrammetry)

  webglApp.animate()
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

const MODE = {
  FPS : "fps",
  EDITOR: "editor",
  VR: "vr"
}

function getMode() {
  return new URLSearchParams(window.location.search).get("mode") || MODE.FPS
}

function getScene() {
  return new URLSearchParams(window.location.search).get("scene") || "apartof"
}
