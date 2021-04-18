# Objective of that script is to colorize depth image, knowing that in hsv hue can store 1530 values (0-1529)


# sudo apt-get install python3
# sudo apt-get install python3-opencv

import cv2 as cv
import matplotlib.pyplot as plt
import colorsys
import numpy as np
import os
import glob
import re

print(cv.__version__)


def convert_gray_to_hue():
    gray = cv.imread('depth-grayscale.png', cv.IMREAD_GRAYSCALE)

    if gray is None:
        print("Check if file exits")
        exit()

    # 640*480=307200
    print("dtype", gray.dtype, "size", gray.size)
    px = gray[100, 100]
    print("px", px )

    # plt.imshow(gray)
    # plt.show()

    # cv::Mat depthMat8UC1;
    # depth.convertTo(depthMat8UC1, CV_8UC1);
    #
    # cv::Mat falseColorsMap;
    # cv::applyColorMap(depthMat8UC1, falseColorsMap, cv::COLORMAP_AUTUMN);

    # cv::Mat depthMat8UC1;
    # depth.convertTo(depthMat8UC1, CV_8UC1);

    # //gray8b = cv.convertTo(cv.CV_8UC1)

    # cv.convertScaleAbs()

    # color = cv.applyColorMap(gray, cv.COLORMAP_HSV)
    # # color = cv.cvtColor(gray, cv.COLOR_GRAY2BGR)
    # cv.imwrite('hsv.png', color)
    # hsv = colorsys.hsv_to_rgb(0.01, 1.0, 1.0)
    # print(hsv)


    # cv.imshow('image',img)
    # cv.waitKey(0)
    # print( px )

def create_allcolors_map_hue():
    # w = 640
    # h = 480
    w = 3000
    h = 20
    image = np.zeros((h, w, 3), np.uint8)
    # image[:] = tuple(reversed((255, 0, 0))) # init with red. Since OpenCV uses BGR, convert the color first

    for x in range(0,w):
        for y in range(0,h):
            hsv = colorsys.hsv_to_rgb(x/w, 1,1)
            image[y,x] = tuple(reversed((hsv[0]*255, hsv[1]*255, hsv[2]*255)))

    cv.imshow("all", image)
    # cv.imwrite('all.png', image)
    cv.waitKey(0)
    cv.destroyAllWindows()

# TODO handle further object by changing s value
def color_depth16grayscalepng(input, output):
    gray = cv.imread(input, cv.IMREAD_ANYDEPTH)
    w = gray.shape[1]
    h = gray.shape[0]

    print("processing", input, gray.shape)

    nearClip = 0 # TODO handle it
    farClip = 1529*2 #or 1529+1530?

    image = np.zeros((h, w, 3), np.uint8)
    for x in range(0,w):
        for y in range(0,h):
            depthmm = gray[y,x]/5 #png was encoded as 5000<=>1m
            if(depthmm > 100 and depthmm <= farClip): #only take care about depth between 0-1535 depth must be between 10cm and 1.5m
                hsv = colorsys.hsv_to_rgb(depthmm/farClip, 1,1) #1536 different possible values
                image[y,x] = tuple(reversed((hsv[0]*255, hsv[1]*255, hsv[2]*255)))

    if output:
        cv.imwrite(output, image)
    else:
        cv.imshow("hsv", image)
        cv.waitKey(0)
        cv.destroyAllWindows()


def color_folder(dir):
    # print("process folder", os.listdir(dir))
    files = glob.glob(dir + "/" + "*_depth16.bin.png")

    for path in files:
        print(path)
        fn = path.rsplit('/')[-1]
        id = re.findall(r'(\d+)_depth16.bin.png', fn)[0]
        color_depth16grayscalepng(path, dir+"/video/"+id+"_depthhue.png")

color_folder('/home/remmel/workspace/dataset/2021-04-12_190518_standupbrown6')
# color_depth16grayscalepng('/home/remmel/workspace/dataset/2021-04-12_190518_standupbrown6/00000354_depth16.bin.png', '/home/remmel/workspace/dataset/2021-04-12_190518_standupbrown6/video/00000354_depthhue.png')