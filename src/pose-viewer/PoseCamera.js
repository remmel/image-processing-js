import * as THREE from 'three'
import ProjectedMaterial from 'three-projected-material'
import { RAD2DEG } from './utils3d'
import PerspectiveCamera from './PerpectiveCamera'

/**
 * A pose is a Camera with an image
 * TODO: how to select a pose? AxisHelper only found, no CameraHelper found in raycaster
 */
export class PoseCamera extends THREE.Group {
  // texture = null
  // camera = null

  constructor(pose, idxPose, scale, datasetType) {
    super()
    this.camera = new PerspectiveCamera(53.4, 4 / 3, 0.01, 0.1)
    this.add(this.camera)

    this.cameraHelper = new THREE.CameraHelper(this.camera);
    this.cameraHelper.poseObject = this;
    this.add(this.cameraHelper) //must be 0 origin

    // this.nearImage = this.initImageTextured(1)
    // this.farImage = this.initImageProjected(10)

    this.camera.position.copy(pose.position)
    if (pose.rotation instanceof THREE.Euler) {
      this.camera.rotation.copy(pose.rotation)
    } else if (pose.rotation instanceof THREE.Quaternion) {
      this.camera.quaternion.copy(pose.rotation);
      // this.camera.setRotationFromQuaternion(pose.rotation)
    } else {
      console.error('missing pose info', pose)
    }

    this.camera.rotateX(180/RAD2DEG) //no explication...

    this.idxPose = parseInt(idxPose)
    this.data = pose;
  }

  //not projecting
  initImageTextured(far) {
    var mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.camera.getWidth() * far, this.camera.getHeight() * far),
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

  select() {
    this.texture = new THREE.TextureLoader().load(this.data.rgb)
    const pmaterial = new ProjectedMaterial({
      camera: this.camera,
      texture: this.texture,
      color: '#37E140',
    })
    window.model.material = pmaterial
    pmaterial.project(window.model)
    this.nearImage = this.initImageTextured(this.camera.far)
  }
}
