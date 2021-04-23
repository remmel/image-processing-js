import { loadGltf, loadObj } from '../rgbd-viewer/LoadersHelper'
import * as THREE from 'three'
import { Euler, Group, Vector3 } from 'three'
import { generateRgbdUrls, loadRgbdAnim, TYPE } from './rgbd/RgbdAnimLoader'
import { createPhoto360 } from '../rgbd-viewer/Sphere360'
import { Reflector } from 'three/examples/jsm/objects/Reflector'
import { RAD2DEG } from '../pose-viewer/utils3d'
import { loadDepth16BinMesh } from './rgbd/RgbdMeshLoader'
import { idPad } from '../pose-viewer/utils'
import { loadDepth16BinPoints } from './rgbd/RgbdPointsLoader'

//online dataset urls
export var sp1 = {
  folder: 'https://www.kustgame.com/ftp/2021-02-26_210438_speaking1',
}

export var coucoustool = {
  folder: 'https://www.kustgame.com/ftp/2021-03-09_205622_coucoustool',
}

// export var standupbrown = 'dataset/2021-04-12_190518_standupbrown6'
export var standupbrown = 'https://www.kustgame.com/ftp/2021-04-12_190518_standupbrown6'

export var cocinaObj = {
  obj: 'https://www.kustgame.com/ftp/cocina/depthmaps-lowlowalignhighest.obj',
  mtl: 'https://www.kustgame.com/ftp/cocina/depthmaps-lowlowalignhighest.mtl'
}

export function createRgbdUrls(folder, id) {
  id = Number.isInteger(id) ? idPad(id) : id
  return {
    depth: folder + '/' + id + '_depth16.bin',
    rgb: folder + '/' + id + '_image.jpg',
  }
}

var folderCloseup = 'https://www.kustgame.com/ftp/closeup'
export var closeup = {
  folder: folderCloseup,
  ...createRgbdUrls(folderCloseup, 294),
  position: new Vector3(-0.153, 1.600, 0.006),
  rotation: new Euler(1.25, 1.33, -2.86)
}

//dataset/20210318_160008.obj/glb/rework.gltf
// export var appartof = 'dataset/20210318_160008.obj_apartof/rework/apartof.glb'
export var apartof = 'https://www.kustgame.com/ftp/20210318_160008_apartof/apartof.glb'

//dataset/CV60/PIC_20210318_181124.jpg
export var appartmyroom360 = 'https://www.kustgame.com/ftp/photovid360/PIC_20210318_181124.jpg'

//TODO use userData.collide = true
var DUMB_GAMEFPS = {canCollide: () => {}}

