import {loadObj, loadObjFiles} from './LoadersHelper'
import WebGlApp from '../WebGlApp'
import * as THREE from 'three'
import {Euler, Vector3} from 'three'
import {generateRgbdUrls, loadRgbdAnim} from './RgbdAnimLoader'

export async function initVr() {
    var webglApp

    document.getElementById('load-cocina').onclick = e => demo(e.target)
    var elLoadingAnim = document.getElementById('loading-animation')

    function demo(el) {
        el.disabled = true

        function cbLoading(percentage) {
            el.value = percentage === 1 ? "Loaded" : "Loading cocina " + Math.round(percentage * 100) + "%"
        }

        function cbLoadingAnim(percentage) {
            elLoadingAnim.innerText = percentage === 1 ? "Loaded" : "Loading anim " + Math.round(percentage * 100) + "%"
        }

        loadObj(
            'https://www.kustgame.com/ftp/cocina/depthmaps-lowlowalignhighest.obj',
            'https://www.kustgame.com/ftp/cocina/depthmaps-lowlowalignhighest.mtl', cbLoading)
            .then(m => {
                m.scale.set(0.157, 0.157, 0.157)
                m.rotation.x = 15 * 3.14 / 180
                m.position.y = 1.69
                //     m.position.copy(new Vector3(0,1.7,0))
                //     m.setRotationFromEuler(new Euler(0.25,0.00,0.01))
                webglApp.scene.add(m)
            })

        var urls = generateRgbdUrls('https://www.kustgame.com/ftp/2021-03-09_205622_coucoustool', 1472, 1550)
        loadRgbdAnim(urls, cbLoadingAnim).then(({m, animateCb}) => {
            webglApp.scene.add(m)
            m.setRotationFromEuler(new Euler(2.42, 0.64, 2.12))
            m.position.copy(new Vector3(-0.378, 1.363, -0.277))
            webglApp.animateAdd(animateCb)
        })
    }

    document.getElementById('browse').onchange = async e => {
        var m = await loadObjFiles(e.target.files)
        webglApp.scene.add(m)
    }

// because Oculus doesn't handle loading multiples files at once...
    var files = []
    Array.from(document.querySelectorAll('.browse-oculus input[type=file]')).forEach(input => input.addEventListener('change', e => {
        files.unshift(e.target.files[0]) //add at the biginning in case because I'm lazy to remove previous selection
    }))

    document.querySelector('.browse-oculus input[type=button]').onclick = async e => {
        e.target.disabled = true
        var m = await loadObjFiles(files)
        webglApp.scene.add(m)
    }

    async function init() {
        webglApp = new WebGlApp(document.body)
        webglApp.scene.add(new THREE.AmbientLight(0xFFFFFF, 1))

        webglApp.animate()


        if (window.location.search === '?demo')
            demo(document.getElementById('load-cocina'))
    }

    init()
}