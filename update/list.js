import { GetBidDetail } from "./detail.js";
import { totalBidList, bidType, searchText } from '../utils/constants.js';
import moment from 'moment';
let currentPage = 1
// async function retryNavagateFn(page, url) {
//     try {
//         await page.goto(url)
//         await page.locator('#searchListArea').waitFor()
//         await page.waitForTimeout(2000)
//         await GetBidList(page)
//     } catch (error) {
//         await retryNavagateFn(page, url)
//     }

// }
export async function GetBidList(page) {
    let currentDate = moment(new Date()).subtract(1, "days").format('YYYY-MM-DD')
    if (currentPage === 1) {
        try {
            await page.goto(`https://search.bidcenter.com.cn/search?keywords=${searchText}&type=${bidType}`)
            await page.locator('#searchListArea').waitFor()
            await page.screenshot({ path: 'screenShot/GetBidList.png' })
        } catch (error) {
            await GetBidList(page)
        }
    }
    let allData = await page.$$eval('#searchListArea>.ssjg-list_cell', (elements) => {
        return elements.filter(v => v.querySelector('input[type="checkbox"]'))
            .map(element => {
                //获取
                let id = element.querySelector('input[type="checkbox"]').value
                return {
                    id,
                }

            });
    });
    const data = await page.$$eval('#searchListArea>.ssjg-list_cell', (elements, currentDate) => {
        return elements.filter(v => v.querySelector('input[type="checkbox"]'))
            .filter(v => v.querySelector('.ssjg-list_body>.ssjg-list_foot .ssjg-shijian').innerText === currentDate)
            .map(element => {
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
    }, currentDate);
    // for (let index = 0; index < data.length; index++) {
    //     const url = data[index].url;
    //     let detail = await GetBidDetail(page, url)
    //     data[index] = { ...detail, ...data[index] }
    // }
    totalBidList.push(...data)
    if (allData.length === 0 || data.length === 0) {
        return Promise.resolve(true)
    }
    if (allData[allData.length - 1].id === data[data.length - 1].id) {
        currentPage++
        try {
            await page.goto(`https://search.bidcenter.com.cn/search?keywords=${searchText}&type=${bidType}&mod=0&page=${currentPage}`)
            await page.locator('#searchListArea').waitFor()
            await page.screenshot({ path: 'screenShot/main_List.png' })
            await GetBidList(page)
        } catch (error) {
            await GetBidList(page)
        }
    } else {
        return Promise.resolve(true)
    }

    //     await page.locator('.layui-laypage-next').click()

}