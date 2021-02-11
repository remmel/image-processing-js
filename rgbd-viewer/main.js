import * as THREE from 'three'
import WebGlApp from './WebGlApp'
import { loadPCD, loadPLYMesh, loadPLYPoints, loadPLYs } from './LoadersHelper'
import { convertGrayscale } from './opencvtest'

//https://raw.githubusercontent.com/remmel/rgbd-dataset/main/rgbd_dataset_freiburg1_desk/rgb/1305031468.195985.png
//https://raw.githubusercontent.com/remmel/rgbd-dataset/main/rgbd_dataset_freiburg1_desk/depth/1305031468.188327.png
var webglApp

async function initThreejs() {
  webglApp = new WebGlApp(document.body)

  addPlys()

  webglApp.animate()


  webglApp.scene.add(await loadPCD('https://threejs.org/examples/models/pcd/binary/Zaghetto.pcd'))

  //point cloud ply without faces
  webglApp.scene.add(await loadPLYPoints('https://raw.githubusercontent.com/remmel/hms-AREngine-demo/master/HwAREngineDemo/src/test/resources/00000012.ply'))

  // //point cloud ply with faces
  let meshDeplphins = await loadPLYMesh('https://threejs.org/examples/models/ply/ascii/dolphins.ply')
  meshDeplphins.position.y = - 0.2;
  meshDeplphins.position.z = 0.3;
  meshDeplphins.rotation.x = - Math.PI / 2;
  meshDeplphins.scale.multiplyScalar( 0.001 );
  meshDeplphins.castShadow = true;
  meshDeplphins.receiveShadow = true;
  webglApp.scene.add(meshDeplphins)
}

function addPlys() {
  var $info = document.getElementById('info')
  var loadingCallback = percent => $info.innerText = Math.round(percent * 100) + '%'

  var geometries = null
  loadPLYs(loadingCallback).then(geo => geometries = geo)

  var material = new THREE.PointsMaterial({ size: 0.005 })
  material.vertexColors = true
  var mesh = new THREE.Points(new THREE.Geometry(), material)
  webglApp.scene.add(mesh)

  var geoIdx = 0, frame = 0
  webglApp.animateCallback = () => {
    frame++
    if (geometries && frame % 5 === 0) {
      geoIdx++
      if (geoIdx === geometries.length) geoIdx = 0
      mesh.geometry = geometries[geoIdx]
    }
  }
}

//check https://www.smartjava.org/ltjs3/src/chapter-07/03-basic-point-cloud.html

window.main = function() {
  convertGrayscale('original', 'grayscale')
  initThreejs()
}


