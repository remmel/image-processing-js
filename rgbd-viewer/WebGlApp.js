import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export default class WebGlApp {
  /** @param {HTMLElement|null} el*/
  constructor(el) {
    el = el || document.body
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, el.clientWidth / el.clientHeight, 0.1, 1000)

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(el.clientWidth, el.clientHeight)
    el.appendChild(this.renderer.domElement)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    this.scene.background = new THREE.Color(0x72645b)

    this.camera.position.set(2,2,2)
    this.scene.add(new THREE.AxesHelper(1));

    window.addEventListener('resize', () => this._onWindowResize(), false);
  }

  _onWindowResize() {
    this.camera.aspect = this.el.clientWidth / this.el.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.el.clientWidth, this.el.clientHeight);
  }

  createLight() {
    this.scene.add( new THREE.HemisphereLight( 0x443333, 0x111122 ) );
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    if(this.controls) this.controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
    this.animateCallback()
    this.renderer.render( this.scene, this.camera );
  }

  animateCallback() {}

  createDumbCube() {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    const cube = new THREE.Mesh( geometry, material );
    cube.position.set(-3,0.5,-3)
    return cube
  }

  // isBody() {
  //   return this.el.tagName === "BODY"
  // }
  //
  // getWidth() {
  //   return this.isBody() ? this.el.innerWidth : this.el.clientWidth
  // }
  //
  // getHeight() {
  //   return this.isBody() ? this.el.innerHeight : this.el.clientHeight
  // }
  //
  // getAspect() {
  //   return this.el.clientWidth / this.el.clientHeight
  // }
}
