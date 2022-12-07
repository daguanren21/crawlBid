import { chromium } from 'playwright';
import { totalBidList, user } from '../utils/constants.js';
// import os from 'node:os'
import { GetBidList } from './list.js';
// import { p as P } from '@antfu/utils'
// const timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms))
let id = "bidding"
import schedule from 'node-schedule'
async function getBidListJob() {
    const browser = await chromium.launch({
        headless: false
    });
    const context = await browser.newContext();
    const page = await context.newPage()
    //进入采招网登录页面
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

    await page.screenshot({ path: 'screenShot/main_search.png' })
    try {
        await GetBidList(page)
        console.log(totalBidList)
        await browser.close()
    } catch (error) {
        return Promise.reject(error)
    }
}
(async function () {
    await getBidListJob()
})()
// 定时任务执行
// schedule.scheduleJob(id, '0 0 11 * * *', async () => {
//     try {

//     } catch (error) {
//         console.error("定时任务执行失败", error)
//     }
// })