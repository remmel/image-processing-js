import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import { RAD2DEG } from './pose-viewer/utils3d'
import {TrackballControls} from "three/examples/jsm/controls/TrackballControls";
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { PlayerFPS } from './PlayerFPS'
import { CanTransformControlWebGlApp } from './CanTransformControlWebGlApp'


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
    this.camera.position.set(2, 2, 2)

    this.scene.background = new THREE.Color(0xcccccc)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(el.clientWidth, el.clientHeight)
    el.appendChild(this.renderer.domElement)

    this.scene.add(new THREE.AxesHelper(1))
    window.addEventListener('resize', () => this._onWindowResize(), false)

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement)
    // var player = new PlayerFPS(this.camera, this.renderer.domElement, this.scene)

    this.enableVr()

    this.animateCallbacks = []
  }

  _onWindowResize() {
    this.camera.aspect = this.el.clientWidth / this.el.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.el.clientWidth, this.el.clientHeight)
  }

  animate() {
    this.renderer.setAnimationLoop(() => {
      if (this.orbitControls) this.orbitControls.update()
      this.animateCallbacks.forEach(animateCallback => animateCallback())
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

  initClickEvent(onClickCb) {
    var canvas = this.renderer.domElement

    var lastpointerdown = null
    canvas.addEventListener('pointerdown', e => lastpointerdown = new Date())
    canvas.addEventListener('pointerup', e => {
      if (new Date() - lastpointerdown < 150) //short click only
        this._onClickXY(e.clientX, e.clientY, onClickCb)
    })

    canvas.addEventListener('touchstart', e => {
      if (!e.touches.length) return
      this._onClickXY(e.touches[0].pageX, e.touches[0].pageY, onClickCb)
    })
  }

  _onClickXY(xpx, ypx, onClickCb) {
    console.log('clicked', xpx, ypx)
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    var mouse = new THREE.Vector2()
    mouse.x = (xpx / this.el.clientWidth) * 2 - 1
    mouse.y = -(ypx / this.el.clientHeight) * 2 + 1
    onClickCb(mouse)
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
      this.initClickEvent(this.canTransform.onClick.bind(this.canTransform)) //FIXME dirty?
    }
    this.canTransform.canTransformControlAdd(m)
  }
}

