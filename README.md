<!--  -->
### 个人网站

##### 计划功能点：
1、聊天（socket.io）
2、博客文章（评论,点赞）
3、收藏夹（个人网址收藏，个人小玩具连接，如相册，特效等）
-- 3个大模块之间采用多页应用方式（前期单页方式），模块内部为单页应用
##### 目录
servers 服务端，数据库mogoDB，


client 客户端
pc 移动 自适应，移动端优先
初始引用了antd-mobile ui库，只适用于移动端，
现计划适应antd-design 搭配响应式方案来开发；

#### 在自己的阿里云服务其=器部署
采用nginx作为静态文件服务器，history路由处理，监听端口号3006
在服务端项目启动：
在目录：/home/web-server/talk-web-systems/servers 
下执行脚本：npm run server 即可；
nginx 配置地址：/usr/local/nginx/conf/nginx.conf
``` js
server {
        listen       3006;
        #listen       somename:8080;
        server_name  47.104.107.19;
        location / {
            root   /home/web-server/talk-web-systems/build;
            index  index.html index.htm;
        }
	error_page 	404	/index.html;
  }
```
centos安装了locate可以查看文件路径 locate filename


