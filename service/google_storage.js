const {Storage} = require('@google-cloud/storage');
const storage = new Storage({
    projectId: process.env.PROJECT_ID,
    keyFilename: process.env.PATH_TO_API_FILE,
});
const ffmpeg = require('ffmpeg');
const path = require('path');

async function create() {
    storage
        .getBuckets()
        .then((results) => {
            const buckets = results[0];

            console.log('Buckets:');
            buckets.forEach((bucket) => {
                console.log(bucket.name);
            });
        })
        .catch((err) => {
            console.error('ERROR:', err);
        });
}

/**
 *
 * @param bucketName
 * @param filename
 * @returns {Promise<void>}
 */
async function upload(bucketName, filename) {
// const bucketName = 'Name of a bucket, e.g. my-bucket';
// const filename = 'Local file to upload, e.g. ./local/path/to/file.txt';

    //console.log(await storage.bucket(bucketName));
// Uploads a local file to the bucket
    await storage.bucket(bucketName).upload(filename, {
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        gzip: true,
        metadata: {
            // Enable long-lived HTTP caching headers
            // Use only if the contents of the file will never change
            // (If the contents will change, use cacheControl: 'no-cache')
            cacheControl: 'public, max-age=31536000',
        },
    }).catch(console.error);

    console.log(`${filename} uploaded to ${bucketName}.`);
}

/**
 *
 * @param bucketName
 * @param srcFilename
 * @param destFilename
 * @returns {Promise<void>}
 */
async function download(bucketName, srcFilename, destFilename) {
// const bucketName = 'Name of a bucket, e.g. my-bucket';
// const srcFilename = 'Remote file to download, e.g. file.txt';
// const destFilename = 'Local destination for file, e.g. ./local/path/to/file.txt';

    const options = {
        // The path to which the file should be downloaded, e.g. "./file.txt"
        destination: destFilename,
    };

// Downloads the file
    await storage
        .bucket(bucketName)
        .file(srcFilename)
        .download(options);

    console.log(
        `gs://${bucketName}/${srcFilename} downloaded to ${destFilename}.`
    );
}

async function getUrl(bucketName, fileName) {
    let config = {
        action: 'read',
        expires: '03-17-2025'
    }, url;

    try {
        console.log("_______--" + fileName);
        url = await storage
            .bucket(bucketName)
            .file(fileName).getSignedUrl(config);

        console.log(url[0]);
        console.log("_______");
    } catch (e) {
        console.error(e);
        return false;
    }
    return url.length ? url[0] : false;
    //return `https://storage.googleapis.com/${CLOUD_BUCKET}/${filename}`;
}

async function compressFile(path, filename) {
    try {
        let video = await (new ffmpeg(path));
        let path_compress = `videos/compressed_${filename}`;
        console.log('path', path);
        console.log('path_compress', path_compress);
        //Обрезка видео
        console.error('____________----compresing--------________');

        await video
            .setVideoSize('140x?', true, false)
            /*            .setVideoStartTime(2)
                        .setVideoDuration(3)*/
            .save(path_compress, function (error, file) {
                if (error) {
                    console.error('error', error)
                } else {
                    console.log('Video file: ' + file);
                }

            });

        console.error('____________----compresing--------________');

        return {
            path_compress,
            compressed_filename: `compressed_${filename}`
        };

    } catch (e) {
        console.log(e.code);
        console.log(e.msg);
        return false;
    }
}

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

        await upload(process.env.BUCKET_NAME, file);

        removeFile(filename);
        removeFile(`compressed_${filename}`);

        let link = await getUrl(process.env.BUCKET_NAME, `compressed_${filename}`);


        res.status(200).send({
            'status': 'ok',
            'path': link,
        })
    }

}

function removeFile(name) {
    let file_path = path.join(appRoot, 'videos', name);

    try {
        if (fs.existsSync(file_path)) {
            fs.unlinkSync(file_path);
            console.log('File has been removed');
        } else {
            console.info(file_path , "File doesn't exist, won't remove it.");
        }
    } catch (e) {
        console.info(file_path, "File doesn't exist, won't remove it.");
    }
}

module.exports.compressFile = compressFile;
module.exports.upload = upload;
module.exports.download = download;
module.exports.getUrl = getUrl;
module.exports.create = create;
module.exports.sendToStore = sendToStore;
module.exports.removeFile = removeFile;


//todo before install
//https://habr.com/ru/post/359318/
//https://cloud.google.com/storage/docs/quickstart-gsutil#whats-next
//only authentication https://cloud.google.com/storage/docs/authentication
//=>curl https://sdk.cloud.google.com | bash
//=>exec -l $SHELL
//=>gcloud init
//=>gcloud auth activate-service-account --key-file  /home/alex/Downloads/42112-03cdc7eca475.json

