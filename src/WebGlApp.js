import * as THREE from 'three'
import { Vector3 } from 'three'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { CanTransformControlWebGlApp } from './CanTransformControlWebGlApp'
import { OrbitControlsPlus } from './commons/OrbitControlsPlus'


/**
 * ThreeJs base class with resize and click handled
 */
export default class WebGlApp {

  /** @param {HTMLElement|null} el*/
  constructor(el) {
    this.el = el = el || document.body
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, el.clientWidth / el.clientHeight, 0.01, 1000)
    // this.camera = new THREE.OrthographicCamera()

    this.scene.background = new THREE.Color(0xcccccc)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(el.clientWidth, el.clientHeight)
    el.appendChild(this.renderer.domElement)

    // this.renderer.gammaOutput = true
    // this.renderer.gammaFactor = 2.2

    this.scene.add(new THREE.AxesHelper(1))
    window.addEventListener('resize', () => this._onWindowResize(), false)

    this.animateCallbacks = []

    // this.enableVr()
    // this.enableOrbitControls()
  }

  _onWindowResize() {
    this.camera.aspect = this.el.clientWidth / this.el.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.el.clientWidth, this.el.clientHeight)
  }

  animate() {
    const clock = new THREE.Clock()
    this.renderer.setAnimationLoop(() => {
      const delta = clock.getDelta()
      this.animateCallbacks.forEach(animateCallback => animateCallback(delta))
      this.renderer.render(this.scene, this.camera)
    })
  }

  animateAdd(fn) {
    this.animateCallbacks.push(fn)
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
    // const light = new THREE.DirectionalLight(0xFFFFFF)
    // light.position.set(0, 10, 0)
    // light.target.position.set(-5, 0, 0)
    // this.scene.add(light)
    const ambientLight = new THREE.AmbientLight( 0xFFFFFF, 1);
    this.scene.add( ambientLight );

    //MeshBasicMaterial no light

    // const pointLight = new THREE.PointLight( 0xffffff, 0.8 );
    // this.camera.add( pointLight );
    return cube
  }

  initClickEvent() {
    var canvasEl = this.renderer.domElement

    var lastpointerdown = null
    canvasEl.addEventListener('pointerdown', e => lastpointerdown = new Date())
    canvasEl.addEventListener('pointerup', e => {
      if (new Date() - lastpointerdown < 150) //short click only
        this._dispatchClickEvent(e.clientX, e.clientY)
    })

    canvasEl.addEventListener('touchstart', e => {
      if (!e.touches.length) return
      this._dispatchClickEvent(e.touches[0].pageX, e.touches[0].pageY)
    })
  }

  _dispatchClickEvent(xpx, ypx) {
    var mouse = new THREE.Vector2()
    mouse.x = (xpx / this.el.clientWidth) * 2 - 1
    mouse.y = -(ypx / this.el.clientHeight) * 2 + 1
    this.renderer.domElement.dispatchEvent(new CustomEvent('clickcanvas', { 'detail': mouse }))
  }

  /**
   * @param {Vector3} v3 : initial camera position
   */
  enableOrbitControls(v3) {
    this.camera.position.copy(v3 ? v3 : new Vector3(1.5, 1.5, 1.5))
    this.orbitControls = new OrbitControlsPlus(this.camera, this.renderer.domElement)
    this.animateAdd((delta) => this.orbitControls.update(delta))
    this.scene.add(this.orbitControls.sphere)
  }

  /**
   * Enable VR if possible
   */
  enableVr() {
    navigator.xr && navigator.xr.isSessionSupported('immersive-vr').then(supported => {
      if (supported) {
        document.body.appendChild(VRButton.createButton(this.renderer))
        this.renderer.xr.enabled = true
      }
    })
  }

  canTransformControl(m){
    if(!this.canTransform){
      this.canTransform = new CanTransformControlWebGlApp(this.camera, this.scene, this.renderer, this.orbitControls)
      this.initClickEvent()
      this.renderer.domElement.addEventListener('clickcanvas', e => this.canTransform.onClick(e.detail))
    }
    this.canTransform.canTransformControlAdd(m)
  }
}

