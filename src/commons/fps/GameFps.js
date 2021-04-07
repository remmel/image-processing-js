import * as THREE from 'three'

import { Octree } from 'three/examples/jsm/math/Octree'
import { Capsule } from 'three/examples/jsm/math/Capsule'
import { FpsDesktopControls } from './FpsDesktopControls'
import { FpsMobileControls } from './FpsMobileControls'

export const EVENT_MOVE = 'cursor_move'
const GRAVITY = 30

export class GameFps {
  constructor(camera, domElement) {
    this.worldOctree = new Octree()
    this.playerCollider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1.5, 0), 0.35)
    this.playerVelocity = new THREE.Vector3()
    this.playerDirection = new THREE.Vector3()
    this.playerOnFloor = false

    if(isTouchDevice())
      this.gamecontrols = new FpsMobileControls(camera, domElement)
    else
      this.gamecontrols = new FpsDesktopControls(camera, domElement)


    // document.addEventListener(EVENT_MOVE, e => {
    //   camera.rotation.y -= e.detail.movementX / 500
    //   camera.rotation.x -= e.detail.movementY / 500
    // })

    this.camera = camera
    camera.rotation.order = 'YXZ'
  }

  _playerCollitions() {
    const result = this.worldOctree.capsuleIntersect(this.playerCollider)
    this.playerOnFloor = false
    if (result) {
      this.playerOnFloor = result.normal.y > 0
      if (!this.playerOnFloor) {
        this.playerVelocity.addScaledVector(result.normal, -result.normal.dot(this.playerVelocity))
      }
      this.playerCollider.translate(result.normal.multiplyScalar(result.depth))
    }
  }

  _updatePlayer(deltaTime) {
    if (this.playerOnFloor) {
      const damping = Math.exp(-3 * deltaTime) - 1
      this.playerVelocity.addScaledVector(this.playerVelocity, damping)
    } else {
      this.playerVelocity.y -= GRAVITY * deltaTime
    }
    const deltaPosition = this.playerVelocity.clone().multiplyScalar(deltaTime)
    this.playerCollider.translate(deltaPosition)
    this._playerCollitions()
    this.camera.position.copy(this.playerCollider.end)
  }

  _getForwardVector() {
    this.camera.getWorldDirection(this.playerDirection)
    this.playerDirection.y = 0
    this.playerDirection.normalize()
    return this.playerDirection
  }

  _getSideVector() {
    this.camera.getWorldDirection(this.playerDirection)
    this.playerDirection.y = 0
    this.playerDirection.normalize()
    this.playerDirection.cross(this.camera.up)
    return this.playerDirection
  }

  _controls(deltaTime) {
    const speed = 25
    if (this.playerOnFloor) {
      if (this.gamecontrols.forwardPressed)
        this.playerVelocity.add(this._getForwardVector().multiplyScalar(speed * deltaTime))

      if (this.gamecontrols.backwardPressed)
        this.playerVelocity.add(this._getForwardVector().multiplyScalar(-speed * deltaTime))

      if (this.gamecontrols.rightPressed)
        this.playerVelocity.add(this._getSideVector().multiplyScalar(speed * deltaTime))

      if (this.gamecontrols.leftPressed)
        this.playerVelocity.add(this._getSideVector().multiplyScalar(-speed * deltaTime))

      if (this.gamecontrols.jumpPressed) {
        this.playerVelocity.y = 5
      }
    }
  }

  update(delta) {
    delta = Math.min(0.1, delta) //to avoid going through the floor at start
    this._controls(delta)
    this._updatePlayer(delta)
    this.gamecontrols.update(delta)
  }

  canCollide(object3d) {
    this.worldOctree.fromGraphNode(object3d)
  }
}

function isTouchDevice() {
  return (('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0))
}

