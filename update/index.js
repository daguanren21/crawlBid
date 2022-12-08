
// import { p as P } from '@antfu/utils'
// const timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const { totalBidList } = require('../utils/constants.js')
const { GetBidDetail } = require('./detail.js')
//80
// 0-25
//25-50
// 50-80

process.on('message', async function (params) {
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
    for (let index = 0; index < list.length; index++) {
        const url = list[index].url;
        let detail = await GetBidDetail(params.page, url)
        list[index] = { ...detail, ...list[index] }
    }
    process.send(list)
})