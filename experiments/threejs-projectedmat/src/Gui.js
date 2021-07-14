import { RAD2DEG } from './estimatePosition.js'

export class Gui {
  constructor(el, box, pose, camera, floor) {
    this.el = el
    this.box = box
    this.pose = pose
    this.camera = camera
    this.floor = floor
    this.el.querySelector('span').innerHTML = 'init'

    // Pose xyz
    this.$poseX = this.el.querySelector('input[type=number][name=pose-x]')
    this.$poseY = this.el.querySelector('input[type=number][name=pose-y]')
    this.$poseZ = this.el.querySelector('input[type=number][name=pose-z]')

    this.$poseX.value = this.pose.camera.position.x
    this.$poseY.value = this.pose.camera.position.y
    this.$poseZ.value = this.pose.camera.position.z;

    [this.$poseX, this.$poseY, this.$poseZ].forEach(el => el.addEventListener('change', (e) => this.updatePosePosition()))

    // Cube rot y
    this.$cubeRotY = this.el.querySelector('input[type=number][name=cube-rot-y]')
    this.$cubeRotY.value = Math.round(box.rotation.y * RAD2DEG)

    this.$cubeRotY.addEventListener('change', (e) => {
      box.rotation.y = e.target.value / RAD2DEG
      box.project()
    })

    this.el.querySelector('input[type=checkbox]').addEventListener('change', (e) => {
      pose.setImagesVisibility(e.target.checked)
    })

    this.el.querySelector('input[type=button]').addEventListener('click', (e) => {
      camera.position.copy(pose.camera.position)
      camera.rotation.copy(pose.camera.rotation)
    })

    this.fovPose()
  }

  fovPose() {
    this.el.querySelector('span').innerHTML = this.pose.fovInfo()
  }

  updatePosePosition() {
    this.pose.camera.position.set(this.$poseX.value, this.$poseY.value, this.$poseZ.value)
    this.box.project()
    this.floor.project()
  }
}
