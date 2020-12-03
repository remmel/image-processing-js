export function csv2arrays(text, separator = ',',parseNumber = false) {
    var lines = text.split(/\r\n|\n/);
    var arrays = [];
    lines.forEach(line => {
        if(!line) return;//ignore empty line, usually last row

        var row = line.split(separator);
        if(parseNumber)
            row = row.map(tryParseNumber);
        arrays.push(row);
    });
    return arrays;
}

function tryParseNumber(str) {
    var floatRegex = /^-?\d+(?:[.,]\d*?)?$/;
    if (!floatRegex.test(str)) return str;

    var val = parseFloat(str);
    if (isNaN(val)) return str;
    return val;
}

//first line with me header
export function csv2objects(text, separator = ',') {
    var lines = csv2arrays(text, separator);

    var header = lines.shift();

    var objects = [];

    lines.forEach(line => {
        var row = {};
        for(var i=0; i<header.length; i++) {
            var colName = header[i];
            row[colName] = line[i];
        }
        objects.push(row);
    })
    return objects;
}

// convert TUM rgbd dataset format (https://vision.in.tum.de/data/datasets/rgbd-dataset/download) to objects
export function rgbdtum2objects(text) {
    var lines = text.split(/\r\n|\n/);
    lines.shift();
    lines.shift();
    lines[0] = lines[0].substring(2);

    return csv2objects(lines.join("\n"), ' ');
}