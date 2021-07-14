import { EVENT_MOVE } from './GameFps'
import { Camera, MathUtils } from 'three'

var blockerHtml = `
<div style='position:absolute;width:100%;height:100%;opacity:0.7;z-index:100;background:#000;display: table;'>
  <span style='color: white;text-align: center;display: table-cell;vertical-align: middle;font-size:36px '>
  Click to start
  <br />
  Move with keyboard and mouse
  </span>
</div>
`

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

    this.initBlocker()

    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))

    document.body.addEventListener('mousemove', this.onMouseMove.bind(this))
  }

  initBlocker() {
    var blocker = document.createElement('div')
    blocker.innerHTML = blockerHtml
    document.body.insertBefore(blocker, document.body.firstChild)
    //fullscreen mode with infinite cursor move
    blocker.addEventListener('mousedown', () => {
      this.onClick()
      this.domElement.requestPointerLock()
    })

    document.addEventListener('pointerlockchange', () => { // must be listen by document
      blocker.style.display = document.pointerLockElement ? 'none' : 'inherit'
    })
  }

  onClick() {console.warn("must be redefined")}

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
