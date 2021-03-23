import * as THREE from "three";

export function createPhoto360(url) {
    const geometry = new THREE.SphereGeometry(500, 60, 40);
// invert the geometry on the x-axis so that all of the faces point inward
    geometry.scale(-1, 1, 1);

    const texture = new THREE.TextureLoader().load(url);
    const material = new THREE.MeshBasicMaterial({map: texture});

    return new THREE.Mesh(geometry, material);
}

export function createVideo360(url) {
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);// invert the geometry on the x-axis so that all of the faces point inward

    var video = document.createElement('video');
    video.src = url;
    // video.muted = true;
    video.loop = true
    video.playsInline = true
    video.crossOrigin = "anonymous"
    video.play()
    const texture = new THREE.VideoTexture(video);
    const material = new THREE.MeshBasicMaterial({map: texture});
    return new THREE.Mesh(geometry, material)
}