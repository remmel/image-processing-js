import * as THREE from 'three'
import * as fontjson from 'three/examples/fonts/helvetiker_regular.typeface.json'

/**
 * @param {String} text
 * @param {Number} size in meters
 * @return {Mesh}
 */
export function createText(text, size) {
  size = size || 0.03
  var material = new THREE.MeshPhongMaterial({ color: 0x333333 })
  var font = new THREE.Font(fontjson.default) //await new THREE.FontLoader().loadAsync('rgbd-viewer/helvetiker_regular.typeface.json')
  return new THREE.Mesh(new THREE.TextGeometry(text, { font, size: size, height: size / 10 }), material)
}

