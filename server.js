require ('./config/config')

const {QR} = require('./models/qr');
const express = require('express');
const hbs = require('hbs');
hbs.registerHelper('breaklines', function(text) {
    text = hbs.Utils.escapeExpression(text);
    text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
    return new hbs.SafeString(text);
});
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/Scando', { useMongoClient: true });
mongoose.set('debug', true);
const appendQuery = require('append-query');

var app = express();
const port = process.env.PORT;

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');

var getDateTime = (seperate) => {
    if(seperate == '/'){
        var today = new Date();    
        var date = today.getDate()+seperate+(today.getMonth()+1)+seperate+today.getFullYear().toString();
        var time = ('0' + today.getHours()).slice(-2) + ":" + ('0' + today.getMinutes()).slice(-2) + ":" + ('0' + today.getSeconds()).slice(-2);
    }
    else {
        var today = new Date();    
        var date = today.getFullYear().toString()+seperate+(today.getMonth()+1)+seperate+today.getDate();
        var time = ('0' + today.getHours()).slice(-2) + ":" + ('0' + today.getMinutes()).slice(-2) + ":" + ('0' + today.getSeconds()).slice(-2);
    }
    
    return date + ' ' + time;
};  

app.get('/praya', (req, res) => {
    var qrCode = req.query.c;
    QR.findOne({qrCode}).then((doc) => {
        if(doc) {
            console.log(doc);
            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
            var newFullUrl = appendQuery(fullUrl,`c=${qrCode}&uniqcode=${doc.unicode}&logid=59E76969705285.17013661&action=rec&msisdn=&networkID=0` )
            var dateTime = getDateTime('/', 2);
            if(req.query.uniqcode === undefined || req.query.logid === undefined){
                return res.redirect(newFullUrl);
            } 
            return res.render('index.hbs', {
                qr: qrCode,
                unicode: doc.unicode,
                datetime: dateTime,
                imageLink: `/praya/?c=${qrCode}&uniqcode=${doc.unicode}`,
                buttonLink: `?flow=&uniqcode=${doc.unicode}&logid=59E76969705285.17013661&c=${qrCode}&action=rec&msisdn=&networkID=0`,
            });
        }
        else {
            var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
            var newFullUrl = appendQuery(fullUrl,`c=${qrCode}&uniqcode=FRMDVZFFQL4G55&logid=59E76969705285.17013661&action=rec&msisdn=&networkID=0` )
            var dateTime = getDateTime('/', 2);
            if(req.query.uniqcode === undefined || req.query.logid === undefined){
                return res.redirect(newFullUrl);
            } 
            return res.render('index.hbs', {
                qr: qrCode,
                unicode: 'FRMDVZFFQL4G55',
                datetime: dateTime,
                imageLink: `/praya/?c=${qrCode}&uniqcode=FRMDVZFFQL4G55`,
                buttonLink: `?flow=&uniqcode=FRMDVZFFQL4G55&logid=59E76969705285.17013661&c=${qrCode}&action=rec&msisdn=&networkID=0`,
                newFullUrl
            });
        }
    });
    
});

app.post('/praya', (req, res) => {
    var dateTime = getDateTime('/', 2);
    var qrCode = req.query.c;
    var text;
    var scanCount;
    var scanText ='';
    var image; 
    QR.findOne({qrCode}).then((doc) => {
        if(!doc) {
            throw new Error('qr code not found');
        }
        doc.scan.push({
            dateTime: getDateTime('-', 0),
            device: 'Mobile'
        });
        doc.save().then((newDoc) => {
            if (newDoc.unicode === req.query.uniqcode){
                if (newDoc.scan.length === 1){
                    //success
                    text = 'ขอบคุณที่ไว้วางใจใช้ praya สินค้านี้เป็นของแท้';
                    image = 'https://www.scan-do.com/assets/images/ok-010.png';;
                    pastScan = '';
                    scanCount = '';
                    scanText = '';
                } else {
                    //already scan
                    text = 'คำเตือน พบการสแกนสินค้าชิ้นนี้ไปแล้ว';
                    //scanCount = 'การสแกนครั้งนี้เป็นครั้งที่ ' + (newDoc.scan.length);
                    scanCount = '';
                    image = 'https://www.scan-do.com/assets/images/alert-002.png'
                    // var loop = (newDoc.scan.length > 10) ? 10 : newDoc.scan.length;
                    // for (var i = loop-1 ; i >= 0  ; i--){
                    //     scanText += '' + (loop-i) + ' : ' + newDoc.scan[newDoc.scan.length-(loop-i)].dateTime + ' by ' + newDoc.scan[newDoc.scan.length-(loop-i)].device + '\n';
                    // }
                    // pastScan= 'ประวัติการสแกน 10 ครั้งล่าสุด';
                    pastScan = '';
                }
            } else {
                //unicode not match
                text = 'This product is not genuine.';
                scanCount = 'ไม่พบรหัสนี้ในระบบนะคะ';        
                return res.render('scan.hbs', {
                    qr: qrCode,
                    text,
                    scanCount,
                    imageLink: `/praya/?c=${qrCode}&uniqcode=${req.query.uniqcode}`,
                    image: 'https://www.scan-do.com/assets/images/fail-007.png',
                    pastScan: `Fake Code / รหัสปลอม : ${req.query.c}`
                });
            }
            return res.render('scan.hbs', {
                qr: req.query.c,
                datetime: dateTime,
                text,
                scanCount,
                scanText,
                imageLink: `/praya/?c=${qrCode}&uniqcode=${req.query.uniqcode}`,
                image,
                pastScan,
                productCode: newDoc.productCode
            });
        });
    }).catch((e) => {
        //qr code not found
        text = 'ขออภัยไม่พบรหัสนี้ในระบบนะคะ';
        scanCount = '';        
        return res.render('scan.hbs', {
            qr: qrCode,
            datetime: dateTime,
            text,
            scanCount,
            imageLink: `/praya/?c=${qrCode}&uniqcode=${req.query.uniqcode}`,
            image: 'https://www.scan-do.com/assets/images/fail-008.png',
            pastScan: `Fake Code / รหัสปลอม : ${req.query.c}`
        });
    });
});

app.get('*', (req, res) => {
    res.redirect('https://scan-do.com/');
});

app.listen(port, () => {
    console.log(`Started up at port ${port}`);
});
  