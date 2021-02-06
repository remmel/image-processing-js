import * as THREE from 'three'

/**
 * A pose is a Camera with an image
 */
export class PoseCamera extends THREE.Group {
  // texture = null
  // camera = null

  constructor(poseData) {
    super()
    this.camera = new THREE.PerspectiveCamera(53.4, 4 / 3, 0.01, 0.1)

    this.add(new THREE.CameraHelper(this.camera)) //must be 0 origin
    this.add(this.camera)
    this.data = poseData;
    // this.nearImage = this.initImageTextured(1)
    // this.farImage = this.initImageProjected(10)

    this.camera.position.copy(poseData.position)
    if (poseData.rotation instanceof THREE.Euler) {
      this.camera.rotation.copy(poseData.rotation)
    } else if (poseData.rotation instanceof THREE.Quaternion) {
      // mesh.quaternion.copy(pose.rotation);
      this.camera.setRotationFromQuaternion(poseData.rotation)
    } else {
      console.error('missing pose info', poseData)
    }

  }

  //not projecting
  initImageTextured(far) {
    var mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.getWidth(), this.getHeight()),
      new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, opacity: 0.5 }),
    )
    mesh.translateZ(-far)
    this.camera.add(mesh)
    return mesh
  }

  initImageProjected(far) {
    var mesh = new ProjectedMesh(new THREE.PlaneGeometry(this.getWidth() * far, this.getHeight() * far), this)
    mesh.translateZ(-far)
    this.camera.add(mesh) //same origin than the camera
    mesh.project()
    return mesh
  }

  /**
   * @param {boolean} visible
   */
  setImagesVisibility(visible) {
    this.nearImage.visible = visible
    this.farImage.visible = visible
  }

  fovInfo() {
    return this.camera.getHorizontalFov().toFixed(1) + '°x' + this.camera.fov + '°'
  }

  select() {
    this.texture = new THREE.TextureLoader().load(this.data.rgb)
    this.nearImage = this.initImageTextured(1)
  }

  getHorizontalFov() {
    var vFovRad = THREE.Math.degToRad(this.camera.fov)
    var hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * this.camera.aspect)
    return THREE.Math.radToDeg(hFovRad)
  }

  getHalfWidth() {
    var hFovDeg = this.getHorizontalFov()
    return Math.tan(THREE.Math.degToRad(hFovDeg / 2)) //this.far = 1
  }

  getWidth() {
    return this.getHalfWidth() * 2
  }

  getHalfHeight() {
    var vFovDeg = this.camera.getEffectiveFOV()
    return Math.tan(THREE.Math.degToRad(vFovDeg / 2)) // this.far = 1
  }

  getHeight() {
    return this.getHalfHeight() * 2
  }
}
