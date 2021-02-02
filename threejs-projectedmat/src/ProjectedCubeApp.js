import * as THREE from '../../modules/three.js'
import ProjectedMaterial from '../../modules/three-projected-material.js'
import { OrbitControls } from '../../modules/three.js'
import { angles2euler, focal2fov } from './ThreeUtils.js'

//https://github.com/aakatev/three-js-webpack.git

//https://codesandbox.io/s/project-camera-gby2i?file=/src/index.js

export async function ProjectedCubeApp(div, divGui) {
  const scene = new THREE.Scene()

  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(div.clientWidth, div.clientHeight)
  div.appendChild(renderer.domElement);

  const mainCamera = new THREE.PerspectiveCamera(75, div.clientWidth/ div.clientHeight, 0.1, 1000)
  mainCamera.position.set(7,7,7)
  mainCamera.lookAt(0, 0, 0)

  new OrbitControls(mainCamera, renderer.domElement)
  scene.add(new THREE.AxesHelper(1));

  // Using 640x480 resolution from Boofcv
  console.log(focal2fov(486, 318).toFixed(1) + "°x" + focal2fov(487,245).toFixed(1)) + "°";
  const pose = new THREE.PerspectiveCamera(65.7, 4 / 3, 0.01, 1) //wrong fov
  pose.position.set(0.38, 4.05, 4.2) //dm
  pose.setRotationFromEuler(angles2euler(-54.53591590779914, 0, 0));//, -2.418191253067505, 345.27533));
  scene.add(new THREE.CameraHelper(pose))

  divGui.innerHTML = pose.getHorizontalFov().toFixed(1) + "°x" + pose.fov +"°";

  const texture = new THREE.TextureLoader().load('./images/IMG_20210201_142032_0.jpg')
  const prjMaterial = new ProjectedMaterial({
    camera: pose,
    texture,
    color: '#37E140',
  })

  var box = createBox(prjMaterial)  //box is the center
  scene.add(box)

  var floor = createFloor(prjMaterial)
  scene.add(floor)

  prjMaterial.project(box)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)

  const animate = function() {
    requestAnimationFrame(animate)
    renderer.render(scene, mainCamera)
  }

  //Debug variable
  window.G = {box, floor, pose, angles2euler, mainCamera, texture};

  animate()
}

function createFloor(material) {
  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),//dm
    material,
  )
  floor.position.set(0, 0, 0)
  floor.setRotationFromEuler(angles2euler(-90, 0, 0));
  return floor
}

function createBox(material) {
  var mesh = new THREE.Mesh(
    new THREE.BoxBufferGeometry(0.68, 0.68, 0.68),
    material
  );
  mesh.position.set(0, 0.68/2, 0);
  mesh.setRotationFromEuler(angles2euler(0, -17, 0));
  return mesh;
}
