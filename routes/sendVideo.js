var express = require('express');
var router = express.Router();
var fs = require('fs');
const google_storage = require('../service/google_storage');
//const ffmpeg = require('fluent-ffmpeg');
const ffmpeg = require('ffmpeg');
const path = require('path');
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

/*            removeFile(filename);
            removeFile(`compressed_${filename}`);*/

            try {
                let video = await (new ffmpeg(path));

                await video
                    .setVideoSize('140x?', true, false)
                    .setVideoStartTime(2)
                    .setVideoDuration(3)
                    .save(path_compress, async (error, file) => {await sendToStore(error, file, filename, res)});


            } catch (error) {
                await removeFile(filename);
                await removeFile(`compressed_${filename}`);

                console.error('code', error.code, 'msg', error.msg);

                res.status(500).send({
                    'status': 'err',
                    'msg': error.msg,
                })
            }

        });
    });
});

async function sendToStore(error, file, filename, res) {
    if (error) {
        console.log('Video error: ' + error);
        removeFile(filename);
        removeFile(`compressed_${filename}`);


        res.status(500).send({
            'status': 'err',
            'msg': error,
        })
    } else {
        console.log('conversion Done: ' + file);

        await google_storage.upload(process.env.BUCKET_NAME, file);

        removeFile(filename);
        removeFile(`compressed_${filename}`);

        let link = await google_storage.getUrl(process.env.BUCKET_NAME, `compressed_${filename}`);


        res.status(200).send({
            'status': 'ok',
            'id': Math.random() * (100000000000000 - 1) + 1, //todo
            'path': link,
        })
    }

}

function removeFile(name) {
    let file_path = path.join('videos', name);

    try {
        if (fs.existsSync(file_path)) {
            fs.unlinkSync(file_path);
            console.log('File has been removed');
        } else {
            console.info("File doesn't exist, won't remove it.");
        }
    } catch (e) {
        console.info("File doesn't exist, won't remove it.");
    }
}


function validateFileName(filename) {
    filename = filename.replace(/ /g, "_");
    filename = filename.replace(/\(|\)/g, "");

    return filename;
}

module.exports = router;
