// Using 640x480 resolution from Boofcv
import { focal2fov } from './ThreeUtils.js'
import * as THREE from '../../web-modules/three.js'

console.log(focal2fov(486, 318).toFixed(1) + '°x' + focal2fov(487, 245).toFixed(1)) + '°'

export const RAD2DEG = 180 / Math.PI

function topleftToCenter(img, point) {
  return new THREE.Vector2(point.x - img.x / 2, img.y / 2 - point.y)
}

//img size and fov are known, camera pitch/roll/yaw, (u,v) of 2 corners cube (A & B) with B on the floor
export function calculate() {
  var img = new THREE.Vector2(3648, 2736)
  var A0 = new THREE.Vector2(1752, 897) //(0,0) is top-left
  var B0 = new THREE.Vector2(1755, 1080)
  var pitch = -54.5359
  var AB = 6.8 //cm

  var hvfov = 53.4 / 2 //half vertical fov

  // 1) points centered (0,0) is center
  var A = topleftToCenter(img, A0)
  var B = topleftToCenter(img, B0)

  // 2) angle APB (P is pose point) - y axis
  var f = (img.y / 2) / Math.tan(hvfov / RAD2DEG)
  var Â = Math.atan2(A.y, f) * RAD2DEG
  var B̂ = Math.atan2(B.y, f) * RAD2DEG
  var APB = Â - B̂

  // 3) PB - AB is vertical and we know pitch and AB (size of the cube)
  var PBA = 90 + B̂ + pitch

  var AA1 = AB * Math.sin(PBA / RAD2DEG)
  var PA1 = AA1 / Math.tan(APB / RAD2DEG)
  var BA1 = AA1 / Math.tan(PBA / RAD2DEG)
  var PB = PA1 + BA1

  // 4) cartesian distance (x,y)
  var BB1 = Math.cos(PBA / RAD2DEG) * PB
  var PB1 = Math.sin(PBA / RAD2DEG) * PB


  console.log('A', A, 'B', B, 'f', f, 'Â', Â, 'B̂', B̂, 'APB', APB, 'PBA', PBA, 'AA1', AA1, 'PB', PB, 'BB1', BB1, 'PB1', PB1)

  //need to calculate x. And take into account yaw and roll
  return {
    y: BB1 / 10,
    z: PB1 / 10
  }
}
