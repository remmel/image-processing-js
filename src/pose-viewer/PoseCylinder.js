//1st position is landscape. on the x,y plan looking in z direction. uncomment createDebugCamera() to check that
import * as THREE from 'three'
import { DATASET_TYPE } from './datasetsloader/datasetsloader'
import PerspectiveCamera from './PerpectiveCamera'
import ProjectedMaterial from 'three-projected-material'
import { RAD2DEG } from './utils3d'

//TODO put back the top face in another color, as code was not compatible with Threejs 127
var cylinderDefaultMat = new THREE.MeshPhongMaterial({ color: 0x999999, flatShading: true })
var cylinderRedMat = new THREE.MeshPhongMaterial({ color: 0xff0000, flatShading: true })

/**
 * Represent the camera pose.
 * I'll try to replace that class with PoseCamera as I prefer to use PerspectiveCamera with CameraHelper
 */
export default class PoseCylinder extends THREE.Mesh {
  constructor(pose, idxPose, scale, datasetType) {
    var geometry = new THREE.CylinderGeometry(0, 0.1 / scale, 0.05 / scale, 4)
    geometry.rotateX(-90/RAD2DEG) //=-PI/2 _ //PI <=> 180°
    geometry.rotateZ(45/RAD2DEG) //=PI/4
    geometry.applyMatrix4(new THREE.Matrix4().makeScale(1, 0.75, 1)) //rectangular base
    if (datasetType === DATASET_TYPE.LUBOS) {
      geometry.rotateZ(90/RAD2DEG) //pictures are in portrait not landscape
      // geometry.faces[3].color.setHex(0xffff00)
    } else {
      // geometry.faces[2].color.setHex(0xffff00) (material was with: vertexColors: THREE.FaceColors)
    }

    super(geometry, cylinderDefaultMat)

    this.idxPose = parseInt(idxPose)
    this.position.copy(pose.position)

    if (pose.rotation instanceof THREE.Euler) {
      this.rotation.copy(pose.rotation)
    } else if (pose.rotation instanceof THREE.Quaternion) {
      // mesh.quaternion.copy(pose.rotation);
      this.setRotationFromQuaternion(pose.rotation)
    } else {
      console.error('missing pose info', pose)
    }
    this.updateMatrix()
    this.matrixAutoUpdate = false

    this.data = pose
  }

  select(meshPly) {
    this.material = cylinderRedMat
    setTimeout(() => this.material = cylinderDefaultMat, 1000)

    if(meshPly) {
      this.camera = PerspectiveCamera.create(this.data.raw.intrinsics, 0.01, 0.1)
      // console.log(this.camera.getFovs())
      this.camera.rotation.copy(this.rotation)
      this.camera.position.copy(this.position)
      this.camera.rotateX(180/RAD2DEG) //hum, cylinder based rotation is different from camera

      //FIXME image projection should be stopped by 1st face https://github.com/marcofugaro/three-projected-material/issues
      this.texture = new THREE.TextureLoader().load(this.data.rgb)
      const pmaterial = new ProjectedMaterial({
        camera: this.camera,
        texture: this.texture,
        color: '#37E140',
      })

      meshPly.material = pmaterial
      pmaterial.project(meshPly)
    }
  }

  initImageTextured(far) { //TODO incorrect z
    var mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.camera.getWidth() * far, this.camera.getHeight() * far),
      new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, opacity: 0.5 }),
    )
    mesh.translateZ(-far)
    this.add(mesh)
    return mesh
  }
}
