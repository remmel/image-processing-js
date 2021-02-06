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

