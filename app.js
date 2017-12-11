var express = require("express");
var app = express();
// 引用路由
var router = require("./router/router.js");
var session = require('express-session');

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));


// 模版引擎
app.set("view engine","ejs");

// 静态页面
app.use(express.static("./public"));
app.use("/avatar",express.static("./avatar"));

// 路由表
app.get("/",router.showIndex);

app.get("/regist",router.showRegist);
app.post("/doregist",router.doRegist);

app.get("/login",router.showLogin);
app.post("/dologin",router.doLogin);

app.get("/setavatar",router.showSetavatar);
app.post("/dosetavatar",router.doSetavatar);

app.get("/crop",router.showCrop);
app.get("/docrop",router.doCrop);

app.post("/postshuohsuo",router.doShuoshuo);

app.get("/allshuoshuo",router.showAllshuoshuo);

app.get("/userinfo",router.showUserinfo);

app.get("/shuoshuoamount",router.showShuoshuoamount);

app.get("/user/:user",router.showUser);

app.get("/userlist",router.showAlluser);

app.post("/dologout",router.doLogout);

app.listen(3000);