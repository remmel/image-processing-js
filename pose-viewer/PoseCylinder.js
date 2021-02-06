//1st position is landscape. on the x,y plan looking in z direction. uncomment createDebugCamera() to check that
import * as THREE from 'three'
import { DATASET_TYPE } from './datasetsloader/datasetsloader'


var material = new THREE.MeshPhongMaterial({ color: 0x999999, vertexColors: THREE.FaceColors, flatShading: true })
var materialRed = new THREE.MeshPhongMaterial({ color: 0xff0000, flatShading: true })

export class PoseCylinder extends THREE.Mesh {
  constructor(pose, idxPose, scale, datasetType) {
    var geometry = new THREE.CylinderGeometry(0, 0.1 / scale, 0.05 / scale, 4)
    geometry.rotateX(THREE.Math.degToRad(-90)) //=-PI/2 _ //PI <=> 180°
    geometry.rotateZ(THREE.Math.degToRad(45)) //=PI/4
    geometry.applyMatrix4(new THREE.Matrix4().makeScale(1, 0.75, 1)) //rectangular base
    if (datasetType === DATASET_TYPE.LUBOS) {
      geometry.rotateZ(THREE.Math.degToRad(90)) //pictures are in portrait not landscape
      geometry.faces[3].color.setHex(0xffff00)
    } else {
      geometry.faces[2].color.setHex(0xffff00)
    }

    super(geometry, material)

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

  select() {
    var oldMaterial = this.material
    this.material = materialRed
    setTimeout(() => this.material = oldMaterial, 500) //put back prev material
  }
}

// //project image
// //Kinect 62.6°x49.0°
// const camera = new THREE.PerspectiveCamera(49, 640/480, 0.01, 3)
// camera.position.copy(pose.position);
// camera.rotation.copy(pose.mesh.rotation)
// const texture = new THREE.TextureLoader().load(pose.rgb)
// const pmaterial = new ProjectedMaterial({
//     camera,
//     texture,
//     color: '#37E140',
// })
// model.material = pmaterial;
// pmaterial.project(model)


