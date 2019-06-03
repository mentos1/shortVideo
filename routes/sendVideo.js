var express = require('express');
var router = express.Router();
var fs = require('fs');
const google_storage = require('../service/google_storage');

/* GET users listing. */
router.post('/', function (req, res, next) {
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        filename = filename.replace(/ /g, "_");
        filename = filename.replace(/\(|\)/g, "");
        let path = 'videos/' + filename;
        console.log("Uploading: " + filename);

        fstream = fs.createWriteStream(path);
        file.pipe(fstream);
        fstream.on('close', async function () {
            let path_compress = await google_storage.compressFile(path, filename);
            console.log("path_compress: " + path_compress);

            await google_storage.upload(process.env.BUCKET_NAME, path_compress);
            let link = await google_storage.getUrl(process.env.BUCKET_NAME, filename);

            console.log('link', link);

            res.status(200).send({
                'status': 'ok',
                'link': link,
            });
        });
    });
    //res.sendFile(appRoot + '/videos/ico_large.MOV')
});

module.exports = router;
