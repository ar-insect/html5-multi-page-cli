## HTML5 CLI

基于`Webpack` 和 `Express`的一个html5 multiple page开发环境

node >= 6.4

webpack >= 4.2.0

express >= 4.16.3

typescript >= 2.8.1

## 安装环境

`npm i`

在安装过程中可能会出现node-sass相关错误，请先全局安装`node-sass`，然后再次执行 npm i

## 开发

`npm start`

打开浏览器 http://localhost:3000

## 生产

`npm run build`

资源打包到build目录下面，如果需要测试请进入build目录，起一个`http-server`

## 语言环境

TypeScript

Sass

Html

在ts里面导入第三方类库，比如

`import $ from 'zepto';`

关于Typescipt更多内容：

[Typescript Document](https://www.typescriptlang.org/docs/home.html)

[TypeScript Handbook（中文版）](https://legacy.gitbook.com/book/zhongsp/typescript-handbook/details)
