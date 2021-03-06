import { readAsDataURL } from './form/formUtils'

export function closest(arr,num){
    return arr.reduce((prev, curr) => Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev);
}

//URL.createObjectURL(e.target.files[0]);
export async function getImageUrl(urlOrFile) {
    if(typeof urlOrFile === 'string')
        return urlOrFile
    else if(urlOrFile instanceof File)
        return await readAsDataURL(urlOrFile);
}

export const URLDATAPIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='

// eg 52 => '00000052' - default is 8
export function idPad(i) {
    return (i+'').padStart(8, '0')
}
