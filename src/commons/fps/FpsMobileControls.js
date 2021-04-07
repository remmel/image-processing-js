import { MathUtils, Camera } from 'three'
import { DeviceOrientationControls } from 'three/examples/jsm/controls/DeviceOrientationControls'

export var blockerHtml = `
<div style='position:absolute;width:100%;height:100%;opacity:0.7;z-index:100;background:#000;display: table;'>
  <span style='color: white;text-align: center;display: table-cell;vertical-align: middle;font-size:36px '>
  Click to start
  </span>
</div>
`

var btnHtml = `
<div style='
  font-size: 30px;
  position: absolute;
  user-select: none;
  top: 10px;
  ' class='btn compass'>🧭</div>
<div style='
    font-size: 40px;
    position: absolute;
    bottom: 10px;
    left: 10px;
    font-weight: 1000;
    text-align: center;
    user-select: none;
    '>
    <div class='btn forward' style='
      background-color: rgba(255,255,255,0.5);
      border-radius: 50%;
      width: 50px;
      height: 50px;'>↑</div>
    <div class='btn backward' style='
      background-color: rgba(255,255,255,0.5);
      border-radius: 50%;
      width: 50px;
      height: 50px;'>↓</div>
</div>
`

export class FpsMobileControls {
  /**
   * @param {Camera} camera
   * @param {HTMLElement} domElement
   */
  constructor(camera, domElement) {
    this.camera = camera
    this.camera.rotation.order = 'YXZ'
    this.domElement = domElement

    this.forwardPressed = false
    this.backwardPressed = false
    this.rightPressed = false
    this.leftPressed = false
    this.jumpPressed = false

    this.initBlocker()

    this.dvcOrieControls = new DeviceOrientationControls(this.camera)
    this.dvcOrieControls.enabled = false

    //rotation
    domElement.addEventListener('touchstart', this.onTouchStartRotation.bind(this), false)
    domElement.addEventListener('touchmove', this.onTouchMoveRotation.bind(this), false)
    domElement.addEventListener('touchend', this.onTouchEndRotation.bind(this), false)
    this.coordsPageInit = { x: 0, y: 0 }
    this.cameraRotationInit = this.camera.rotation.clone()

    //position
    var btns = document.createElement('div')
    btns.innerHTML = btnHtml
    document.body.insertBefore(btns, document.body.firstChild)
    this.elBtnForward = btns.querySelector('.forward')
    this.elBtnBackward = btns.querySelector('.backward')
    this.elBtnCompass = btns.querySelector('.compass')

    btns.addEventListener('touchstart', this.onTouchStartPosition.bind(this), false)
    btns.addEventListener('touchend', this.onTouchEndPosition.bind(this), false)
    this.elBtnCompass.addEventListener('click', () => this.dvcOrieControls.enabled = !this.dvcOrieControls.enabled, false)
  }

  initBlocker() {
    var blocker = document.createElement('div')
    blocker.innerHTML = blockerHtml
    document.body.insertBefore(blocker, document.body.firstChild)
    blocker.addEventListener('click', () => document.body.requestFullscreen())
    document.body.addEventListener('fullscreenchange', () => blocker.style.display = document.fullscreen ? 'none' : 'inherit')
  }

  update(delta) {
    this.dvcOrieControls.update()
    // this.controls.update(delta)
    // if(this.moveForwardPressed) this.moveForward(delta * 0.5 * this.moveForwardPressed)
  }

  // touch rotation events
  onTouchStartRotation(event){
    this.coordsPageInit.x = event.targetTouches[0].pageX
    this.coordsPageInit.y = event.targetTouches[0].pageY
  }

  onTouchMoveRotation(event) {
    //pageX and pageY are size in virtual port
    var diffX = event.targetTouches[0].pageX - this.coordsPageInit.x
    var diffY = event.targetTouches[0].pageY - this.coordsPageInit.y

    var w = this.domElement.width / window.devicePixelRatio
    var h = this.domElement.height / window.devicePixelRatio

    var diffRadY = diffX * Math.PI / w //sliding from left to right is 180deg
    var diffRadX = diffY * Math.PI / h //sliding from down to up is 180deg

    this.camera.rotation.y = diffRadY + this.cameraRotationInit.y
    // avoid going too down or up clamp[-90°,90]
    this.camera.rotation.x = MathUtils.clamp(diffRadX + this.cameraRotationInit.x, -Math.PI/2, Math.PI/2)

    //TODO make it similar to FpsDesktopControls
  }

  onTouchEndRotation(event) {
    this.cameraRotationInit = this.camera.rotation.clone()
  }

  // touch position events
  onTouchStartPosition(event) {
    console.log("onTouchStartPosition", event)
    if (event.target === this.elBtnForward) { //or this.isTouchBtn(event.targetTouches[0], this.btnForward)
      this.forwardPressed = true
    } else if (event.target === this.elBtnBackward) {
      this.backwardPressed = true
    }
  }

  onTouchEndPosition(event) {
    this.forwardPressed = this.backwardPressed = false
  }

  // isTouchBtn(touch, btn) {
  //   var x = touch.pageX
  //   var y = touch.pageY
  //   var box = btn.getBoundingClientRect()
  //   return x > box.left && x < box.right && y > box.top && y < box.bottom
  // }
  //
  // moveForward(distance) {
  //   // move forward parallel to the xz-plane assumes camera.up is y-up
  //   var vec = new Vector3();
  //   vec.setFromMatrixColumn(this.camera.matrix, 0)
  //   vec.crossVectors(this.camera.up, vec)
  //   this.camera.position.addScaledVector(vec, distance)
  // }
}
