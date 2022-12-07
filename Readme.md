1. Cannot find module 'D:\company_code\crawlBid\utils\constants' imported from D:\company_code\crawlBid\update\index.js   
解答：引入文件后面加后缀
2. SyntaxError: Cannot use import statement outside a module
解答：package.json 定义type:"module"
3. 合并excel行
解答：C2&TEXT(D2,"-HH:MM:SS")