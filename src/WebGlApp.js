import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'

/**
 * ThreeJs base class with resize and click handled
 */
export default class WebGlApp {
  /** @param {HTMLElement|null} el*/
  constructor(el) {
    this.el = el = el || document.body
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, el.clientWidth / el.clientHeight, 0.1, 1000)
    this.camera.position.set(2, 2, 2)

    this.scene.background = new THREE.Color(0xcccccc)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(el.clientWidth, el.clientHeight)
    el.appendChild(this.renderer.domElement)

    this.scene.add(new THREE.AxesHelper(1))
    window.addEventListener('resize', () => this._onWindowResize(), false)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.enableVr()
  }

  _onWindowResize() {
    this.camera.aspect = this.el.clientWidth / this.el.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.el.clientWidth, this.el.clientHeight)
  }

  animate() {
    if (this.renderer.xr.enabled) {
      this.renderer.setAnimationLoop(() => this.renderer.render(this.scene, this.camera))
    } else {
      requestAnimationFrame(this.animate.bind(this))
      if (this.controls) this.controls.update() // only required if controls.enableDamping = true, or if controls.autoRotate = true
      this.animateCallback()
      this.renderer.render(this.scene, this.camera)
    }
  }

  // maybe will need to add an array of fn, if finally multiple stuff must be done
  animateCallback() {
  }

  addDumbCubeWithLights() {
    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshStandardMaterial({ color: 0xbeedca })
    const cube = new THREE.Mesh(geometry, material)
    cube.position.set(-1, 0.5, -1)
    this.scene.add(cube)
    //TODO try to create natural sun light
    // this.scene.add(new THREE.AmbientLight(0xFFFFFF))
    // this.scene.add( new THREE.HemisphereLight( 0x443333, 0x111122 ) );
    const light = new THREE.DirectionalLight(0xFFFFFF)
    light.position.set(0, 10, 0)
    light.target.position.set(-5, 0, 0)
    this.scene.add(light)
    return cube
  }

  initClickEvent(callback) {
    var canvas = this.renderer.domElement

    canvas.addEventListener('click', e => {
      this._onClickXY(e.clientX, e.clientY, callback)
    })

    canvas.addEventListener('touchstart', e => {
      if (!e.touches.length) return
      this._onClickXY(e.touches[0].pageX, e.touches[0].pageY, callback)
    })
  }

  _onClickXY(xpx, ypx, callback) {
    console.log('clicked', xpx, ypx)
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    var mouse = new THREE.Vector2()
    mouse.x = (xpx / this.el.clientWidth) * 2 - 1
    mouse.y = -(ypx / this.el.clientHeight) * 2 + 1
    callback(mouse)
  }

  /**
   * Enable VR if possible
   */
  enableVr() {
    navigator.xr.isSessionSupported('immersive-vr').then(supported => {
      if (supported) {
        document.body.appendChild(VRButton.createButton(this.renderer))
        this.renderer.xr.enabled = true
      }
    })
  }
}
