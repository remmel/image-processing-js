import * as THREE from 'three'
import {DATASET_TYPE} from './datasetsloader/datasetsloader.js'
import {createMeshPly} from './utils3d.js'
import PoseCylinder from './PoseCylinder'
import WebGlApp from '../WebGlApp'

export class Scene3d {
    constructor(el) {
        this.webgl = new WebGlApp(el)
        this.meshPly = null
        this.groupPoses = new THREE.Group()
        this.webgl.scene.add(this.createFloor())
        this.webgl.scene.add(this.createLights())
        this.webgl.initClickEvent(this.onClickCanvas.bind(this))
        this.webgl.animate()
    }

    async renderPoses(poses, modelUrlOrFile, datasetType, scale) {
        this.removePoses()

        this.updateFloor(datasetType)

        for (var idxPose in poses) {
            var pose = poses[idxPose]
            pose.object = new PoseCylinder(pose, idxPose, scale, datasetType)
            // pose.object = new PoseCamera(pose, idxPose, scale, datasetType)
            this.groupPoses.add(pose.object)

        }
        if (modelUrlOrFile) {
            this.meshPly = await createMeshPly(modelUrlOrFile)
            if (this.meshPly) this.groupPoses.add(this.meshPly)
        }

        this.webgl.scene.add(this.groupPoses)
    }

    getMeshPly() {
        return this.meshPly
    }

    removePoses() {
        // scene.remove(groupPoses); //why it doesn't work?
        //FIXME: filter(true), otherwise not all the item is removed. Why scene.remove(groupPoses) doesnot work?
        this.groupPoses.children.filter(() => true).forEach(child => {
            this.groupPoses.remove(child) // need to .dispose also geometry
            child.geometry.dispose()
            // child.material.dispose(); //is
        })
    }

    // When clicking on pose, display images and info TODO add to webglApp raycasterableObjects = []
    onClickCanvas(mouse) {
        let raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(mouse, this.webgl.camera)
        let intersects = raycaster.intersectObjects(this.groupPoses.children) //scene.children
        intersects.some(intersect => {
            // if (!(intersect.object instanceof PoseCylinder)) return false
            this.onClickSelectPose(intersect.object)
            return true
        })
    }

    onClickSelectPose(obj) {
        console.warn("must be redefined")
    }

    createFloor() {
        var geo = new THREE.PlaneBufferGeometry(5, 5, 8, 8)
        var mat = new THREE.MeshBasicMaterial({color: 0x777777, side: THREE.DoubleSide})
        return this.floor = new THREE.Mesh(geo, mat)
    }

    updateFloor(datasetType) {
        switch (datasetType) {
            case DATASET_TYPE.AR3DPLAN:
            case DATASET_TYPE.RECORDER3D:
            case DATASET_TYPE.ALICEVISION_SFM:
            case DATASET_TYPE.AGISOFT:
            case DATASET_TYPE.LUBOS:
                //place floor like that as y is height
                this.floor.rotation.x = THREE.Math.degToRad(90) //plane.rotateX( - Math.PI / 2);
                this.floor.position.y = -1.6 //as we usually took the first image at that height
                this.webgl.camera.up = new THREE.Vector3(0, 1, 0) //default
                break
            case DATASET_TYPE.RGBDTUM:
                this.webgl.camera.up = new THREE.Vector3(0, 0, 1)
                break
            default:
                console.error('Default floor rotation as that dataset is not handled: ' + datasetType)
        }
    }

    createLights() {
        var group = new THREE.Group()
        var light1 = new THREE.DirectionalLight(0xffffff)
        light1.position.set(1, 1, 1)
        group.add(light1)
        var light2 = new THREE.DirectionalLight(0xffffff)
        light2.position.set(-1, -1, -1)
        group.add(light2)
        var light3 = new THREE.AmbientLight(0x999999)
        group.add(light3)
        return group
    }
}
