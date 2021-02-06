import {DATASET_TYPE, DATASET_TYPE_EXPORT} from "../datasetsloader/datasetsloader.js";
import {fillSelect} from "./formUtils.js";


function decodeUrl() {
    var params = new URLSearchParams(window.location.search);
    var datasetType = params.get("datasetType");
    var datasetFolder = params.get("datasetFolder");
    var scale = params.get("scale") ? params.get("scale") : 1;
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

    fillSelect(document.querySelector("select[name=datasetTypeLocal]"), DATASET_TYPE_EXPORT);

    var $inputDsFolder = document.querySelector("input[name=datasetFolder]");
    $inputDsFolder.value = datasetFolder;

    var querystring = "?datasetType="+datasetType+"&datasetFolder="+datasetFolder;
    var $selectDsDemo = document.querySelector("select[name=querystring]");
    var isDemo = $selectDsDemo.querySelector('[value="'+querystring+'"]');
    if(isDemo)
        $selectDsDemo.value = querystring;

    //radio - when page loaded, can only be one of thoses values
    if(isDemo) document.querySelector("input[name=datasetSrc][value=demo]").checked = true;
    else document.querySelector("input[name=datasetSrc][value=remote]").checked = true

    updateSrcTab();

    if(datasetFolder.endsWith('/')) console.warn(datasetFolder + " must not end with slash (/)")

    //document.querySelector("input[name=datasetSrc]:checked").value
    return {datasetType, datasetFolder, scale}
}

export function getFormImportTypeLocal() {
    return document.querySelector("select[name=datasetTypeLocal]").value;
}

export function updateSrcTab() {
    var src = document.querySelector('input[name=datasetSrc]:checked').value;
    document.querySelectorAll('.tab-src').forEach(node => node.style.display = 'none');
    document.querySelectorAll('.tab-src-'+src).forEach(node => node.style.display='block');
}

document.getElementsByName('datasetSrc').forEach($input => $input.addEventListener('change', e => {
    updateSrcTab();
}));
