import { loadGltf, loadObj, loadPCD } from '../rgbd-viewer/LoadersHelper'
import { RAD2DEG } from '../pose-viewer/utils3d'
import WebGlApp from '../WebGlApp'
import * as THREE from 'three'

var webglApp

var el = document.getElementById("info")
function cbLoading(percentage) {
  el.innerText = percentage === 1 ? "Loaded" : "Loading "+Math.round(percentage*100)+"%"
}

async function init() {
  webglApp = new WebGlApp(document.body)
  webglApp.scene.add(new THREE.AmbientLight(0xFFFFFF, 1))

  webglApp.animate()

  // {
  //   // PCDFormat
  //   var m = await loadPCD('https://threejs.org/examples/models/pcd/binary/Zaghetto.pcd')
  //   m.rotateX(180 / RAD2DEG)
  //   webglApp.scene.add(m)
  // }
  loadObj(
    'https://www.kustgame.com/ftp/cocina/depthmaps-lowlowalignhighest.obj',
    'https://www.kustgame.com/ftp/cocina/depthmaps-lowlowalignhighest.mtl', cbLoading)
    .then(m => {
      m.scale.set(0.157, 0.157, 0.157)
      m.rotation.x = 15 * 3.14 / 180
      m.position.y = 1.69
      webglApp.scene.add(m)
    })
  // {
  //   var m = await loadGltf('vr/depthmaps-lowlowalignhighest.glb')
  //   m.scale.set(0.2,0.2,0.2)
  //   m.position.y = 2
  //   window.M = m
  //   M.children[0].material.vertexColors=THREE.FaceColors
  //   webglApp.scene.add(m)
  // }
  // {
  //   const skyColor = 0xB1E1FF;  // light blue
  //   const groundColor = 0xB97A20;  // brownish orange
  //   const intensity = 1;
  //   const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
  //   webglApp.scene.add(light);
  // }

  // {
  //   const color = 0xFFFFFF;
  //   const intensity = 1;
  //   const light = new THREE.DirectionalLight(color, intensity);
  //   light.position.set(5, 10, 2);
  //   webglApp.scene.add(light);
  //   webglApp.scene.add(light.target);
  // }
}

init()


