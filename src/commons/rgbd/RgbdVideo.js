import * as THREE from 'three'
import { Group } from 'three'
import { HONOR20VIEW_DEPTH_INTRINSICS } from './RgbdMeshLoader'
import { createElement } from '../domUtils'

// language=shader
const SHADER_VERTEX = `
  uniform sampler2D map;
  uniform float width, height; //size of the mesh/point cloud
  uniform float nearClipping, farClipping; //if nearClipping=0, farClipping=1529: keep depth between [0-1.5m]
  uniform float fx, fy; //depth image focal, fx=~fy=~178px for 180x240 on my Honor20v
  uniform float pointSize;

  varying vec2 vUv;
  varying float visibility;

  const float  _Epsilon = .03;
  const float MAX_DIFF = 0.05; //is dependant of clip dimensions

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
    vec2 depthvUv = (position.xy + vec2(0.5)) / wh * vec2(1.0, 0.5);  //depth is horizontal half of video - add 0.5 to be in the "center" of the pixel
      //I'm adding some space to take the center of the center of the pixel resized
    vUv = depthvUv + vec2(0.0, 0.5); //colorvUv is upper video part

    vec2 textureStep = 1.0 / wh;
      
    float depth0 = depth(depthvUv);  //==depthSE
      
    if(depth0 < 0.1) return;
      
    // as same vertex is share with 6 triangles, should check all the triangles
    float depthSW = depth(depthvUv + vec2(-textureStep.x,  0.0));
    float depthNW = depth(depthvUv + vec2(-textureStep.x, -textureStep.y));
    float depthNE = depth(depthvUv + vec2(0.0,  -textureStep.y));
      
    visibility = 1.0;
    if(farClipping-nearClipping > 2000.0) { //no need to check if clipped inf 2m, because there are proably no background 
        if(!isCorrect(depthNW, depthSW, depth0) || !isCorrect(depthNW, depth0, depthNE)) {
            visibility = 0.0;
            return;
        }
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
    gl_FragColor = vec4(color.r, color.g, color.b, visibility); 
  }
`

/**
 * Display a video mixing rgb and depth data.
 * This is my custom format, up is color, down is depth.
 *
 * A simplier code with only depth : https://threejs.org/examples/?q=kinect#webgl_video_kinect
 * More info about how to create rgbd video in that repo
 *
 * The point close to the edges are lost because the vertex is shared with 6 triangles.
 * I tried to multiply by 6 the number of vertex (each face will have its own vertex - thus non indexed mesh),
 * and for each vertex indicate its position in the triangle (position.z=1-6) to be able in the shader to calculate the depth diff with 2 others vertices (taking in to account their position in the current triangle),
 * but it did not work and I don't know why. Anyways, it will make 6x more vertices, then for the moment it's easier to just make x2 on the depth resolution.
 * Another workaround could to distinguish edges with 0 depth and other object, to not remove thoses with edge 0 depth
 * Also if one of the vertex is far behind to put it on that depth than other 2 vertices
 * To finish because triangles have 2 differents orientations ( out of 4), somes triangles of other orientations could be place to edge to avoid having nothing
 * Another alternative could be to stay with points cloud, but with size which depend of the camera distance
 *
 * It would be better to extends Mesh or Points, but as it can be one or other, I extends Object3D stuff instead and the Mesh/Point will be a child
 */
export class RgbdVideo extends Group {
  /**
   * @param url can be a video, but for debugging purpose a png file
   * @param isMesh {Boolean} if it's Points or Mesh
   */
  constructor(url, isMesh = true) {
    super()

    if (url.toLowerCase().endsWith('.png')) { //poster instead?
      this.texture = new THREE.TextureLoader().load(url)
      this.addObject3D(isMesh)
    } else {
      const elVideo = this.elVideo = createElement(`<video muted loop playsinline autoplay crossorigin='anonymous'>`)
      elVideo.src = url + '?ts=' + new Date().getTime()
      this.texture = new THREE.VideoTexture(this.elVideo)
      this.texture.minFilter = THREE.NearestFilter
      elVideo.onloadedmetadata = () => {
        this.addObject3D(isMesh)
        this.play()
      }
    }
  }

  // TODO should add intrinsics and geometry size in a json or in video comment
  addObject3D(isMesh) {
    const nearClipping = 1000, farClipping = 2100 //hue range: 1529

    const width = 240, height = 180
    var geometry = this.createGeometry(width, height, isMesh)

    var {fx, fy} = HONOR20VIEW_DEPTH_INTRINSICS
    //if depth image has been resized
    fx *= width / HONOR20VIEW_DEPTH_INTRINSICS.w, fy *= height / HONOR20VIEW_DEPTH_INTRINSICS.h

    var material = new THREE.ShaderMaterial({
      uniforms: {
        'map': { value: this.texture },
        'width': { value: width },
        'height': { value: height },
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

    this.add(isMesh ? new THREE.Mesh(geometry, material) : new THREE.Points(geometry, material))
  }

  createGeometry(width, height, isMesh) { //static
    var geometry = new THREE.BufferGeometry()

    // creates an array of Vec3(num_col, num_row, 0) for each pixel
    const vertices = new Uint16Array(width * height * 3)
    const faces = []
    for (let x = 0, i = 0; x < width; x++) {
      for (let y = 0; y < height; y++, i++) {
        vertices[i*3 + 0] = x //col
        vertices[i*3 + 1] = y //row

        //not 1st row or col
        if(isMesh && x > 0 && y > 0) {
          //why this is height and not width???, idem below. This is what works after so many tests
          faces.push(i-height-1, i-1, i) //nw, sw, *se*◣
          faces.push(i-height-1, i, i-height) //nw, *se*, ne ◥
        }
      }
    }

    geometry.setAttribute('position', new THREE.Uint16BufferAttribute(vertices, 3))
    if(isMesh) geometry.setIndex(faces) //alternative to not use index, is to makes 6x vertices

    return geometry
  }

  play() {
    this.elVideo.play()
  }

  forcePause1stFrame() {
    this.elVideo.play().then(() => setTimeout(() => {
      this.elVideo.pause()
      this.elVideo.currentTime = 0.0
    }, 200))
  }
}
