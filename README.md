此项目为解决typescript下使用[腾讯云nodejs sdk](https://github.com/TencentCloud/tencentcloud-sdk-nodejs)没有类型声明的问题，仅为一个代码生成工具，生成文件为半成品，需要用户自己完善

已知问题如下：
- 原nodejs sdk没有注明是否可选，无法提取（工具提供可选参数配置功能，用于临时方案，等待官方方案）