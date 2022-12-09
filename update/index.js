
const { p: P } = require('@antfu/utils')
// const timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const { GetBidDetail } = require('./detail.js')
const { chromium } = require('playwright')
const Cache = require('cache-storage')
const FileStorage = require('cache-storage/Storage/FileSyncStorage');
const cache = new Cache(new FileStorage('../storage'), 'namespace');
const storage_state = cache.load('Storage')
//80
// 0-25
//25-50
// 50-80

process.on('message', async function (params) {
    const browser = await chromium.launch();
    const context = await browser.newContext({
        storageState: storage_state || {},
        ignoreHTTPSErrors: true
    });
    const page = await context.newPage()
    let start = params.index * Math.floor(params.totalBidList.length / 3)
    let end = start + Math.floor(params.totalBidList.length / 3)
    if (params.index == 2) {
        end = params.totalBidList.length
    }
    let list = params.totalBidList.slice(start, end)
    // for (let index = 0; index < totalBidList.length; index++) {
    //     const url = totalBidList[index].url;
    //    
    //     // totalBidList[index] = { ...detail, ...totalBidList[index] }
    // }
    let newList = await P(list).map(async v => {
        let detail = await GetBidDetail(page, v.url)
        return {
            ...v,
            ...detail
        }
    })
    // for (let index = 0; index < list.length; index++) {
    //     const url = list[index].url;

    //     list[index] = { ...detail, ...list[index] }
    // }
    process.send(newList)
})