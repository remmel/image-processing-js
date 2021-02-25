import { loadPCD } from '../rgbd-viewer/LoadersHelper'
import { RAD2DEG } from '../pose-viewer/utils3d'
import WebGlApp from '../pose-viewer/WebGlApp'

var webglApp

async function init() {
  webglApp = new WebGlApp(document.body)
  webglApp.addDumbCubeWithLights()

//getVRDisplays
//   document.getElementById('info').textContent = JSON.stringify(navigator.getVRDisplays())

  webglApp.animate()

  {
    // PCDFormat
    var m = await loadPCD('https://threejs.org/examples/models/pcd/binary/Zaghetto.pcd')
    m.rotateX(180/RAD2DEG)
    webglApp.scene.add(m)
  }
}

init()


