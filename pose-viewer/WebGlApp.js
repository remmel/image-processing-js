import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

/**
 * ThreeJs base class with resize and click handled
 */
export default class WebGlApp {
  /** @param {HTMLElement|null} el*/
  constructor(el) {
    this.el = el = el || document.body
    this.scene = new THREE.Scene()
    console.log(el.clientWidth, el.clientHeight)
    this.camera = new THREE.PerspectiveCamera(75, el.clientWidth / el.clientHeight, 0.1, 1000)

    this.scene.background = new THREE.Color(0xcccccc);
    this.scene.frog = new THREE.FogExp2(0xcccccc, 0.002);
    this.renderer = new THREE.WebGLRenderer({antialias: true})
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(el.clientWidth, el.clientHeight)
    el.appendChild(this.renderer.domElement)

    this.scene.add(new THREE.AxesHelper(1));
    window.addEventListener('resize', () => this._onWindowResize(), false);
  }

  _onWindowResize() {
    this.camera.aspect = this.el.clientWidth / this.el.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.el.clientWidth, this.el.clientHeight);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    if(this.controls) this.controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
    this.renderer.render( this.scene, this.camera );
  }

  initOrbitControl() {
    var controls = new OrbitControls(this.camera, this.renderer.domElement);
    //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.01;
    controls.maxDistance = 5;
    // controls.maxPolarAngle = Math.PI / 2;
    this.controls = controls
  }

  initClickEvent(callback) {
    var canvas = this.renderer.domElement;

    canvas.addEventListener('click' , e => {
      this._onClickXY(e.clientX, e.clientY, callback)
    })

    canvas.addEventListener('touchstart', e => {
      if(!e.touches.length) return;
      this._onClickXY(e.touches[0].pageX, e.touches[0].pageY, callback)
    })
  }

  _onClickXY(xpx, ypx, callback) {
    console.log('clicked', xpx, ypx)
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    var mouse = new THREE.Vector2();
    mouse.x = (xpx / this.el.clientWidth) * 2 - 1;
    mouse.y = -(ypx / this.el.clientHeight) * 2 + 1;
    callback(mouse)
  }
}
