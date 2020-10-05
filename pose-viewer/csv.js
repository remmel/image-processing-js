export function csv2arrays(text, separator = ',') {
    var lines = text.split(/\r\n|\n/);
    var arrays = [];
    lines.forEach(line => {
        arrays.push(line.split(separator));
    });
    return arrays;
}

//first line with me header
export function csv2objects(text, separator = ',') {
    var lines = csv2arrays(text, separator);

    var header = lines.shift();

    //console.log(header);
    var objects = [];

    lines.forEach(line => {
        var row = {};
        for(var i=0; i<header.length; i++) {
            var colName = header[i];
            //console.log(colName)
            row[colName] = line[i];
        }
        objects.push(row);
        //console.log(row)
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