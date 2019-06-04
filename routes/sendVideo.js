var express = require('express');
var router = express.Router();
var fs = require('fs');
const google_storage = require('../service/google_storage');
//const ffmpeg = require('fluent-ffmpeg');
const ffmpeg = require('ffmpeg');

let fstream;

/* GET users listing. */
router.post('/', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    let fstream;

    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        filename = validateFileName(filename);

        let path = 'videos/' + filename;

        fstream = fs.createWriteStream(path);

        file.pipe(fstream);
        fstream.on('close', async function () {

            console.log("path, filename: ", path, filename);
            let path_compress = `videos/compressed_${filename}`;


            try {
                let video = await (new ffmpeg(path));

                await video
                    .setVideoSize('140x?', true, false)
                    .setVideoStartTime(2)
                    .setVideoDuration(3)
                    .save(path_compress, async (error, file) => {await google_storage.sendToStore(error, file, filename, res)});


            } catch (error) {
                await google_storage.removeFile(filename);
                await google_storage.removeFile(`compressed_${filename}`);

                console.error('code', error.code, 'msg', error.msg);

                res.status(500).send({
                    'status': 'err',
                    'msg': error.msg,
                })
            }

        });
    });
});


function validateFileName(filename) {
    filename = filename.replace(/ /g, "_");
    filename = filename.replace(/\(|\)/g, "");

    return filename;
}

module.exports = router;
