# sudo apt-get install python3
# sudo apt-get install python3-opencv

import cv2 as cv
import matplotlib.pyplot as plt
import colorsys
import numpy as np
import os
import glob
import re
import subprocess
import json

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