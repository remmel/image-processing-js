import { loadObj, loadPCD, loadPLYMesh, loadPLYPoints, loadPLYs } from './LoadersHelper'
import { convertGrayscale } from './opencvtest'
import { loadDepth16BinMeshTexture, loadDepth16BinPointsResize, loadTumPng } from './RgbdLoader.js'
import { RAD2DEG } from '../pose-viewer/utils3d'
import { Euler, Quaternion, Vector3 } from 'three'
import WebGlApp from '../WebGlApp'
import * as THREE from 'three'
import { closeup } from '../commons/consts'

export async function initRgbdViewer() {
  convertGrayscale('original', 'grayscale')

  var webglApp = new WebGlApp(document.body)
  webglApp.enableOrbitControls()
  webglApp.scene.add(new THREE.AmbientLight(0xFFFFFF, 1)) //to render exactly the texture (photogrammetry)
  webglApp.animate()

  {
    // PCDFormat
    var m = await loadPCD('https://threejs.org/examples/models/pcd/binary/Zaghetto.pcd')
    m.rotateX(180 / RAD2DEG)
    webglApp.scene.add(m)
  }
  {
    //point cloud ply without faces
    var m = await loadPLYPoints('https://raw.githubusercontent.com/remmel/recorder-3d/master/Recorder3D/src/test/resources/00000012.ply')
    m.setRotationFromQuaternion(new Quaternion(0.019091055, 0.96770465, 0.2512833, 0.0045607537))
    m.rotateX(180 / RAD2DEG)
    m.position.setX(-2)
    webglApp.scene.add(m)
  }
  {
    //rgbd_dataset_freiburg1_desk
    var m = await loadTumPng('rgbd-viewer/tum/1305031464.115837.png', 'rgbd-viewer/tum/1305031464.127681.png')
    m.setRotationFromQuaternion(new Quaternion(0.9049, -0.1485, 0.1165, -0.3816))
    m.rotateY(180 / RAD2DEG)
    webglApp.scene.add(m)
  }
  {
    //https://github.com/remmel/hms-AREngine-demo
    var m = await loadDepth16BinPointsResize('rgbd-viewer/arengine-recorder/00000070_depth16.bin',
      'rgbd-viewer/arengine-recorder/00000070_image.jpg')
    var q = new Quaternion(0.020149395, 0.99818397, 0.05096002, -0.025030866)
    q.multiply(new Quaternion(1, 0, 0, 0))
    m.setRotationFromQuaternion(q)
    m.rotateY(180 / RAD2DEG) //to avoid having it mixed with the other points cloud
    webglApp.scene.add(m)
  }

  var folderCloseup = closeup.folder
  loadDepth16BinMeshTexture(folderCloseup + '/00000294_depth16.bin', folderCloseup + '/00000294_image.jpg').then(m => {
    webglApp.scene.add(m)
    m.setRotationFromEuler(new Euler(1.25,1.33,-2.86))
    m.position.copy(new Vector3(-0.153,1.600,0.006))
    webglApp.canTransformControl(m)
  })

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

