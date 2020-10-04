export function csv2arrays(text) {
    var lines = text.split(/\r\n|\n/);
    var arrays = [];
    lines.forEach(line => {
        arrays.push(line.split(','));
    });
    return arrays;
}

//first line with me header
export function csv2objects(text) {
    var lines = csv2arrays(text);

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