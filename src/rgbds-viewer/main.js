import * as THREE from 'three'
import { loadPLYs } from '../rgbd-viewer/LoadersHelper'
import WebGlApp from '../WebGlApp'


//https://raw.githubusercontent.com/remmel/rgbd-dataset/main/rgbd_dataset_freiburg1_desk/rgb/1305031468.195985.png
//https://raw.githubusercontent.com/remmel/rgbd-dataset/main/rgbd_dataset_freiburg1_desk/depth/1305031468.188327.png
var webglApp
var speed = 5

async function initThreejs() {
  webglApp = new WebGlApp(document.body)
  addPlys()
  webglApp.animate()
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
    if (geometries && frame % speed === 0) {
      geoIdx++
      if (geoIdx === geometries.length) geoIdx = 0
      mesh.geometry = geometries[geoIdx]
    }
  }
}

function initGui() {
  document.getElementById('btn-speed-quicker').onclick = (e) => {
    speed++
    render()
  }

  document.getElementById('btn-speed-slower').onclick = (e) => {
    if (speed > 1) speed--
    render()
  }

  function render() {
    document.getElementById('speed-value').innerText = speed
  }

  render()
}

initThreejs()

initGui()


