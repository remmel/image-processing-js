import { RAD2DEG } from '../pose-viewer/utils3d'
import * as THREE from 'three'
import { Euler, Quaternion, Vector3 } from 'three'
import WebGlApp from '../WebGlApp'
import { closeup, standupbrown } from '../commons/demoscenes'
import { createText } from './FontHelper'
import {
  loadDepth16BinPoints,
  loadDepth16BinPointsWithRGBDSameSize,
  loadTumPng,
} from '../commons/rgbd/RgbdPointsLoader'
import { loadPCD, loadPLYPoints } from './LoadersHelper'
import { KINECT_INTRINSICS } from '../pose-viewer/datasetsloader/rgbdtum'
import { loadDepth16BinMesh } from '../commons/rgbd/RgbdMeshLoader'
import { generateRgbdUrls, loadRgbdAnim, TYPE } from '../commons/rgbd/RgbdAnimLoader'
import { loadDepth16BinMeshTexture, RgbdVideo2 } from '../commons/rgbd/RgbdVideo2'
import { RgbdVideoHue } from '../commons/rgbd/RgbdVideoHue'
import { RgbdVideoVFR } from '../commons/rgbd/RgbdVideoVFR'

/**
 * This is a debug script, to test different object types
 */
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
  //   var m = await loadDepth16BinPointsWithRGBDSameSize('rgbd-viewer/tum/1305031464.115837.png', 'rgbd-viewer/tum/1305031464.127681.png', KINECT_INTRINSICS)
  //   m.setRotationFromQuaternion(new Quaternion(0.9049, -0.1485, 0.1165, -0.3816))
  //   m.rotateY(180 / RAD2DEG)
  //   webglApp.scene.add(m)
  // }
  // {
  //   //https://github.com/remmel/hms-AREngine-demo (my office wardrobe)
  //   var m = await loadDepth16BinPoints('rgbd-viewer/arengine-recorder/00000070_depth16.bin',
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
  // loadDepth16BinPoints(closeup.depth, closeup.rgb).then(m => {
  //   webglApp.scene.add(m)
  //   m.position.copy(closeupPosition.clone().add(new Vector3(0, 0, .5)))
  //   m.setRotationFromEuler(closeupRotation)
  //   // webglApp.canTransformControl(m)
  //   var t = createText('Points')
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
  //   var t = createText('Mesh')
  //   t.position.copy(txtPosition.clone().add(new Vector3(0, 0, 1)))
  //   t.setRotationFromEuler(txtRotation)
  //   webglApp.scene.add(t)
  // })

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


  // compare static mesh vs video mesh
  var localstandupbrown6 = 'rgbd-viewer/standupbrown6'
  // var localstandupbrown6 = 'dataset/2021-04-12_190518_standupbrown6'

  // {
  //   loadDepth16BinMesh(localstandupbrown6 + '/00000354_depth16.bin', localstandupbrown6 + '/00000354_image.jpg').then(m => {
  //     // m.rotateZ(-90 / RAD2DEG)
  //     // m.position.set(0.551,0.000,0.000)
  //     // m.rotation.set(-3.14,-0.01,1.57)
  //     m.rotateX(180/RAD2DEG)
  //     m.position.set(0.000,0.248,0.000)
  //     webglApp.scene.add(m)
  //     webglApp.canTransformControl(m)
  //     webglApp.canTransform.attachTransformControl(m)
  //   })
  // }
  //
  // {
  //   var fn = 'output_rgbd_1440x1080.mp4'
  //   // var fn = '00000354_rgbd.png'
  //   var rgbdVideo = new RgbdVideo('dataset/2021-04-12_190518_standupbrown6/output/output_rgbd_1440x1080_crf20.mp4')//localstandupbrown6 + '/' + fn)
  //   webglApp.scene.add(rgbdVideo)
  //   // rgbdVideo.position.copy(standupbrowPos.clone().add(new Vector3(0, 0, -1)))
  //   // rgbdVideo.setRotationFromEuler(standupbrownEuler)
  //   // rgbdVideo.rotateZ(-90 / RAD2DEG)
  // }

  {
    // var folder = 'dataset/vidaud/2021-06-28_144242'
    var folder = 'https://www.kustgame.com/ftp/vidaud/2021-06-28_144242'

    // const geometry = new THREE.BoxGeometry(1.7, 1, 1.2) //red,green,blue
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
    // const clippingBox = new THREE.Mesh(geometry, material)
    // clippingBox.position.set(0.070, 0.158, 1.702) //box relative to depth

    //TODO put clipping box in Video class
    let clippingBoxWorld; //world rotation, position relative to video, the rotation is local to video, then the box won't fit the person.
    // As the person does't stand verticually locally
    {
      const geometry = new THREE.BoxGeometry() //(0.7, 1.85, 1)
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
      clippingBoxWorld = new THREE.Mesh(geometry, material)
      clippingBoxWorld.position.set(1.584,-0.582,-0.204)
      clippingBoxWorld.scale.set(0.663,1.787,1.082)
      //to display and move the box
      webglApp.scene.add(clippingBoxWorld)
      webglApp.canTransformControl(clippingBoxWorld)
    }

    var rgbdVideo = new RgbdVideoVFR(folder, clippingBoxWorld)
    webglApp.canTransformControl(rgbdVideo)
    // rgbdVideo.position.set(0,0,0.3)
    webglApp.scene.add(rgbdVideo)
    webglApp.animateAdd(delta => rgbdVideo.update(delta))
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

