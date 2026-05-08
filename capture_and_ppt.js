const puppeteer = require('puppeteer');
const PptxGenJS = require('pptxgenjs');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

async function run() {
    console.log("Starting local server...");
    const serverProcess = spawn('node', ['server.js'], { detached: true });
    
    await delay(3000); // wait for server to start

    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    const screenshots = {};
    const ssPath = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(ssPath)) fs.mkdirSync(ssPath);

    try {
        console.log("Capturing Super Admin Login...");
        await page.goto('http://localhost:3000/index.html');
        await delay(1000);
        await page.screenshot({ path: path.join(ssPath, '1_sa_login.png') });
        screenshots.saLogin = path.join(ssPath, '1_sa_login.png');

        console.log("Logging in as Super Admin...");
        await page.type('#username', 'admin');
        await page.type('#password', 'admin123');
        await page.click('button[type="submit"]');
        await delay(2000);

        console.log("Capturing Super Admin Dashboard...");
        await page.screenshot({ path: path.join(ssPath, '2_sa_dash.png') });
        screenshots.saDash = path.join(ssPath, '2_sa_dash.png');

        console.log("Capturing Schools page...");
        await page.goto('http://localhost:3000/schools.html');
        await delay(2000);
        await page.screenshot({ path: path.join(ssPath, '3_sa_schools.png') });
        screenshots.saSchools = path.join(ssPath, '3_sa_schools.png');

        console.log("Capturing Add School...");
        await page.goto('http://localhost:3000/add-school.html');
        await delay(1000);
        await page.screenshot({ path: path.join(ssPath, '4_sa_add_school.png') });
        screenshots.saAddSchool = path.join(ssPath, '4_sa_add_school.png');

        // Logout
        await page.evaluate(() => localStorage.clear());
        
        console.log("Capturing School Admin Login...");
        await page.goto('http://localhost:3000/school-admin/index.html');
        await delay(1000);
        await page.screenshot({ path: path.join(ssPath, '5_school_login.png') });
        screenshots.schoolLogin = path.join(ssPath, '5_school_login.png');

        console.log("Generating PPTX...");
        let pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';

        pptx.defineSlideMaster({
            title: 'MASTER_SLIDE',
            bkgd: 'FFFFFF',
            objects: [
                { rect: { x: 0, y: 0, w: '100%', h: 0.7, fill: '4338CA' } },
                { text: { text: 'ATKool Platform Walkthrough', options: { x: 0.5, y: 0.15, w: 8, h: 0.4, color: 'FFFFFF', fontSize: 18, bold: true } } },
                { rect: { x: 0, y: '95%', w: '100%', h: 0.3, fill: '1e293b' } }
            ]
        });

        // Title
        let slide1 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
        slide1.addText('ATKool: Next-Generation School Management', { x: 1, y: 2.0, w: 8, h: 1, fontSize: 32, bold: true, color: '4338CA', align: 'center' });

        // Add slides with screenshots
        let slidesData = [
            { title: 'Super Admin Login', file: screenshots.saLogin },
            { title: 'Super Admin Dashboard', file: screenshots.saDash },
            { title: 'Schools Management', file: screenshots.saSchools },
            { title: 'Creating a New School', file: screenshots.saAddSchool },
            { title: 'School Admin Login', file: screenshots.schoolLogin }
        ];

        for (let item of slidesData) {
            let slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
            slide.addText(item.title, { x: 0.5, y: 0.8, w: 9, h: 0.5, fontSize: 24, bold: true, color: '0F172A' });
            slide.addImage({ path: item.file, x: 0.5, y: 1.5, w: 8.8, h: 5.0 });
        }

        await pptx.writeFile({ fileName: 'ATKool_Platform_Presentation.pptx' });
        console.log('Presentation created successfully with screenshots.');

    } catch (err) {
        console.error(err);
    } finally {
        await browser.close();
        process.kill(-serverProcess.pid);
        serverProcess.kill();
        process.exit(0);
    }
}

run();
