const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13';

const filesToDownload = [
    { url: `${BASE_URL}/codemirror.min.js`, dest: 'lib/codemirror.js' },
    { url: `${BASE_URL}/codemirror.min.css`, dest: 'lib/codemirror.css' },
    { url: `${BASE_URL}/mode/xml/xml.min.js`, dest: 'lib/mode/xml.js' },
    { url: `${BASE_URL}/mode/javascript/javascript.min.js`, dest: 'lib/mode/javascript.js' },
    { url: `${BASE_URL}/mode/css/css.min.js`, dest: 'lib/mode/css.js' },
    { url: `${BASE_URL}/mode/htmlmixed/htmlmixed.min.js`, dest: 'lib/mode/htmlmixed.js' },
    { url: `${BASE_URL}/theme/dracula.min.css`, dest: 'lib/theme/dracula.css' },
    { url: `${BASE_URL}/addon/edit/closebrackets.min.js`, dest: 'lib/addon/closebrackets.js' },
    { url: `${BASE_URL}/addon/edit/closetag.min.js`, dest: 'lib/addon/closetag.js' }
];

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const fullDestPath = path.join(__dirname, destPath);
        const dir = path.dirname(fullDestPath);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const file = fs.createWriteStream(fullDestPath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: status code ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded: ${destPath}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(fullDestPath, () => {});
            reject(err);
        });
    });
}

async function start() {
    console.log('Downloading offline libraries for CodeVision...');
    for (const file of filesToDownload) {
        try {
            await downloadFile(file.url, file.dest);
        } catch (error) {
            console.error(`Error downloading ${file.dest}:`, error.message);
        }
    }
    console.log('All downloads completed!');
}

start();
