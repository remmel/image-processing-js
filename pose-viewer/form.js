import {DATASET_TYPE} from "./datasetsloader.js";


export function getForm() {

    // get url values
    var params = new URLSearchParams(window.location.search);
    var datasetType = params.get("datasetType");
    var datasetFolder = params.get("datasetFolder");
    var scale = params.get("scale") ?? 1;

    if(!datasetType && !datasetFolder) {
        // datasetType = DATASET_TYPE.LUBOS; datasetFolder = 'dataset/20201003_161015.dataset';
        // datasetType = DATASET_TYPE.AR3DPLAN; datasetFolder = 'dataset/unityarf3dplanphoto';
        // datasetType = DATASET_TYPE.RGBDTUM; datasetFolder = 'dataset/rgbd_dataset_freiburg1_desk2';
        // datasetType = DATASET_TYPE.ARENGINERECORDER; datasetFolder = 'dataset/2020-11-26_121940';
        // datasetType = DATASET_TYPE.ALICEVISION_SFM; datasetFolder = 'dataset/2020-11-26_121940';
        // datasetType = DATASET_TYPE.AGILESOFT; datasetFolder = 'dataset/2020-11-26_121940';
        datasetType = DATASET_TYPE.ARENGINERECORDER; datasetFolder = 'https://raw.githubusercontent.com/remmel/rgbd-dataset/main/2020-11-26_121940';
    }

    //set form
    var i=1;
    var $selectDsType = document.querySelector("select[name=datasetType]");
    for(var key in DATASET_TYPE) {
        $selectDsType.options[i++] = new Option(key, key);
    }
    $selectDsType.value = datasetType;

    var $inputDsFolder = document.querySelector("input[name=datasetFolder]");
    $inputDsFolder.value = datasetFolder;

    var $selectDsDemo = document.querySelector("select[name=querystring]");
    $selectDsDemo.value = "?datasetType="+datasetType+"&datasetFolder="+datasetFolder;

    return {datasetType, datasetFolder, scale}
}



