module.exports = {
    /**
     * Application configuration section
     * http://pm2.keymetrics.io/docs/usage/application-declaration/
     */
    apps: [
        // First application
        {
            name: 'prod',
            script: 'bin/www',
            cwd: '/home/alex/PhpstormProjects/zontoShortVideo',
            env: {
                NODE_ENV: 'production',
                PORT    : '8044',
                BUCKET_NAME    : 'zonto_video',
                PROJECT_ID    : 'shining-haiku-236515',
                PATH_TO_API_FILE    : 'apiKeys/api.json',
                CUT_VIDEO_OFFSET    : '2',
                CUT_VIDEO_LIMIT    : '3',
                SIZE_VIDEO    : '140x?', //https://www.npmjs.com/package/ffmpeg

            },
            exec_mode: "cluster",
            instances: 1,
            log_date_format: "YYYY-MM-DD HH:mm:ss",
            min_uptime: "15s",
            max_restarts: 100,
            max_memory_restart: "400M",
            cron_restart: "0 1 * * *",
        }
    ]
};
