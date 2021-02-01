import * as THREE from '../../modules/three.js'

THREE.PerspectiveCamera.prototype.getHorizontalFov = function() {
  var vFovRad = THREE.Math.degToRad(this.fov)
  var hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * this.aspect)
  return THREE.Math.radToDeg(hFovRad)
}

THREE.PerspectiveCamera.prototype.getHalfWidth = function() {
  var hFovDeg = this.getHorizontalFov()
  return this.far * Math.tan(THREE.Math.degToRad(hFovDeg / 2))
}

THREE.PerspectiveCamera.prototype.getWidth = function() {
  return this.getHalfWidth() * 2
}

THREE.PerspectiveCamera.prototype.getHalfHeight = function() {
  var vFovDeg = this.getEffectiveFOV()
  return this.far * Math.tan(THREE.Math.degToRad(vFovDeg / 2))
}

THREE.PerspectiveCamera.prototype.getHeight = function() {
  return this.getHalfHeight() * 2
}

THREE.Mesh.prototype.setRotationFromAngle = function(xangle, yangle, zangle) {
  this.setRotationFromEuler(
    new THREE.Euler(
      THREE.Math.degToRad(xangle),
      THREE.Math.degToRad(yangle),
      THREE.Math.degToRad(zangle)
    )
  )
}

export const Color = {
  Blue: 0x0000ff,
  Red: 0xff0000,
  Green: 0x00ff00,
  Yellow: 0xffff00,
  White: 0xffffff,
  Gray: 0xaaaaaa,
  Black: 0x000000,
}

export function createLine(ax, ay, az, bx, by, bz, color) {
  var material = new THREE.LineBasicMaterial({ color: color })
  var geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(ax, ay, az),
    new THREE.Vector3(bx, by, bz),
  ])
  var line = new THREE.Line(geometry, material)
  return line
}

export function createPlane(w, h, color) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ color: color })
  )
}

export function createSphere(radius, color) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius),
    new THREE.MeshBasicMaterial({ color: color })
  )
}
