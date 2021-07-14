import ProjectedMaterial from '../../web-modules/three-projected-material.js'
import * as THREE from '../../web-modules/three.js'

export class ProjectedMesh extends THREE.Mesh {
  mat

  /**
   * @param {THREE.Geometry} geo
   * @param {Pose} pose
   */
  constructor(geo, pose) {
    var pmat = new ProjectedMaterial({
      camera: pose.camera,
      texture: pose.texture,
      color: '#37E140',
    })
    super(geo, pmat)
    this.mat = pmat
  }

  project() {
    this.mat.project(this)
  }
}
