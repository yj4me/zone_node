var formidable = require("formidable");
var db = require("../models/db.js"); 
var md5 = require("../models/md5.js");
var path = require("path");
var fs = require("fs");
// var gm = require('gm');
var gm = require('gm').subClass({imageMagick: true});
var filename = "";


// 首页
exports.showIndex = function(req,res,next){
    //检索数据库，查找此人的头像
    if (req.session.login == "1") {
        //如果登陆了
        var username = req.session.username;
        var login = true;
    } else {
        //没有登陆
        var username = "";  //制定一个空用户名
        var login = false;
    }

    // 去数据库中查找头像
    db.find("users",{"username":req.session.username},function(err,result){
        if(result.length == 0){
            var avatar = "moren.jpg";
        }else{
            var avatar = result[0].avatar;
        }
        res.render("index",{
            "login":req.session.login == "1" ? true :false,
            "username":req.session.login == "1" ? req.session.username : "",
            "avatar":avatar,
            "active":"首页"
        });
        
    });
	
}

// 注册页面
exports.showRegist = function(req,res,next){
	res.render("regist");
}
// 注册业务
exports.doRegist = function(req,res,next){
	// 得到用户填写的东西
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
    	// 得到表单之后做的事情
    	var username = fields.username;
    	var password = fields.password;
    	db.find("users",{"username":username},function(err,result){
    		if(err){
    			res.send("-3");
    			return;
    		}
    		if(result.length != 0){
    			res.send("-1");//被占用
    			return;
    		}
    		console.log(result.length);
    		// 查找结果长度为0，表示数据库中没有这条数据
    		// 数据写入数据库
    		// 设置md5加密
    		var jiami = md5(md5(password)+"author");
    		db.insertOne("users",{
    			"username":username,
    			"password":jiami,
                "avatar":"moren.jpg"

    		},function(err,result){
    			if(err){
    				res.send("-3");
    				return;
    			}
    			//注册成功，写入session
    			req.session.login = "1";
    			req.session.username = username;
    			res.send("1");

    		})
    	});

	});
}


// 登录页面
exports.showLogin = function(req,res,next){
    res.render("login");
}

// 登录业务
exports.doLogin = function(req,res,next){
    // 得到用户填写的东西
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        // 得到表单之后做的事情
        var username = fields.username;
        var password = fields.password;
        // md5加密后
        var jiami = md5(md5(password)+"author");
        // 查询数据库
        db.find("users",{"username":username},function(err,result){
            if(err){
                res.send("-3");
                return;
            }
            if(result.length == 0){
                res.send("-1");//用户不存在
                return;
            }
            console.log(result.length);
            // 用户存在，进一步匹配密码是否正确
            if(jiami == result[0].password){
                //登录成功，写入session
                req.session.login = "1";
                req.session.username = username;
                res.send("1");
                return;
            }else{
                res.send("-2");//密码错误
                return;
            }
        });

    });
}

// 修改头像页面
exports.showSetavatar = function(req,res,next){
    if(req.session.login != "1"){
        // 跳转到用户登陆页面，提示用户登录

        res.send("非法闯入，这个页面需要登录");
        return;
    }
    res.render("setavatar",{
        "login":true,
        "username":req.session.username
    });
}

// 设置头像
exports.doSetavatar = function(req,res,next){
    
     // parse a file upload
    var form = new formidable.IncomingForm();
    // 上传到的文件夹
    form.uploadDir = path.normalize(__dirname +"/../avatar/");
    form.parse(req, function(err, fields, files) {
        // console.log(fields);
        // console.log(files);
        if(err){
            next();
            return;
        }
        var oldpath = files.touxiang.path;
        // name: '标识.png',
        var extname = path.extname(files.touxiang.name);
        var houzhui = extname.split(".");
        var newpath = path.normalize(__dirname +"/../avatar/"+req.session.username +"."+ houzhui[1]);
        fs.rename(oldpath,newpath,function(err){
            if(err){
                res.send("改名失败");
                return;
            }
            // res.send("头像上传成功");
            // 图像上传成功之后进行页面跳转
            // 缓存图片
            req.session.avatar = req.session.username +"."+ houzhui[1];
            res.redirect("/crop");
        });
    });
}