export function loadSceneCocina(webglApp, gameFps, onProgress){
  gameFps = gameFps || DUMB_GAMEFPS
  {
    var geo = new THREE.PlaneBufferGeometry(15, 15, 8, 8)
    var mat = new THREE.MeshBasicMaterial({ color: 0x777777 })
    var floor = new THREE.Mesh(geo, mat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.1
    webglApp.scene.add(floor)
    gameFps.canCollide(floor)
  }

  loadObj(cocinaObj.obj, cocinaObj.mtl, onProgress)
    .then(m => {
      m.scale.set(0.157, 0.157, 0.157)
      m.rotation.x = 15 * 3.14 / 180
      m.position.y = 1.69
      //     m.position.copy(new Vector3(0,1.7,0))
      //     m.setRotationFromEuler(new Euler(0.25,0.00,0.01))
      webglApp.scene.add(m)
    })

  var urls = generateRgbdUrls(coucoustool.folder, 1472, 1550)
  loadRgbdAnim(urls, onProgress).then(({m, animateCb}) => { //2 onProgress not handled
    webglApp.scene.add(m)
    m.setRotationFromEuler(new Euler(2.42, 0.64, 2.12))
    m.position.copy(new Vector3(-0.378, 1.363, -0.277))
    webglApp.animateAdd(animateCb)
  })
}

export function loadSceneApartof(webglApp, gameFps, onProgress) {
  gameFps = gameFps || DUMB_GAMEFPS

  {
    var geo = new THREE.PlaneBufferGeometry(5, 5, 8, 8)
    var mat = new THREE.MeshBasicMaterial({ color: 0x777777 })
    var floor = new THREE.Mesh(geo, mat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.1
    webglApp.scene.add(floor)
    gameFps.canCollide(floor)
  }

  {
    loadGltf(apartof, onProgress).then(g => {
      var visibles = new Group()
      var colliders = new Group()

      var children = [...g.children] //must copy list, it seems that when adding in remove move in others

      var matGray = new THREE.MeshBasicMaterial({ color: 0xdedede })
      children.forEach(m => {
        if (m.name.startsWith('Plane')) {//MeshStandardMaterial
          colliders.add(m)
          //create other side
          m.material = matGray
          var m2 = m.clone()
          m2.rotateX(Math.PI)
          m2.material = matGray
          colliders.add(m2)
        } else if (m.name.startsWith('Mirror')) {
          //   visibles.add(m)
          var geometry = new THREE.PlaneGeometry(1, 1)
          var reflector = new Reflector(geometry, {
            color: 0x889999,
          })
          reflector.scale.set(m.scale.x, m.scale.z, m.scale.y)
          reflector.position.copy(m.position)
          // var rotation = m.rotation.applyEuler(new Euler(90, 0, 0))
          reflector.rotation.copy(m.rotation)
          reflector.rotateX(-90 / RAD2DEG)
          visibles.add(reflector)
        } else {
          visibles.add(m)
        }
      })
      webglApp.scene.add(visibles)
      gameFps.canCollide(colliders)
      webglApp.scene.add(colliders)
    })
  }

  {
    var m = createPhoto360(appartmyroom360)
    m.setRotationFromEuler(new Euler(-0.36,1.45,0.25))
    // webglApp.canTransformControl(m)
    webglApp.scene.add(m)
  }

  {
    var urls = generateRgbdUrls(standupbrown, 354, 354+54, 3)
    loadRgbdAnim(urls, onProgress, TYPE.BOOMERANG).then(({m, animateCb}) => { //2 onProgress not handled
      webglApp.scene.add(m)
      m.position.copy(new Vector3(0.760,1.656,-2.914))
      m.setRotationFromEuler(new Euler(2.57,0.90,2.04))
      webglApp.animateAdd(animateCb)
      webglApp.canTransformControl(m)
    })
  }
}

export function loadAnimTest(webglApp, gameFps, onProgress) {
  gameFps = gameFps || DUMB_GAMEFPS

  {
    var geo = new THREE.PlaneBufferGeometry(5, 5, 8, 8)
    var mat = new THREE.MeshBasicMaterial({ color: 0x777777 })
    var floor = new THREE.Mesh(geo, mat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.1
    webglApp.scene.add(floor)
    gameFps.canCollide(floor)
  }

  {

  }
}

export function loadRgbdImg(webglApp, gameFps, onProgress) {
  loadDepth16BinMesh(closeup.depth, closeup.rgb).then(m => {
    webglApp.scene.add(m)
    m.setRotationFromEuler(closeup.rotation)
    m.position.copy(closeup.position)
    webglApp.canTransformControl(m)
  })

  loadDepth16BinPoints(closeup.depth, closeup.rgb).then(m => {
    webglApp.scene.add(m)
    m.setRotationFromEuler(closeup.rotation)
    m.position.copy(closeup.position)
    m.position.x += 1
    webglApp.canTransformControl(m)
  })
}


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


// var folderTum = 'rgbd-viewer/tum'
// loadTumPng(folderTum + '/1305031464.115837.png', folderTum + '/1305031464.127681.png').then(m => {
//   // loadTumPng(folderKinect + '/depth.png', folderKinect + '/rgb.jpg').then(m => {
//   m.rotateX(180 / RAD2DEG)
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


// var txtHonor = await createText('Honor View 20')
// txtHonor.position.copy(new Vector3(0.000,1.056,-0.341))
// txtHonor.setRotationFromEuler(new Euler(1.49,-1.55,1.49))
// webglApp.scene.add(txtHonor)
// webglApp.canTransformControl(txtHonor)

// var folder = 'dataset/20210318_160008.obj'
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


// async function addRemyPointsResize() {
//   var m = await loadDepth16BinPointsResize(sp1Folder + '/00000601_depth16.bin', sp1Folder + '/00000601_image.jpg')
//   // var q = new Quaternion(-0.44389683,0.5598062,0.5267938,-0.46050537)
//   // m.setRotationFromQuaternion(q)
//   // m.position.set(-2.3739648,0.06929223,-0.19393142)
//   m.setRotationFromEuler(new THREE.Euler(params.rx / RAD2DEG, params.ry / RAD2DEG, params.rz / RAD2DEG))
//   m.position.set(params.tx, params.ty, params.tz + 2)
//   return m
// }
//
// async function addRemyMeshTexture() {
//   var m = await loadDepth16BinMeshTexture(sp1Folder + '/00000601_depth16.bin',
//     sp1Folder + '/00000601_image.jpg')
//   return m
// }
//
// async function addHorse() {
//   var gltf = await new GLTFLoader().loadAsync('https://threejs.org/examples/models/gltf/Horse.glb')
//   var mesh = gltf.scene.children[0]
//   mesh.scale.set(0.01, 0.01, 0.01)
//   window.MESH = mesh
//   window.GLTF = gltf
//   var mixer = new THREE.AnimationMixer(mesh)
//   mixer.clipAction(gltf.animations[0]).setDuration(1).play()
//   return {mesh, mixer}
// }
//
//
// async function addCubeWithTexture() {
//   loadObj(
//     '/rgbd-viewer/cubeWithTexture/cube.obj',
//     '/rgbd-viewer/cubeWithTexture/cubetxt.mtl')
//     .then(m => {
//       webglApp.scene.add(m)
//     })
// }

// var sp1Folder = sp1.folder
// var sp1Euler = new Euler(-91/RAD2DEG, -103/RAD2DEG, 176/RAD2DEG)
// var sp1Pos = new Vector3(1.2, 1.4, 0)
// var sp1UrlDepth = sp1Folder + '/00000601_depth16.bin', sp1UrlRgb = sp1Folder + '/00000601_image.jpg'
//
// var folderCoucoustoolhires = 'dataset/2021-03-09_205154_coucoustoolhires'
// var folderDance = 'dataset/2021-03-16_191017_dance'
// var folderKinect = 'dataset/kinect'
