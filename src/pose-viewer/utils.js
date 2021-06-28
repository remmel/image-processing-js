export function closest(arr,num){
    return arr.reduce((prev, curr) => Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev);
}

/**
 * Generates an array of #repeat value, with v[i+1]=v[i]+step
 * @param repeat {Number}
 * @param step {Number}
 * @returns {Number[]}
 */
export function accumulate(repeat, step) {
    var values = []
    var accumulate = 0
    for (let i = 0; i < repeat; i++) {
        values.push(accumulate)
        accumulate += step
    }
    return values
}

// eg 52 => '00000052' - default is 8
export function idPad(i, count = 8) {
    return (i+'').padStart(count, '0')
}