// 显示切图页面
exports.showCrop = function(req,res){
    res.render("crop",{
        avatar:req.session.avatar
    });
}

// 执行切图
exports.doCrop = function(req,res){
    filename = req.session.avatar;
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y = req.query.y;
    console.log(w+" "+h+" "+x+" "+y);
    gm("./avatar/"+filename)
    // crop出错(应该是不带单位的数据！！！！)
        .crop(w,h,x,y)
        .resize(100,100,"!")
        .write("./avatar/"+ filename, function (err) {
            if (err){
                console.log(err);
                res.send("-1");
                return;
            }
            // 更改数据库中的头像
            db.updateMany("users",{"username":req.session.username},{
                $set:{"avatar":req.session.avatar}},function(err,result){
                    res.send("1");
                });
             
        });
}

//发表说说
exports.doShuoshuo = function(req,res){

    if(req.session.login != "1"){
        // 跳转到用户登陆页面，提示用户登录

        res.send("非法闯入，这个页面需要登录");
        return;
    }
    var username = req.session.username;
    // 得到用户填写的东西
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        // 得到表单之后做的事情
        var content = fields.content;

        db.insertOne("inshort",{
                "username":username,
                "content":content,
                "datetime":new Date().toLocaleString()

            },function(err,result){
                if(err){
                    res.send("-3");
                    return;
                }
                //注册成功，写入session
                req.session.login = "1";
                res.send("1");

            })

    });
}

// 显示说说
exports.showAllshuoshuo = function(req,res){
    // 分页
    var page = req.query.page;
    console.log(page);
    // args:集合名称（字符串类型），查询条件（对象），分页／排序（对象），回调函数
    // {"pageamount":pagesize,"page":page,sort:{"shijian":-1}},key固定不变
    db.find("inshort",{},{"pageamount":10,"page":page,sort:{"datetime":-1}},function(err,result){
            
        if(err){
            console.log("查找失败");
            return;
        }
        res.json({"result":result});
     });
}

// 列出某个用户的信息
exports.showUserinfo = function(req,res){
    var username = req.query.username;
    db.find("users",{"username":username},function(err,result){

        if(err){
            console.log("查找失败");
            return;
        }
        // 屏蔽密码
        var obj = {
            "username":result[0].username,
            "avatar":result[0].avatar,
            "_id":result[0]._id,
        };
        res.json(obj);
     });
}

// 说说总数目
exports.showShuoshuoamount = function(req,res){
    db.getCount("inshort",function(count){
        // console.log(count.toString());
        res.send(count.toString());
    })
}

exports.showUser = function(req,res){
    var user = req.params["user"];
    console.log(user);
    db.find("inshort",{"username":user},{sort:{"datetime":-1}},function(err,result){

        if(err){
            console.log("查找失败");
            return;
        }
        // console.log(result);
        db.find("users",{"username":user},function(err,result2){
            // console.log(result2);
            res.render("user",{
                "login":req.session.login == "1" ? true :false,
                "username":req.session.login == "1" ? req.session.username : "",
                "user":user,
                "active":"我的说说",
                "cirenshuoshuo":result,
                "cirentouxiang":result2[0].avatar
            });
        });
        
    });
}

exports.showAlluser = function(req,res){
    db.find("users",{},function(err,result){
        // console.log(result);
        res.render("userlist",{
            "login":req.session.login == "1" ? true :false,
            "username":req.session.login == "1" ? req.session.username : "",
            "active":"成员列表",
            "suoyouchengyuan":result
        });
    });
}

exports.doLogout = function(req,res){
    req.session.login  = -1;
    res.send("false");
}