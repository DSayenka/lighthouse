const fs = require('fs')
const puppeteer = require('puppeteer')
const lighthouse = require('lighthouse/lighthouse-core/fraggle-rock/api.js')


const waitTillHTMLRendered = async (page, timeout = 30000) => {
  const checkDurationMsecs = 1000;
  const maxChecks = timeout / checkDurationMsecs;
  let lastHTMLSize = 0;
  let checkCounts = 1;
  let countStableSizeIterations = 0;
  const minStableSizeIterations = 3;

  while(checkCounts++ <= maxChecks){
    let html = await page.content();
    let currentHTMLSize = html.length; 

    let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

    if(lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize) 
      countStableSizeIterations++;
    else 
      countStableSizeIterations = 0; //reset the counter

    if(countStableSizeIterations >= minStableSizeIterations) {
      console.log("Fully Rendered Page: " + page.url());
      break;
    }

    lastHTMLSize = currentHTMLSize;
    await page.waitForTimeout(checkDurationMsecs);
  }  
};

async function captureReport() {
	const browser = await puppeteer.launch({"headless": false, args: ['--allow-no-sandbox-job', '--allow-sandbox-debugging', '--no-sandbox', '--ignore-certificate-errors', '--disable-storage-reset=true']});
	const page = await browser.newPage();
	const baseURL = "http://localhost/";
	
	await page.setViewport({"width":1920,"height":1080});
	await page.setDefaultTimeout(10000);
	
	const navigationPromise = page.waitForNavigation({timeout: 30000, waitUntil: ['domcontentloaded']});
	await page.goto(baseURL);
    await navigationPromise;
	
	const flow = await lighthouse.startFlow(page, {
		name: 'demoblaze',
		configContext: {
		  settingsOverrides: {
			throttling: {
			  rttMs: 40,
			  throughputKbps: 10240,
			  cpuSlowdownMultiplier: 1,
			  requestLatencyMs: 0,
			  downloadThroughputKbps: 0,
			  uploadThroughputKbps: 0
			},
			throttlingMethod: "simulate",
			screenEmulation: {
			  mobile: false,
			  width: 1920,
			  height: 1080,
			  deviceScaleFactor: 1,
			  disabled: false,
			},
			formFactor: "desktop",
			onlyCategories: ['performance'],
		  },
		},
	});

  	//================================NAVIGATE================================
    await flow.navigate(baseURL, {
		stepName: 'open main page'
		});
  	console.log('main page is opened');
		
	//================================PAGE_ACTIONS================================
	await flow.startTimespan({ stepName: 'Navigate to "Tables" tab' });
		await page.waitForSelector('.main-menu a[href="/category/tables"]')
		await page.click('.main-menu a[href="/category/tables"]')
		await waitTillHTMLRendered(page);
		await page.waitForSelector('.pro-same-action a[href="/product/olive-table"]');
    await flow.endTimespan();
    console.log('"Navigate to Tables" is completed');
	
	await flow.startTimespan({ stepName: 'Open a table product' });
		await page.waitForSelector('.product-content a[href="/product/olive-table"]')
		await page.click('.product-content a[href="/product/olive-table"]')
		await waitTillHTMLRendered(page);
		await page.waitForSelector('.pro-details-cart button')
    await flow.endTimespan();
    console.log('"Open a table product" is completed');

	await flow.startTimespan({ stepName: 'Add table to Cart' });
		await page.waitForSelector('.pro-details-cart button')
		await page.click('.pro-details-cart button')
		await waitTillHTMLRendered(page);
		await page.waitForSelector('.shopping-cart-content');
    await flow.endTimespan();
    console.log('"Add table to Cart" is completed');

	await flow.startTimespan({ stepName: 'Open Cart' });
		await page.waitForSelector('button.icon-cart')
		await page.click('button.icon-cart')
        await waitTillHTMLRendered(page);
		await page.waitForSelector('.shopping-cart-content');
		await page.waitForSelector('.shopping-cart-btn a[href="/cart"]');
		await page.click('.shopping-cart-btn a[href="/cart"]')
		await waitTillHTMLRendered(page);
		await page.waitForSelector('.grand-totall > a[href="/checkout"]');
    await flow.endTimespan();
    console.log('"Open Cart" is completed');
	
	await flow.startTimespan({ stepName: 'Proceed to checkout' });
		await page.waitForSelector('.grand-totall > a[href="/checkout"]')
		await page.click('.grand-totall > a[href="/checkout"]')
        await waitTillHTMLRendered(page);
		await page.waitForSelector('button.btn-hover');
    await flow.endTimespan();
    console.log('"Proceed to checkout" is completed');
	
	//================================REPORTING================================
	const reportPath = __dirname + '/Darya_Sayenka.user-flow.report.html';
		
	const report = await flow.generateReport();
	
	fs.writeFileSync(reportPath, report);
		
    await browser.close();
}
captureReport();
