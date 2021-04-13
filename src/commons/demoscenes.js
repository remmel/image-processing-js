import { loadGltf, loadObj } from '../rgbd-viewer/LoadersHelper'
import { Euler, Group, Vector3 } from 'three'
import * as THREE from 'three'
import { generateRgbdUrls, loadRgbdAnim, TYPE } from '../rgbd-viewer/RgbdAnimLoader'
import { createPhoto360 } from '../rgbd-viewer/Sphere360'
import { Reflector } from 'three/examples/jsm/objects/Reflector'
import { RAD2DEG } from '../pose-viewer/utils3d'

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
  return {
    depth: folder + '/' + id + '_depth16.bin',
    rgb: folder + '/' + id + '_image.jpg',
  }
}

export var closeup = {
  folder: 'https://www.kustgame.com/ftp/closeup'
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
      m.position.copy(new Vector3(0.821,1.755,-2.943))
      m.setRotationFromEuler(new Euler(2.45,0.90,2.04))
      webglApp.animateAdd(animateCb)
      // webglApp.canTransformControl(m)
    })
  }
}
