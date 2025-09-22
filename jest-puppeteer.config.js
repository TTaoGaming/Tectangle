try { module.exports = require('./jest-puppeteer.config.cjs'); }
catch(e){ module.exports = { launch:{ headless:'new', args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream'], defaultViewport:{ width:1280, height:800 } }, server:{ command:'npx http-server -p 8080 -c-1', port:8080, launchTimeout:20000, debug:false } }; }
