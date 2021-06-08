# This script automatically renames files from ttf2fnt.com to fit the naming standard of this project,as JIMP only supports .fnt files
# To use this script, set the color to the color of the font in lowercase, and set the fntSize and fntName variables
# Unzip the .zip file from ttf2fnt.com and place its contents here
# All of the .png files, the fnt file, and the references to the pngs will automatically be renamed, assuming you set the variables correctly
# Note this script does NOT account for fnt fonts with 10 or more png files, as many variables are hard-coded

import os

PATH = os.path.dirname(os.path.realpath(__file__))

# Make sure to change these variables, otherwise the script won't work!
color = "black"
fntSize = 128
fntName = "Roboto-Regular"

for filename in os.listdir(PATH):
    if filename.startswith(fntName + ".ttf_"):
        num = filename[-5]
        newFileName = fntName + "_" + color + str(fntSize) + "_" + num + ".png"
        org_fp = os.path.join(PATH, filename)
        new_fp = os.path.join(PATH, newFileName);
        os.rename(org_fp, new_fp)
try:
    with open(os.path.join(PATH, fntName + ".ttf.fnt"), 'r') as f:
        lines = f.readlines()
    for line in range(len(lines)):
        if lines[line].startswith("page"):
            newLine = "page id=" + lines[line][8] + " file=\"" + fntName + "_" + color + str(fntSize) + "_" + lines[line][8] + ".png\"\n"
            lines[line] = newLine
    with open(os.path.join(PATH, fntName + ".ttf.fnt"), 'w') as f:
        f.writelines(lines)
    fntFileName = fntName + "_" + color + str(fntSize) + ".fnt"
    os.rename(os.path.join(PATH, fntName + ".ttf.fnt"), os.path.join(PATH, fntFileName))
except:
    pass