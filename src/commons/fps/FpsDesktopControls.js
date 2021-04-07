import { EVENT_MOVE } from './GameFps'
import { Camera, MathUtils } from 'three'


export class FpsDesktopControls {
  /**
   * Handle the mouse movement and arrow + jump keys
   * @param camera {Camera} : if provided, will move directly the camera
   * @param domElement
   */
  constructor(camera, domElement) {
    this.camera = camera
    this.domElement = domElement

    this.forwardPressed = false
    this.backwardPressed = false
    this.rightPressed = false
    this.leftPressed = false
    this.jumpPressed = false

    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))

    //fullscreen mode with infinite cursor move
    this.domElement.addEventListener('mousedown', () => this.domElement.requestPointerLock())
    document.body.addEventListener('mousemove', this.onMouseMove.bind(this))
  }

  onMouseMove(event) {
    if (document.pointerLockElement === this.domElement) {
      var { movementX, movementY } = event

      if (this.camera) { //if camera is provided, directly move it
        this.camera.rotation.y -= movementX / 500
        this.camera.rotation.x -= movementY / 500
        this.camera.rotation.x = MathUtils.clamp(this.camera.rotation.x, -Math.PI/2, Math.PI/2)
      }
      document.dispatchEvent(new CustomEvent(EVENT_MOVE, {
        detail: { movementX, movementY },
      }))
    }
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.forwardPressed = true
        break
      case 'ArrowDown':
      case 'KeyS':
        this.backwardPressed = true
        break
      case 'ArrowRight':
      case 'KeyD':
        this.rightPressed = true
        break
      case 'ArrowLeft':
      case 'KeyA':
        this.leftPressed = true
        break
      case 'Space':
        this.jumpPressed = true
        break
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.forwardPressed = false
        break
      case 'ArrowDown':
      case 'KeyS':
        this.backwardPressed = false
        break
      case 'ArrowRight':
      case 'KeyD':
        this.rightPressed = false
        break
      case 'ArrowLeft':
      case 'KeyA':
        this.leftPressed = false
        break
      case 'Space':
        this.jumpPressed = false
        break
    }
  }

  update(delta) {
  }
}
