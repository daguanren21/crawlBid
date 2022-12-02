import { chromium } from 'playwright';
import { bidType, searchText, user } from '../utils/constants.js';
import os from 'node:os'
// import { p as P } from '@antfu/utils'
import moment from 'moment';
const timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms))
let totalBidList = [];
let currentPage = 1;
(async function () {
    const browser = await chromium.launch({
        headless: false
    });
    console.log(os.path.isfile("login.json"))
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
    let currentDate = moment(new Date()).format('YYYY-MM-DD')
    await GetBidList(page)
    console.log(totalBidList)
})()

async function GetBidList(page) {
    if (currentPage === 1) {
        await page.goto(`https://search.bidcenter.com.cn/search?keywords=${searchText}&type=${bidType}`)
        await page.screenshot({ path: 'screenShot/GetBidList.png' })
        await page.locator('#searchListArea').waitFor()
    }
    await page.screenshot({ path: 'screenShot/main_List.png' })
    const data = await page.$$eval('#searchListArea>.ssjg-list_cell', elements => {
        return elements.filter(v => v.querySelector('input[type="checkbox"]')).map(element => {
            //获取
            let id = element.querySelector('input[type="checkbox"]').value
            //获取项目名称
            let name = element.querySelector('.ssjg-list_body>.ssjg-list_bt>a').title
            //获取发布日期
            let publishDate = element.querySelector('.ssjg-list_body>.ssjg-list_foot .ssjg-shijian').innerText
            //获取省份
            let province = element.querySelector('.ssjg-list_body>.ssjg-list_foot .diqu').title
            //获取项目 路由
            let url = element.querySelector('.ssjg-list_body>.ssjg-list_bt>a').href
            //获取详情内容
            let result = element.querySelector('.ssjg-list_body>.ssjg-list_bt>.ssjg-leixing').innerText
            return {
                id,
                name,
                url,
                result,
                publishDate,
                province,
            }
        });
    });
    for (let index = 0; index < data.length; index++) {
        const url = data[index].url;
        let { dw, agent, endTime } = await GetBidDetail(page, url)
        data[index].dw = dw
        data[index].agent = agent
        data[index].endTime = endTime
    }
    totalBidList.push(...data)
    if (data.length === 40) {
        await page.goto(`https://search.bidcenter.com.cn/search?keywords=${searchText}&type=${bidType}`)
        await page.waitForTimeout(2000)
        await page.locator('.layui-laypage-next').click()
        await page.waitForTimeout(2000)
        if (currentPage === 2) {
            return Promise.resolve(true)
        }
        currentPage++
        await GetBidList(page)
    }
}
function get_track(distance) {

    //移动轨迹
    let track = []
    //当前位移
    let current = 0
    //减速阈值
    let mid = distance * 4 / 5
    //计算间隔
    let t = 0.2
    //初速度
    let v = 1
    let a = 0
    while (current < distance) {
        if (current < mid) {
            a = 4
        } else {
            a = -3
        }
        let v0 = v
        //当前速度
        v = v0 + a * t
        //移动距离
        let move = v0 * t + 1 / 2 * a * t * t
        //当前位移
        current += move
        track.push(Math.round(move))
    }
    return track.filter(v => v !== 0)
}

async function retryDetailPage(page) {
    try {
        let s = await page.waitForSelector('div#nc_1_wrapper', { timeout: 2000 })
        if (s) {
            let box = await s.boundingBox()
            await page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)

            await page.hover('span[id="nc_1_n1z"]')
            await page.mouse.down()
            let x = box["x"] + box["width"] / 2
            // await page.mouse.move(box['x'] + 225, box['y'] + 10, { 'delay': 5000, 'steps': 56 })
            // await page.mouse.up()
            await page.screenshot({ path: 'screenShot/main_detail_box1.png' })
            let tracks = get_track(x)

            for (let index = 0; index < tracks.length; index++) {
                const track = tracks[index];
                await page.mouse.move(x + track, 0, steps = tracks.length)
                x += track
            }
            // await page.screenshot({ path: 'screenShot/main_detail_box2.png' })
            await page.mouse.up()
        }
    } catch (error) {
        try {
            await page.waitForSelector('.detail_title')
            return Promise.resolve(true)
        } catch (error) {
            await retryDetailPage(page)
        }
    }



}
async function GetBidDetail(page, url) {
    //跳转详情页面
    await page.goto(url)
    await retryDetailPage(page)
    await page.screenshot({ path: 'screenShot/main_detail.png' })

    //获取采购单位
    let dw = await page.$eval('.gonggaoxinxi #yezhu', el => el.innerText);
    console.log({
        "单位": dw
    })
    //获取采购代理商
    let agent = await page.$eval('.gonggaoxinxi #daili', el => el.innerText);
    //获取截至时间
    let endTime = await page.$eval('.gonggaoxinxi #endtime', el => el.innerText);
    return Promise.resolve({
        dw, agent, endTime
    })

}