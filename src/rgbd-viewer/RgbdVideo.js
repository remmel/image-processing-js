import * as THREE from 'three'
import { Group } from 'three'
import { HONOR20VIEW_DEPTH_INTRINSICS } from './RgbdLoader'
import { createElement } from '../commons/domUtils'

// language=shader
const SHADER_VERTEX = `
  uniform sampler2D map;

  uniform float width, height;
  uniform float nearClipping, farClipping; //if nearClipping=0, farClipping=1529: keep depth between [0-1.5m]
  uniform float fx, fy; //depth image focal, fx=~fy=~178px for 180x240 on my Honor20v
  uniform float pointSize;

  varying vec2 vUv;
  varying float visibility;

  const float  _Epsilon = .03;
  const float MAX_DIFF = 0.05;

  // return [0-1, 0-1, 0-1]
  vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

      float d = q.x - min(q.w, q.y);
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + _Epsilon)), d / (q.x + _Epsilon), q.x);
  }
  
  //between [0-1]
  float depth(vec2 depthvUv) {
      vec4 pixel = texture2D(map, depthvUv); //value of that pixel in rgba
      vec3 hsv = rgb2hsv(pixel.rgb);//values [0-1]
      float hue = hsv[0];
      if(hsv[1] <0.5) return 0.05; //dirty way to discard thoses value later
      if(hsv[2] <0.5) return 0.09;
      return hue;
  }
  
  // none of the point of that triangle is too far
  bool isCorrect(float deptha, float depthb, float depthc) {
      return abs(1.0 - deptha / depthb) < MAX_DIFF
          && abs(1.0 - depthb / depthc) < MAX_DIFF
          && abs(1.0 - depthc / deptha) < MAX_DIFF;
  }

  void main() { //position.x = [0;240[
    vec2 wh = vec2(width, height);
    vec2 depthvUv = position.xy / wh * vec2(1.0, 0.5);// + 0.4/wh;  //depth is horizontal half of video
      //I'm adding some space to take the center of the center of the pixel resized
    vUv = depthvUv + vec2(0.0, 0.5); //colorvUv is upper video part

    vec2 textureStep = 1.0 / wh;
      
    float depth0 = depth(depthvUv);
      
    if(depth0 < 0.1) return;
      
    float depth1 = depth(depthvUv + vec2(0.0,  textureStep.y));
    float depth2 = depth(depthvUv + vec2(textureStep.x, 0.0));
//    float depth3 = depth(depthvUv + vec2(0.0, -textureStep.y));
//    float depth4 = depth(depthvUv + vec2(-textureStep.x, 0.0));
//    float depth5 = depth(depthvUv + vec2(-textureStep.x, -textureStep.y));
    float depth6 = depth(depthvUv + vec2(textureStep.x,  textureStep.y));
//    float depth7 = depth(depthvUv + vec2(textureStep.x, -textureStep.y));
//    float depth8 = depth(depthvUv + vec2(-textureStep.x,  textureStep.y));
    visibility = 1.0;
    if(!isCorrect(depth0, depth1, depth2) || !isCorrect(depth2, depth1, depth6)) {
        visibility = 0.0;
        return;
    }
      
    float z = (depth0 * (farClipping - nearClipping) + nearClipping) / 1000.0; //z in meters
    // TODO check if lose less quality if depth is inverted
      
    //local position in meters
    vec4 pos = vec4(
      (position.x - width * 0.5) * z / fx,
      (position.y - height * 0.5) * z / fy,
      -z,
      1.0);

    gl_PointSize = pointSize;
    gl_Position = projectionMatrix * modelViewMatrix * pos;
  }
`

// language=shader
const SHADER_FRAGMENT = `
  uniform sampler2D map;
  varying vec2 vUv;
  varying float visibility;
  
  void main() { 
    if ( visibility < 0.9 ) discard;
    vec4 color = texture2D(map, vUv);
    gl_FragColor = vec4(color.r, color.g, color.b, 1.0); 
  }
`

/**
 * Display a video mixing rgb and depth data.
 * This is my custom format, up is color, down is depth.
 *
 * A simplier code with only depth : https://threejs.org/examples/?q=kinect#webgl_video_kinect
 * More info about how to create rgbd video in that repo
 *
 * TODO handle mesh (it only handle point cloud)
 */
export class RgbdVideo {
  constructor(url) {
    this.isMesh = true
    const elVideo = this.elVideo = createElement(`<video muted loop playsinline autoplay crossorigin='anonymous'>`)
    elVideo.src = url + "?ts="+new Date().getTime()
    elVideo.onloadedmetadata = this.onloadedmetadata.bind(this)

    this.mesh = new Group() //need to do that, otherwise, to use some loaded cb, TODO must extends Points or Object3D
  }

  onloadedmetadata(e) {
    // const width = this.elVideo.videoWidth, height = this.elVideo.videoHeight/2 //height divided by 2 because 2 vids
    const nearClipping = 0, farClipping = 1529*2
    // const nearClipping = 1757.81, farClipping = 2486.32

    const width = 512, height = 512 // I don't understand why width must be equals to height otherwise mesh is a mess
    // it would be better that width=240 and heigth=180 to have same grid that depth img
    var geometry = this.createGeometry(width, height)

    var texture = new THREE.VideoTexture(this.elVideo)
    texture.minFilter = THREE.NearestFilter

    var {fx, fy} = HONOR20VIEW_DEPTH_INTRINSICS
    //if depth image has been resized
    fx *= width / HONOR20VIEW_DEPTH_INTRINSICS.w, fy *= height / HONOR20VIEW_DEPTH_INTRINSICS.h

    var material = new THREE.ShaderMaterial({
      uniforms: {
        'map': { value: texture },
        'width': { value: width },
        'height': { value: height },
        'dimension': {value:  [width, height]},
        'nearClipping': { value: nearClipping },
        'farClipping': { value: farClipping },
        'pointSize': { value: 5 },
        'fx': {value: fx},
        'fy': {value: fy},
      },
      vertexShader: SHADER_VERTEX,
      fragmentShader: SHADER_FRAGMENT,
      transparent: true,
      // side: THREE.DoubleSide
      // wireframe: true
    })

    var m = this.isMesh ? new THREE.Mesh(geometry, material) : new THREE.Points(geometry, material)
    this.mesh.add(m)

    // force play and stop on 1st frame
    // this.elVideo.play().then(()=>setTimeout(() => {
    //   this.elVideo.pause()
    //   this.elVideo.currentTime = 0.0
    // }, 200))
    this.elVideo.play()
  }

  createGeometry(width, height) { //static
    var geometry = new THREE.BufferGeometry()

    // creates an array of Vec3(num_col, num_row, 0) for each pixel
    const vertices = new Float32Array(width * height * 3)
    for (let x = 0, i = 0; x < width; x++) {
      for (let y = 0; y < height; y++, i += 3) {
        vertices[i] = x //col
        vertices[i + 1] = y //row
      }
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

    // creates faces using index
    if(this.isMesh) {
      const faces = []
      for (let x = 0; x < width-1; x++) {
        for (let y = 0; y < height-1; y++) {
          // if(x%5==0 && y%5==0)
          faces.push(
            x + y * width, //0
            x + (y + 1) * width, //1
            (x + 1) + y * (width), //2

            (x + 1) + y * width, //2
            x + (y + 1) * width, //1
            (x + 1) + (y + 1) * (width),//6
          )
        }
      }
      geometry.setIndex(faces)
    }

    return geometry
  }

  play() {
    this.elVideo.play()
  }
}
