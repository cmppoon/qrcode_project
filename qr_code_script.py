import sys
import qrcode
import random
import string
from PIL import Image
from PIL import ImageFont
from PIL import ImageDraw
import uuid 
from pymongo import MongoClient
import pprint

client = MongoClient()
client = MongoClient('localhost', 27017)
db = client.Scando
qrs = db.qrs
web_url = ""

for i in range (855112,855112+int(sys.argv[1]),1):
    productCode = "LB-%07d" % i
    qrtag='LB' + ''.join(random.choice(string.digits) for _ in range(3)) + ''.join(random.choice(string.ascii_uppercase) for _ in range(2)) + ''.join(random.choice(string.digits) for _ in range(3)) + ''.join(random.choice(string.ascii_uppercase) for _ in range(2)) + ''.join(random.choice(string.digits) for _ in range(2))
    uniqCode= ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(14))
    qr = qrcode.QRCode(
        version=2,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=6,
        border=1,
    )
    qr.add_data(web_url+'/?c='+qrtag)
    qr.make(fit=True)
    #img = qr.make_image().save("test.png","PNG")
    img = qr.make_image().convert('RGBA')
    fin = open("Logo LB.jpg")
    im = Image.open(fin)
    im.paste(img,(55,60))
    draw = ImageDraw.Draw(im)
    fnt = ImageFont.truetype('/Library/Fonts/Times New Roman.ttf', 26)
    draw.text((115,35), productCode,font=fnt,fill="black")
    fnt = ImageFont.truetype('/Library/Fonts/Times New Roman.ttf', 27)
    draw.text((45,245), qrtag,font=fnt, fill="black")
    im.show()
    im.save("e"+str(i)+".png","PNG")
    if (not qrs.find_one({"qrCode":qrtag })):
        insertData = {"productCode": productCode, "qrCode": qrtag, "unicode": uniqCode, "scan": []}
        qrs.insert_one(insertData)
