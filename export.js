const puppeteer = require('puppeteer');
const Xvfb      = require('xvfb');
var xvfb        = new Xvfb({silent: true});
var width       = 1280;
var height      = 720 + 80 + 50 // plus the height of tab and warning messages;
var options     = {
  headless: false,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ignoreDefaultArgs: ['--enable-automation'],
  args: [
    '--enable-usermedia-screen-capturing',
    '--allow-http-screen-capture',
    '--auto-select-desktop-capture-source=puppetcam',
    '--load-extension=' + __dirname,
    '--disable-extensions-except=' + __dirname,
    '--disable-infobars',
    `--window-size=${width},${height}`,
  ],
}

async function main() {
    xvfb.startSync()
    let url = process.argv[2], exportname = process.argv[3]
    const waitTime = process.argv[4] || 5000;
    if(!url){ url = 'http://tobiasahlin.com/spinkit/' }
    if(!exportname){ exportname = 'spinner.webm' }
    const browser = await puppeteer.launch(options)
    const pages = await browser.pages()
    const page = pages[0]
    await page._client.send('Emulation.clearDeviceMetricsOverride')
    await page.goto(url, {waitUntil: 'networkidle2'})
    await page.setBypassCSP(true)

    // Perform any actions that have to be captured in the exported video
    await page.waitFor(waitTime);

    await page.evaluate(filename=>{
        window.postMessage({type: 'SET_EXPORT_PATH', filename: filename}, '*')
        window.postMessage({type: 'REC_STOP'}, '*')
    }, exportname)

    // Wait for download of webm to complete
    await page.waitForSelector('html.downloadComplete', {timeout: 0})
    await browser.close()
    xvfb.stopSync()
}

main()

