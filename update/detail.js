const { firstName } = require('../utils/constants.js')
const lxrReg = new RegExp(/采购经办人|项目联系人（询问）|项目联系人|联系人|联 系 人|项目联系人及联系方式/g)
const lxrDhReg = new RegExp(/电话|电　话|项目联系方式（询问）|联系方式|联系电话|采购联系电话/g)
const bhReg = new RegExp(/项目编号：|招标编号：/g)
const getPhoneNumber = /1[3456789]\d{9}|\d{3,}-\d{7,}[-\d{3,}]*/g
const getName = /[\u4e00-\u9fa5]{2,4}/g

async function GetBidDetail(page, url) {
    //跳转详情页面
    try {
        await page.goto(url)
        await page.waitForSelector('.detail_title')

    } catch {
        await GetBidDetail(page, url)
    }

    //获取采购单位
    let dw = await page.$eval('.gonggaoxinxi #yezhu', el => el.innerText);
    //获取采购代理商
    let agent = await page.$eval('.gonggaoxinxi #daili', el => el.innerText);
    //获取截至时间
    let endTime = await page.$eval('.gonggaoxinxi #endtime', el => el.innerText);
    //获取项目编号
    await page.locator()
    const iframe = await page.frameLocator('#detailiframe')
    // 常规情况
    const content = await iframe.locator('#content')
    let bh = '',
        lxr = '',
        lxdh = '';

    try {
        bh = await content.locator('p,tr,li', { hasText: bhReg }).innerText()
    } catch (error) {
    }
    try {
        lxr = await content.locator('p,tr,li', { hasText: lxrReg }).first().innerText()
    } catch (error) {
        
    }
    try {
        lxdh = await content.locator('p,tr,li', { hasText: lxrDhReg }).first().innerText()
    } catch (error) {
    }
    let phone = lxdh.match(getPhoneNumber) || lxr.match(getPhoneNumber)
    let name = lxr.match(getName) || lxdh.match(getName)

    let projectNumber = bh?.split('：')[1]
    if (projectNumber && projectNumber.indexOf('\n') !== -1) {
        projectNumber = projectNumber.split('\n')[0]
    }
    name && (name = name.filter(v => firstName.includes(v[0])))
    console.log({
        "截取前联系人": name,
        "截取前联系方式": phone,
        "联系电话": phone ? phone[0] : '',
        "联系人": name ? name[name.length - 1] : '',
        "项目编号": projectNumber
    })
    //获取联系人
    //获取联系方式
    //获取项目阶段
    await page.waitForTimeout(40000)//等待1分钟
    return Promise.resolve({
        dw, agent, endTime, bh: projectNumber || '', lxr: name ? name[name.length - 1] : '', lxdh: phone ? phone[0] : '', source: '采招网'
    })

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

module.exports = {
    GetBidDetail
}