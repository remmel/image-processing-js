import * as THREE from '../../web-modules/three.js'
import { ProjectedMesh } from './ProjectedMesh.js'

/**
 * A pose is a Camera with an image
 */
export class Pose extends THREE.Group {
  texture
  camera

  constructor(imgUrl) {
    super()
    this.camera = new THREE.PerspectiveCamera(53.4, 4 / 3, 1, 10)
    this.texture = new THREE.TextureLoader().load(imgUrl)

    this.add(new THREE.CameraHelper(this.camera)) //must be 0 origin
    this.add(this.camera)
    this.nearImage = this.initImageTextured(1)
    this.farImage = this.initImageProjected(10)
  }

  //not projecting
  initImageTextured(far) {
    var mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.camera.getWidth(), this.camera.getHeight()),
      new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, opacity: 0.5 }),
    )
    mesh.translateZ(-far)
    this.camera.add(mesh)
    return mesh
  }

  initImageProjected(far) {
    var mesh = new ProjectedMesh(new THREE.PlaneGeometry(this.camera.getWidth() * far, this.camera.getHeight() * far), this)
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
}
