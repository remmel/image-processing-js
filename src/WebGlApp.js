import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import { RAD2DEG } from './pose-viewer/utils3d'


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
    this.enableVr()

    this.animateCallbacks = []

    this._canTransformControlIntersect = []
  }

  _onWindowResize() {
    this.camera.aspect = this.el.clientWidth / this.el.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.el.clientWidth, this.el.clientHeight)
  }

  animate() {
    this.renderer.setAnimationLoop(() => { //before requestAnimationFrame(this.animate.bind(this))
      if (this.orbitControls) this.orbitControls.update() // only required if controls.enableDamping = true, or if controls.autoRotate = true
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
    // console.log(this.renderer.xr, "totott")
    // this.renderer.xr.addEventListener('sessionstart', (event) =>{
    //   alert(1)
    // })

    // navigator.xr && navigator.xr.isSessionSupported('immersive-vr').then(supported => {
    //   if (supported) {
        document.body.appendChild(VRButton.createButton(this.renderer))
        this.renderer.xr.enabled = true
        // var cam = this.renderer.xr.getCamera()
    // console.log(cam)
      // }
    // })
  }

  createTransformControl() {
    var control = this.transformControl = new TransformControls(this.camera, this.renderer.domElement)
    this.scene.add(this.transformControl)
    control.addEventListener('dragging-changed', event => {
      if (this.orbitControls) this.orbitControls.enabled = !event.value
    })

    window.addEventListener('keydown', event => {
      switch (event.keyCode) {
        case 81: // Q
          control.setSpace(control.space === 'local' ? 'world' : 'local')
          break
        case 87: // W
          control.setMode('translate')
          break
        case 69: // E
          control.setMode('rotate')
          break
        case 82: // R
          control.setMode('scale')
          break
        case 32: // spacebar - pretty print position of object
          var obj = control.object
          console.log('position', prettyPrint(obj.position), 'euler', prettyPrint(obj.rotation))
          break
      }
    })
  }

  attachTransformControl(m) {
    if (!this.orbitControls.enabled) return
    console.log('attachTransformControl', m)
    if (!this.transformControl) this.createTransformControl()
    this.transformControl.attach(m)
  }

  canTransformControl(m){
    this._canTransformControlIntersect.push(m)

    if(!this._attachTransformOnClickEnabled) { //add the click listener only once
      console.log('attachTransformOnClick')
      this._attachTransformOnClick()
      this._attachTransformOnClickEnabled = true
    }
  }

  _attachTransformOnClick() {
    var raycaster = new THREE.Raycaster()
    this.initClickEvent((mouse) => {
      raycaster.setFromCamera(mouse, this.camera)
      var intersects = raycaster.intersectObjects(this._canTransformControlIntersect, true)
      console.log(intersects)
      intersects.some(intersect => {
        //FIXME quickfix to match group, should add something if is animatione
        var m = intersect.object.parent instanceof THREE.Group ? intersect.object.parent : intersect.object
        this.attachTransformControl(m)
        return true
      })
    })
  }
}

function prettyPrint(object) {
  if (object instanceof THREE.Vector3)
    return '(' + [object.x.toFixed(3), object.y.toFixed(3), object.z.toFixed(3)].join(',') + ')'
  else if (object instanceof THREE.Euler) {
    return '(' + [object.x.toFixed(2), object.y.toFixed(2), object.z.toFixed(2)].join(',') + ')'
      + ' (' + [(object.x * RAD2DEG).toFixed(1), (object.y * RAD2DEG).toFixed(1), (object.z * RAD2DEG).toFixed(1)].join(',') + ')'
  } else if (object instanceof THREE.Quaternion) {
    return '(' + [object.x, object.y, object.z, object.w].join(',') + ')'
  }
}
