import { MathUtils, Camera } from 'three'
import { DeviceOrientationControls } from 'three/examples/jsm/controls/DeviceOrientationControls'

export var blockerHtml = `
<div style='position:absolute;width:100%;height:100%;opacity:0.7;z-index:100;background:#000;display: table;user-select: none;'>
  <span style='color: white;text-align: center;display: table-cell;vertical-align: middle;font-size:36px '>
  Click to start
  </span>
</div>
`

var btnHtml = `
<style>
  .btn.compass{
    filter: grayscale(100%);
    font-size: 30px;
    position: absolute;
    user-select: none;
    top: 5px;
    left: 5px;
  }
  .btn.compass[data-enabled="true"] {
    filter: none
  }
  
  .arrows{
    font-size: 40px;
    position: absolute;
    bottom: 10px;
    left: 10px;
    font-weight: 1000;
    text-align: center;
    user-select: none;
  }
  
  .arrows table td{
    height: 50px;
    width: 50px;
    padding: 0;
  }
  
  .arrows table td.btn{
    background-color: rgba(255,255,255,0.5);
    border-radius: 50%;
  }
</style>
<div class='btn compass'>🧭</div>
<div class='arrows'>
  <table>
    <tr><td></td><td class='btn forward'>↑</td><td></td></tr>
    <tr><td class='btn left'>←</td><td></td><td class='btn right'>→</td></tr>
    <tr><td></td><td class='btn backward'>↓</td><td></td></tr>
  </table>
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
    this.elBtnLeft = btns.querySelector('.left')
    this.elBtnRight = btns.querySelector('.right')
    this.elBtnCompass = btns.querySelector('.compass')

    btns.addEventListener('touchstart', this.onTouchStartPosition.bind(this), false)
    btns.addEventListener('touchend', this.onTouchEndPosition.bind(this), false)
    this.elBtnCompass.addEventListener('click', this.onCompassClick.bind(this), false)
  }

  initBlocker() {
    var blocker = document.createElement('div')
    blocker.innerHTML = blockerHtml
    document.body.insertBefore(blocker, document.body.firstChild)
    blocker.addEventListener('click', () => {
      this.onClick()
      document.body.requestFullscreen()
    })
    document.body.addEventListener('fullscreenchange', () => blocker.style.display = document.fullscreen ? 'none' : 'inherit')
  }

  update(delta) {
    this.dvcOrieControls.update()
    // this.controls.update(delta)
    // if(this.moveForwardPressed) this.moveForward(delta * 0.5 * this.moveForwardPressed)
  }

  onClick() {console.warn("must be redefined")}

  // touch rotation events
  onTouchStartRotation(event){
    //ignore 2nd touch
    if(event.targetTouches.length > 1) return

    this.coordsPageInit.x = event.targetTouches[0].pageX
    this.coordsPageInit.y = event.targetTouches[0].pageY
  }

  onTouchMoveRotation(event) {
    // console.log("move", event)
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
    if(event.targetTouches.length > 0) return
    this.cameraRotationInit = this.camera.rotation.clone()
  }

  // touch position events
  onTouchStartPosition(event) {
    switch (event.target) { //or this.isTouchBtn(event.targetTouches[0], this.btnForward)
      case this.elBtnForward: this.forwardPressed = true; break;
      case this.elBtnBackward: this.backwardPressed = true; break;
      case this.elBtnLeft: this.leftPressed = true; break;
      case this.elBtnRight: this.rightPressed = true; break;
    }
  }

  onTouchEndPosition(event) {
    this.forwardPressed = this.backwardPressed = this.leftPressed = this.rightPressed = false
  }

  onCompassClick(e) {
    this.elBtnCompass.dataset.enabled = this.dvcOrieControls.enabled = !this.dvcOrieControls.enabled
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
