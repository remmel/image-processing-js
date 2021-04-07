export var sp1 = {
  folder: 'https://www.kustgame.com/ftp/2021-02-26_210438_speaking1',
}

export var coucoustool = {
  folder: 'https://www.kustgame.com/ftp/2021-03-09_205622_coucoustool',
}

export var cocinaObj = {
  obj: 'https://www.kustgame.com/ftp/cocina/depthmaps-lowlowalignhighest.obj',
  mtl: 'https://www.kustgame.com/ftp/cocina/depthmaps-lowlowalignhighest.mtl'
}

export function createRgbdUrls(folder, id) {
  return {
    depth: folder + '/' + id + '_depth16.bin',
    rgb: folder + '/' + id + '_image.jpg',
  }
}

export var closeup = {
  folder: 'https://www.kustgame.com/ftp/closeup'
}
