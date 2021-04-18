import { loadObjFiles } from './LoadersHelper'
import WebGlApp from '../WebGlApp'
import * as THREE from 'three'
import { loadSceneCocina } from '../commons/demoscenes'

export async function initVr() {
    var webglApp

    document.getElementById('loading').onclick = e => demo(e.target)

    function demo(el) {
        el.disabled = true
        function cbLoading(percentage) {
            el.value = percentage === 1 ? "Loaded" : "Loading " + Math.round(percentage * 100) + "%"
        }
        loadSceneCocina(webglApp, null, cbLoading)
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
        webglApp.enableOrbitControls()
        webglApp.enableVr()
        webglApp.animate()

        if (window.location.search === '?demo')
            demo(document.getElementById('load-cocina'))
    }

    init()
}
