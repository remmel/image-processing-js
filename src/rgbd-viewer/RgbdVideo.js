import * as THREE from 'three'
import { Group } from 'three'
import { HONOR20VIEW_DEPTH_INTRINSICS } from './RgbdLoader'

// language=shader
const SHADER_VERTEX = `
  uniform sampler2D map;

  uniform float width, height;
  uniform float nearClipping, farClipping; //if nearClipping=0, farClipping=1529: keep depth between [0-1.5m]
  uniform float fx, fy; //depth image focal, fx=~fy=~178px for 180x240 on my Honor20v
  uniform float pointSize;

  varying vec2 vUv;

  const float  _Epsilon = .03;

  // return [0-1, 0-1, 0-1]
  vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

      float d = q.x - min(q.w, q.y);
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + _Epsilon)), d / (q.x + _Epsilon), q.x);
  }

  void main() {
    vec2 depthvUv = vec2(position.x/width, position.y/height) * vec2(1.0, 0.5);
    vUv = vec2(position.x/width, position.y/height) * vec2(1.0, 0.5) + vec2(0.0, 0.5); //colorvUv
      
    vec4 pixel = texture2D(map, depthvUv); //value of that pixel in rgba
    vec3 hsv = rgb2hsv(pixel.rgb);//values [0-1]
    float hue = hsv[0];
    if(hsv[1] <0.70) return; //hue = 0.1;
    if(hsv[2] <0.70) return; //hue = 0.2;
      
    float z = (hue * (farClipping - nearClipping) + nearClipping) / 1000.0; //z in meters
    // if nearClipping=0 : float z = hue * farClipping / 1000.0; //z in meters
    // TODO check if lose less quality if depth is inverted
      
    //local position in meters
    vec4 pos = vec4(
      (position.x - width / 2.0) * z / fx,
      (position.y - height / 2.0) * z / fy,
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
  
  void main() {
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
    const elVideo = this.elVideo = document.createElement('video')
    elVideo.autoplay = true
    elVideo.muted = true
    elVideo.loop = true
    elVideo.playsinline = true
    elVideo.src = url + "?ts="+new Date().getTime()
    elVideo.onloadedmetadata = this.onloadedmetadata.bind(this)

    this.mesh = new Group() //need to do that, otherwise, to use some loaded cb, TODO must extends Points or Object3D
  }

  onloadedmetadata(e) {
    const width = this.elVideo.videoWidth, height = this.elVideo.videoHeight/2 //height divided by 2 because 2 vids
    const nearClipping = 0, farClipping = 1529*2

    var geometry = new THREE.BufferGeometry()

    //create an array of Vec3(num_col, num_row, 0) for each pixel
    const vertices = new Float32Array(width * height * 3)
    for (let i = 0, j = 0, l = vertices.length; i < l; i += 3, j++) {
      vertices[i] = j % width
      vertices[i + 1] = Math.floor(j / width)
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

    var texture = new THREE.VideoTexture(this.elVideo)
    texture.minFilter = THREE.NearestFilter

    var {fx, fy} = HONOR20VIEW_DEPTH_INTRINSICS
    //if depth image has been resized
    var ratio = width / HONOR20VIEW_DEPTH_INTRINSICS.w
    fx*=ratio, fy*=ratio


    var material = new THREE.ShaderMaterial({
      uniforms: {
        'map': { value: texture },
        'width': { value: width },
        'height': { value: height },
        'nearClipping': { value: nearClipping },
        'farClipping': { value: farClipping },
        'pointSize': { value: 1 },
        'fx': {value: fx},
        'fy': {value: fy},
      },
      vertexShader: SHADER_VERTEX,
      fragmentShader: SHADER_FRAGMENT,
    })

    this.mesh.add(new THREE.Points(geometry, material))
  }

  play() {
    this.elVideo.play()
  }
}
