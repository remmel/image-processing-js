import * as THREE from 'three'

/**
 * ThreeJs PerspectiveCamera with some fov helpers
 */
export default class PerspectiveCamera extends THREE.PerspectiveCamera{
  constructor(fov, aspect, near, far) {
    super(fov, aspect, near, far);
  }

  getFovs() {
    return this.getHorizontalFov().toFixed(1) + '°x' + this.fov.toFixed(1) + '°'
  }

  getHorizontalFov() {
    var vFovRad = THREE.Math.degToRad(this.fov)
    var hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * this.aspect)
    return THREE.Math.radToDeg(hFovRad)
  }

  getWidth() {
    var hFovDeg = this.getHorizontalFov()
    return Math.tan(THREE.Math.degToRad(hFovDeg / 2)) * 2 //this.far = 1
  }

  getHeight() {
    var vFovDeg = this.getEffectiveFOV()
    return Math.tan(THREE.Math.degToRad(vFovDeg / 2)) * 2 // this.far = 1
  }

  static focalToFov(center, focal) {
    return THREE.Math.radToDeg(Math.atan2(center,focal))*2
  }

  /**
   * Create camera using intrinsics instead of vfov
   */
  static create({ w, h, cy,fy }, near, far) {
    var vfov = this.focalToFov(cy, fy)
    return new PerspectiveCamera(vfov, w/h, near, far)
  }
}
