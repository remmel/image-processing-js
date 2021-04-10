import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { createSphere } from '../pose-viewer/utils3d'
import { Vector3 } from 'three'

/**
 * The center is displayed and can be pan forward/backward with arrow keys
 * UP-DOWN arrow key = pan forward /backward
 * Double click / double tap = pan forward
 * Note that listenToKeyEvents in OrbitControls allows pan side and up/down with arrow keys
 */
export class OrbitControlsPlus {
  constructor(camera, domElement) {
    this.orbitControls = new OrbitControls(camera, domElement)
    this.domElement = domElement
    this.camera = camera
    this.sphere = createSphere(0.01, 0xff0000) //10cm radius
    this.forwardTmp = new Vector3() //generic v3, for optimization
    this.panSpeed = 1.5 // in m/s

    //binding keys to new actions (different than listenToKeyEvents(document))
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))
    domElement.addEventListener('dblclick', this.onDblClick.bind(this))
    domElement.addEventListener('touchstart', this.onTouchStart.bind(this))

  }

  update(delta) {
    this.orbitControls.update()
    this.sphere.position.copy(this.orbitControls.target)

    if (this.forwardPressed) this._panForward(delta * this.panSpeed)
    if (this.backwardPressed) this._panForward(-delta * this.panSpeed)
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'ArrowUp':
        this.forwardPressed = true
        break
      case 'ArrowDown':
        this.backwardPressed = true
        break
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'ArrowUp':
        this.forwardPressed = false
        break
      case 'ArrowDown':
        this.backwardPressed = false
        break
    }
  }

  //handle double tab
  onTouchStart(event) {
    event.preventDefault()
    if (this.lastClick && new Date() - this.lastClick < 200) //less than 200ms between 2 taps
      this.onDblClick()
    this.lastClick = new Date()
  }

  onDblClick() {
    this._panForward(0.2)
  }

  _panForward(distance) {
    this.camera.getWorldDirection(this.forwardTmp) //normalized forward vector
    var diffPos = this.forwardTmp.multiplyScalar(distance)
    this.orbitControls.target.add(diffPos) //move target = red shere
    this.orbitControls.object.position.add(diffPos) //move camera
  }
}
