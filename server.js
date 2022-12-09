const cluster = require('node:cluster')
const { fork } = require('node:child_process')
const os = require('node:os')
const process = require('node:process')
const schedule = require('node-schedule')
const path = require('node:path')
const { chromium } = require('playwright')
const { totalBidList, user } = require('./utils/constants.js')
const { GetBidList } = require('./update/list.js')
const Cache = require('cache-storage')
const FileStorage = require('cache-storage/Storage/FileSyncStorage');
const cache = new Cache(new FileStorage('./storage'), 'namespace');
const storage_state = cache.load('Storage')

const numCPUs = 3;
const id = "bidding"
function messageHandler(list) {
    totalBidList = totalBidList.reduce((pre, cur) => {
        let target = pre.find(ee => ee.id == cur.id)
        if (target) {
            Object.assign(target, cur)
        } else {
            pre.push(cur)
        }
        return pre
    }, list)
    console.log(totalBidList)
}
async function getBidList() {
    console.log("Starting bid list job...")
    const browser = await chromium.launch({
        headless: false
    });
    const context = await browser.newContext({
        storageState: storage_state || {},
        ignoreHTTPSErrors: true
    });
    const page = await context.newPage()
    //进入采招网登录页面
    if (!storage_state) {
        await page.goto('https://sso.bidcenter.com.cn/login')
        await page.locator('#txtusername').waitFor()
        //输入账号密码
        await page.fill('#txtusername', user.userName)
        await page.fill('#txtpassword', user.password)
        await page.screenshot({ path: 'screenShot/login.png' });

        await page.locator('#login_login_btn').waitFor()
        await page.click('#login_login_btn')
        // await page.goto(`https://search.bidcenter.com.cn/search?keywords=${searchText}&type=${bidType}`)
        await page.locator('#jq_btn_search').waitFor()
        //进入列表页面
        await page.click('#jq_btn_search')
        let storage = await context.storageState()
        cache.save('Storage', storage)
        await page.screenshot({ path: 'screenShot/main_search.png' })
    }
    try {
        await GetBidList(page)
        for (let i = 0; i < numCPUs; i++) {
            let worker = fork(`index.js`, {
                cwd: path.resolve(__dirname, 'update')
            });
            worker.send({ index: i, page:context, totalBidList })
        }
        for (const id in cluster.workers) {
            cluster.workers[id].on('message', messageHandler);
        }
        // await browser.close()
    } catch (error) {
        return Promise.reject(error)
    }
}

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    // 定时任务执行
    (async () => {
        await getBidList()
    })()

    schedule.scheduleJob(id, '30 * * * * *', async () => {
        try {

        } catch (error) {
            console.error("定时任务执行失败", error)
        }
    })

} 
