import {DATASET_TYPE} from "./datasetsloader/datasetsloader.js";


function decodeUrl() {
    var params = new URLSearchParams(window.location.search);
    var datasetType = params.get("datasetType");
    var datasetFolder = params.get("datasetFolder");
    var scale = params.get("scale") ?? 1;
    return {datasetType, datasetFolder, scale};
}

/**
 * Init the form with the url params
 * The form is submitted to take into account new params
 */
export function getImportForm() {
    var {datasetType, datasetFolder, scale} = decodeUrl();
    if(!datasetType && !datasetFolder) {
        datasetType = DATASET_TYPE.ARENGINERECORDER; datasetFolder = 'https://raw.githubusercontent.com/remmel/rgbd-dataset/main/2020-11-26_121940';
    }

    //set form
    var $selectDsType = document.querySelector("select[name=datasetType]");
    fillSelect($selectDsType, DATASET_TYPE);
    $selectDsType.value = datasetType;

    var $inputDsFolder = document.querySelector("input[name=datasetFolder]");
    $inputDsFolder.value = datasetFolder;

    var $selectDsDemo = document.querySelector("select[name=querystring]");
    $selectDsDemo.value = "?datasetType="+datasetType+"&datasetFolder="+datasetFolder;

    return {datasetType, datasetFolder, scale}
}

export function getFormImportType() {
    return document.querySelector("select[name=datasetType]").value;
}

export function getFormExportType() {
    return document.querySelector("select[name=exportType]").value;
}

function fillSelect($selectElement, values) {
    var i=1;
    for(var key in values) {
        $selectElement.options[i++] = new Option(key, key);
    }
}

// popup the browse file window
export function browseFile() {
    return new Promise((resolve, reject) => {
        var $file = document.querySelector("input[name=file]");
        $file.addEventListener('change', e => {
            const reader = new FileReader()
            reader.onload = pe => resolve(pe.target.result);
            reader.readAsText(e.target.files[0])
        }, false);
        $file.click();
    });
}

export function readAsDataURL(file){
    return new Promise((resolve, reject) => {
        var fr = new FileReader();
        fr.onload = pe => resolve(pe.target.result);
        fr.readAsDataURL(file);
    });
}

export function readAsText(file) {
    return new Promise((resolve, reject) => {
        var fr = new FileReader();
        fr.onload = pe => resolve(pe.target.result);
        fr.readAsText(file);
    });
}
