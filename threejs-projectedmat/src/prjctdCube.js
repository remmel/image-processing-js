import * as THREE from '../../modules/three.js'
import ProjectedMaterial from '../../modules/three-projected-material.js'
import { OrbitControls } from '../../modules/three.js'
import * as ThreeUtils from './ThreeUtils.js'

//https://github.com/aakatev/three-js-webpack.git

//https://codesandbox.io/s/project-camera-gby2i?file=/src/index.js

export function CubeApp() {
  const scene = new THREE.Scene()
  const mainCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  mainCamera.position.z = 5
  mainCamera.position.set(-1, 1.2, 2)
  mainCamera.lookAt(0, 0, 0)
  new OrbitControls(mainCamera, renderer.domElement)

  const pose = new THREE.PerspectiveCamera(60, 4 / 3, 0.01, 1)
  pose.position.set(0, 0, 0)
  scene.add(new THREE.CameraHelper(pose))

  const texture = new THREE.TextureLoader().load('./images/IMG_20200528_210026.jpg')
  const prjMaterial = new ProjectedMaterial({
    camera: pose,
    texture,
    color: '#37E140',
  })
  var box = createBox(prjMaterial)
  scene.add(box)

  var floor = createFloor(prjMaterial)
  scene.add(floor)

  box.setRotationFromAngle(30, -16, 0)
  box.position.set(0.3, 0.7, -5)
  prjMaterial.project(box)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)

  const animate = function() {
    requestAnimationFrame(animate)
    renderer.render(scene, mainCamera)
  }

  animate()
}

function createFloor(material) {
  //draw floor - 81x75
  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8.1, 7.5),
    material,
  )
  floor.position.set(1, 0, -6)
  floor.setRotationFromAngle(-90 + 30, 0, 0)
  return floor
}

function createBox(material) {
  return new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 1), material)
}
