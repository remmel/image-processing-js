import { loadPCD, loadPLYPoints } from './LoadersHelper'
import { convertGrayscale } from './opencvtest'
import {
  loadDepth16BinMesh,
  loadDepth16BinMeshTexture,
  loadDepth16BinPoints,
  loadDepth16BinPointsResize,
  loadDepthChae, loadDepthCustom,
  loadDepthGoat,
  loadTumPng,
} from './RgbdLoader.js'
import { RAD2DEG } from '../pose-viewer/utils3d'
import * as THREE from 'three'
import { Euler, Quaternion, Vector3 } from 'three'
import WebGlApp from '../WebGlApp'
import { closeup, standupbrown } from '../commons/demoscenes'
import { createText } from './FontHelper'
import { RgbdVideo } from './RgbdVideo'
import { generateRgbdUrls, loadRgbdAnim, TYPE } from './RgbdAnimLoader'

export async function initRgbdViewer() {
  // convertGrayscale('original', 'grayscale')

  var webglApp = new WebGlApp(document.body)
  webglApp.enableOrbitControls()
  webglApp.scene.add(new THREE.AmbientLight(0xFFFFFF, 1)) //to render exactly the texture (photogrammetry)
  webglApp.animate()

  // {
  //   // PCDFormat
  //   var m = await loadPCD('https://threejs.org/examples/models/pcd/binary/Zaghetto.pcd')
  //   m.rotateX(180 / RAD2DEG)
  //   webglApp.scene.add(m)
  // }
  // {
  //   //point cloud ply without faces (Lesly room)
  //   var m = await loadPLYPoints('https://raw.githubusercontent.com/remmel/recorder-3d/master/Recorder3D/src/test/resources/00000012.ply')
  //   m.setRotationFromQuaternion(new Quaternion(0.019091055, 0.96770465, 0.2512833, 0.0045607537))
  //   m.rotateX(180 / RAD2DEG)
  //   m.position.setX(-2)
  //   webglApp.scene.add(m)
  // }
  // {
  //   //rgbd_dataset_freiburg1_desk
  //   var m = await loadTumPng('rgbd-viewer/tum/1305031464.115837.png', 'rgbd-viewer/tum/1305031464.127681.png')
  //   m.setRotationFromQuaternion(new Quaternion(0.9049, -0.1485, 0.1165, -0.3816))
  //   m.rotateY(180 / RAD2DEG)
  //   webglApp.scene.add(m)
  // }
  // {
  //   //https://github.com/remmel/hms-AREngine-demo (my office wardrobe)
  //   var m = await loadDepth16BinPointsResize('rgbd-viewer/arengine-recorder/00000070_depth16.bin',
  //     'rgbd-viewer/arengine-recorder/00000070_image.jpg')
  //   var q = new Quaternion(0.020149395, 0.99818397, 0.05096002, -0.025030866)
  //   q.multiply(new Quaternion(1, 0, 0, 0))
  //   m.setRotationFromQuaternion(q)
  //   m.rotateY(180 / RAD2DEG) //to avoid having it mixed with the other points cloud
  //   webglApp.scene.add(m)
  // }
  //
  // var closeupPosition = new Vector3(-0.153, 1.600, 0.006)
  // var closeupRotation = new Euler(1.25, 1.33, -2.86)
  //
  //
  // var txtPosition = new Vector3(0.190, 1.146, -0.206)
  // var txtRotation = new Euler(-1.87, -1.46, -1.88)
  //
  // loadDepth16BinPointsResize(closeup.depth, closeup.rgb).then(m => {
  //   webglApp.scene.add(m)
  //   m.position.copy(closeupPosition)
  //   m.setRotationFromEuler(closeupRotation)
  //   // webglApp.canTransformControl(m)
  //
  //   var t = createText('Points 180x140')
  //   t.position.copy(txtPosition)
  //   t.setRotationFromEuler(txtRotation)
  //   webglApp.canTransformControl(t)
  //   webglApp.scene.add(t)
  // })
  //
  // loadDepth16BinPoints(closeup.depth, closeup.rgb).then(m => {
  //   webglApp.scene.add(m)
  //   m.position.copy(closeupPosition.clone().add(new Vector3(0, 0, .5)))
  //   m.setRotationFromEuler(closeupRotation)
  //   // webglApp.canTransformControl(m)
  //   var t = createText('Points 1440x1080')
  //   t.position.copy(txtPosition.clone().add(new Vector3(0, 0, .5)))
  //   t.setRotationFromEuler(txtRotation)
  //   webglApp.scene.add(t)
  // })
  //
  // loadDepth16BinMesh(closeup.depth, closeup.rgb).then(m => {
  //   webglApp.scene.add(m)
  //   m.position.copy(closeupPosition.clone().add(new Vector3(0, 0, 1)))
  //   m.setRotationFromEuler(closeupRotation)
  //   // webglApp.canTransformControl(m)
  //   var t = createText('Mesh Colors Triangles')
  //   t.position.copy(txtPosition.clone().add(new Vector3(0, 0, 1)))
  //   t.setRotationFromEuler(txtRotation)
  //   webglApp.scene.add(t)
  // })
  //
  // loadDepth16BinMeshTexture(closeup.depth, closeup.rgb).then(m => {
  //   webglApp.scene.add(m)
  //   m.position.copy(closeupPosition.clone().add(new Vector3(0, 0, 1.5)))
  //   m.setRotationFromEuler(closeupRotation)
  //   var t = createText('Mesh Texture UV')
  //   t.position.copy(txtPosition.clone().add(new Vector3(0, 0, 1.5)))
  //   t.setRotationFromEuler(txtRotation)
  //   webglApp.scene.add(t)
  //   // webglApp.canTransformControl(m)
  // })
  //
  // loadDepthChae('rgbd-viewer/Chae_Demo_Upres.png').then(m => {
  //   // m.rotateZ(90/RAD2DEG)
  //   webglApp.scene.add(m)
  // })
  //
  // loadDepthGoat('rgbd-viewer/record3d_goat.png').then(m => {
  //   webglApp.scene.add(m)
  // })
  //
  // loadDepthCustom('rgbd-viewer/all.png').then(m => {
  //   webglApp.scene.add(m)
  // })

  var standupbrownEuler = new Euler(2.57, 0.90, 2.04)
  var standupbrowPos = new Vector3(-1.102, 1.601, 0.301)

  // {
  //   var urls = generateRgbdUrls(standupbrown, 354, 354+1)
  //   loadRgbdAnim(urls, () => {}, TYPE.DIRTY).then(({ m, animateCb }) => { //2 onProgress not handled
  //     webglApp.scene.add(m)
  //     m.position.copy(standupbrowPos)
  //     m.setRotationFromEuler(standupbrownEuler)
  //     webglApp.animateAdd(animateCb)
  //     // webglApp.canTransformControl(m)
  //   })
  // }

  var localstandupbrown6 = 'dataset/2021-04-12_190518_standupbrown6'

  {
    loadDepth16BinMeshTexture(localstandupbrown6 + '/00000354_depth16.bin', localstandupbrown6 + '/00000354_image.jpg').then(m => {
      // m.rotateZ(-90 / RAD2DEG)
      m.position.set(0.551,0.000,0.000)
      m.rotation.set(-3.14,-0.01,1.57)
      webglApp.scene.add(m)
      webglApp.canTransformControl(m)
      webglApp.canTransform.attachTransformControl(m)
    })
  }

  {
    var url = 'rgbd-viewer/output_rgbd_1440x1080.mp4'
    // var url = 'rgbd-viewer/Chae_Demo_Upres.mp4'
    // var url = localstandupbrown6 + '/video/output_rgbd_1440x1080_direct_crf20.mp4' //output_rgbd_1440x1080.mp4' //output_rgbd_240x180.mp4
    var rgbdVideo = new RgbdVideo(url)
    webglApp.scene.add(rgbdVideo.mesh)
    // rgbdVideo.mesh.position.copy(standupbrowPos.clone().add(new Vector3(0, 0, -1)))
    // rgbdVideo.mesh.setRotationFromEuler(standupbrownEuler)
    rgbdVideo.mesh.rotateZ(-90 / RAD2DEG)
  }

  createZoom()
}

function createZoom() {
  var zoom = document.getElementById('zoom')
  Object.values(document.querySelectorAll('.gui canvas')).forEach(item => {
    item.addEventListener('mousemove', function(event) {
      var wRatio = event.target.width / event.target.getBoundingClientRect().width //if the image is resized in css
      var hRatio = event.target.height / event.target.getBoundingClientRect().height
      var x = event.layerX * wRatio
      var y = event.layerY * hRatio
      var ctx = this.getContext('2d')
      var pixel = ctx.getImageData(x, y, 1, 1)
      var data = pixel.data
      var rgba = 'rgba(' + data[0] + ', ' + data[1] + ', ' + data[2] + ', ' + (data[3] / 255) + ')'
      zoom.style.background = rgba
      zoom.textContent = rgba + ' [' + x + ',' + y + ']'
    })
  })
}

