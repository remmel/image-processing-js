# split 360 image into 2 images. Image are 5792x2896, thus each is 2896x2896

# convert 360_0368.JPG -crop 2896x+2896+ crop/360_0368.JPG

dir=/media/remmel/PHOTOGRA/dataset/2021-05-14_myroomfisheye254/

mkdir ${dir}/crop

#for file in *.png; do convert $file -filter point -resize 1440 resized1440/$file; done

for path in ${dir}/*.JPG ; do
    fn="$(basename -- $path)"
    outfn=${dir}/crop/RIGHT_${fn}
    echo ${outfn}
    convert ${path} -crop 2896x+2896+ ${outfn}
done

#convert PIC_20210501_140340.jpg -crop 2648x+1364+ cropped.jpg
#
#convert PIC_20210501_140340.jpg -crop 1344x cropped.jpg
#convert cropped-3.jpg cropped-0.jpg +append cropped2.jpg
