# split 360 image into 2 images. Image are 5376x2688, thus each is 2688*2688. Removing 20px en each side, it's 2648x2688

dir=/media/remmel/PHOTOGRA/dataset/2021-05-12_myroom180deg

mkdir ${dir}/center

#for file in *.png; do convert $file -filter point -resize 1440 resized1440/$file; done

for path in ${dir}/PIC_*.jpg ; do
    fn="$(basename -- $path)"
    outfn=${dir}/center/CTR_${fn}
    echo ${outfn}
    convert ${path} -crop 2648x+1364+ ${outfn}
done

#convert PIC_20210501_140340.jpg -crop 2648x+1364+ cropped.jpg
#
#convert PIC_20210501_140340.jpg -crop 1344x cropped.jpg
#convert cropped-3.jpg cropped-0.jpg +append cropped2.jpg
