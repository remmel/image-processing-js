import cv2 as cv
import numpy as np
import os
import glob
import re

w = 240
h = 180

# https://github.com/remmel/recorder-3d/blob/2fba17ea005cce781bbef03d7f91698921bbfc06/Recorder3D/src/main/java/com/remmel/recorder3d/recorder/ImageUtils.java#L315
def write_depth_pnggrayscale(input, output):
    image = np.zeros((h, w), np.uint16)

    with open(input, "rb") as f:
        ba = bytearray(f.read())

        for y in range(0, h):
            for x in range(0, w):
                # if(x == w/2 and y == h/2):
                #     print('mid') #27*255=6885
                value2 = ba[(x+y*w)*2]
                value1 = ba[(x + y * w) * 2 +1]
                value16 = (value1 & 255) << 8 | (value2 & 255)
                # value16 = int.from_bytes(f.read(2), byteorder='little')
                depth = value16 & 0x1FFF
                confidence = (value16 >> 13) & 0x7
                # if(depth > 30 and depth < 2000):
                image[y,x] = depth * 5

    if output:
        cv.imwrite(output, image)
    else:
        cv.imshow("gray", image)
        cv.waitKey(0)
        cv.destroyAllWindows()

def writeall_depth_pnggrayscale(dir):
    files = glob.glob(dir + "/" + "*_depth16.bin")

    for path in files:
        print(path)
        fn = path.rsplit('/')[-1]
        write_depth_pnggrayscale(path, dir+"/"+fn+".png")

dir  = '/media/remmel/PHOTOGRA/dataset/2021-05-06_183516_myroom885/photos'
writeall_depth_pnggrayscale(dir)