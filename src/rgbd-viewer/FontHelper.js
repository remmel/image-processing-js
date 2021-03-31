import * as THREE from 'three'
import * as fontjson from 'three/examples/fonts/helvetiker_regular.typeface.json'

export async function createText(text) {
  var material = new THREE.MeshPhongMaterial({ color: 0x333333 })
  var font = new THREE.Font(fontjson.default) //await new THREE.FontLoader().loadAsync('rgbd-viewer/helvetiker_regular.typeface.json')
  return new THREE.Mesh(new THREE.TextGeometry(text, { font, size:0.1, height: 0.02}), material)
}

