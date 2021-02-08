export function fillSelect($selectElement, values) {
    var i=1;
    for(var key in values) {
        $selectElement.options[i++] = new Option(key, key);
    }
}

// popup the browse file window, TODO inject input file in dom here
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

// TODO maybe readAsFnGeneric(file, readAsFn)
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

export function readAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        var fr = new FileReader();
        fr.onload = pe => resolve(pe.target.result);
        fr.readAsArrayBuffer(file);
    });
}
