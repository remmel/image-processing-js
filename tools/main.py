# Objective of that script is to colorize depth image, knowing that in hsv hue can store 1530 values (0-1529)
import struct

import cv2 as cv
import colorsys
import numpy as np
import os
import glob
import re
import subprocess
import json

# configuration
nearClip = 1000 # min depth, usually 0
farClip = 2100  # max depth, usually 1529mm for 1.5m, as hue range is 1529
w = 240
h = 180
topClip = 50  # 0
bottomClip = h - 10  # h=180

# Create HUE depth
def color_depth16grayscalepng(input, output):
    gray = cv.imread(input, cv.IMREAD_ANYDEPTH)
    w = gray.shape[1]
    h = gray.shape[0]

    print("processing", input, gray.shape)

    image = np.zeros((h, w, 3), np.uint8)
    for x in range(0,w):
        for y in range(topClip,bottomClip):
            depthmm = gray[y,x]/5 #png was encoded as 5000<=>1m
            if(depthmm >= nearClip and depthmm <= farClip): #only take care about depth between 0-1535 depth must be between 10cm and 1.5m
                depthclipped = (depthmm-nearClip)/(farClip-nearClip)
                hsv = colorsys.hsv_to_rgb(depthclipped, 1,1) #1530 different possible values (hsv : [0-1])
                image[y,x] = tuple(reversed((hsv[0]*255, hsv[1]*255, hsv[2]*255)))

    if output:
        cv.imwrite(output, image)
    else:
        cv.imshow("hsv", image)
        cv.waitKey(0)
        cv.destroyAllWindows()

def color_folder(dir):
    files = glob.glob(dir + "/" + "*_depth16.bin.png")
    os.makedirs(dir + "/output/240x180/", exist_ok=True)

    for path in files:
        print(path)
        fn = path.rsplit('/')[-1]
        id = re.findall(r'(\d+)_depth16.bin.png', fn)[0]
        color_depth16grayscalepng(path, dir+"/output/240x180/"+id+"_depthhue.png")


def write_json(dir):
    rgbddata = {
        'clip' : {
            'near': nearClip,
            'far': farClip,
            'top': topClip,
            'bottom': bottomClip,
        },
        'depth': {
            'w': 240,
            'h': 180,
            'fx': 178.824,
            'fy': 179.291,
            'cx': 119.819,
            'cy': 89.13
        },
        #rotation: [-0.4158014,0.5825261,0.5487262,-0.43204623],
    }

    with open(dir + '/rgbd.json', 'w') as outfile:
        json.dump(rgbddata, outfile, indent=2)


dir  = '/home/remmel/workspace/dataset/2021-04-12_190518_standupbrown6'

color_folder(dir)

os.makedirs(dir + "/output/1440x1080/", exist_ok=True)

# language=bash
subprocess.check_call("for file in *.png; do convert $file -filter point -resize 1440 ../1440x1080/$file; done",
                      shell=True, cwd=dir+"/output/240x180/")

# language=bash
subprocess.check_call("ffmpeg -y -framerate 25 -start_number 354 -i ../%08d_image.jpg -start_number 354 -i 1440x1080/%08d_depthhue.png -crf 20 -filter_complex vstack output_rgbd_1440x1080_crf20.mp4",
                      shell=True, cwd=dir+"/output/")


write_json(dir + "/output")

# color_depth16grayscalepng('/home/remmel/workspace/dataset/2021-04-12_190518_standupbrown6/00000354_depth16.bin.png', '/home/remmel/workspace/dataset/2021-04-12_190518_standupbrown6/video/00000354_depthhue.png')
