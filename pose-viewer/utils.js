import { readAsDataURL } from './form/formUtils'

export function closest(arr,num){
    return arr.reduce((prev, curr) => Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev);
}

export async function getImageUrl(urlOrFile) {
    if(typeof urlOrFile === 'string')
        return urlOrFile
    else if(urlOrFile instanceof File)
        return await readAsDataURL(urlOrFile);
}

export const URLDATAPIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='
