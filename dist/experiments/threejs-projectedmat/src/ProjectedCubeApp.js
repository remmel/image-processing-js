import * as THREE from '../../web-modules/three.js'
import { OrbitControls } from '../../web-modules/three.js'
import { angles2euler } from './ThreeUtils.js'
import { calculate } from './estimatePosition.js'
import { Gui } from './Gui.js'
import { ProjectedMesh } from './ProjectedMesh.js'
import { Pose } from './Pose.js'

//https://github.com/aakatev/three-js-webpack.git
//https://codesandbox.io/s/project-camera-gby2i?file=/src/index.js

export async function ProjectedCubeApp(div, divGui) {
  const scene = new THREE.Scene()

  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(div.clientWidth, div.clientHeight)
  div.appendChild(renderer.domElement)

  const camera = new THREE.PerspectiveCamera(54, div.clientWidth / div.clientHeight, 0.1, 1000)
  camera.position.set(7, 7, 7)
  camera.lookAt(0, 0, 0)

  new OrbitControls(camera, renderer.domElement)
  scene.add(new THREE.AxesHelper(1))

  const pose = new Pose('./images/IMG_20210201_142032_0.jpg')

  var pos = calculate();
  pose.camera.position.set(0.18, pos.y, pos.z) //dm //5.49, 4.86
  pose.camera.setRotationFromEuler(angles2euler(-54.53591590779914, 0, 0))//, -2.418191253067505, 345.27533));
  scene.add(pose)

  var box = createProjectedBox(pose)  //box is the center
  scene.add(box)

  var floor = createProjectedFloor(pose)
  scene.add(floor)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)

  const animate = function() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
  }

  new Gui(divGui, box, pose, camera, floor)

  //Debug variable
  window.G = { box, floor, pose, angles2euler, camera }

  animate()
}

function createProjectedFloor(pose) {
  var s = 6 //dm
  var mesh = new ProjectedMesh(new THREE.PlaneGeometry(s, s), pose)
  mesh.setRotationFromEuler(angles2euler(-90, 0, 20))
  mesh.project()
  return mesh
}

//Create a projected box, with bottom corner the origin
function createProjectedBox(pose) {
  var s = .68 //dm
  var mesh = new ProjectedMesh(new THREE.BoxBufferGeometry(s, s, s), pose)
  mesh.position.set(-s/2, s / 2, -s/2)

  var g = new THREE.Group(); //have to create group in order to have rotation origin in corner
  g.add(mesh);
  g.setRotationFromEuler(angles2euler(0, -21, 0))
  g.project = () => mesh.project()
  // mesh.project();
  setTimeout(() =>g.project()) //I don't know why after making the group, that timeout is needed
  return g
}

