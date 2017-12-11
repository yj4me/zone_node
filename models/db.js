// 这个模块里封装对数据库的常用操作 

// 声明变量
var MongoClient = require('mongodb').MongoClient;
var setting = require("../setting.js");

// 连接数据库,加个下划线表示是内部函数
function _connectDB(callback){
	// 从setting文件中读取数据库地址
	var url = setting.dburl;

	MongoClient.connect(url,function(err,db){
		if(err){
			console.log("数据库连接失败");
			return;
		}

		callback(err,db);
	});
}

// 插入数据
exports.insertOne = function(collectionName,json,callback){
	_connectDB(function(err,db){
		// 表示连接成功之后做的事情
		// insertOne()方法的两个参数：文档数据，回调
		db.collection(collectionName).insertOne(json,function(err,result){
			callback(err,result);
			// 关闭数据库
			db.close();
		});
	});
};


// 查找数据
// json为查找条件
exports.find = function(collectionName,json,C,D){
	
	var result = [];//结果数组
	if(arguments.length == 3){
		var callback = C;
		var limit = 0;
		var skipnumber = 0;
	}else if(arguments.length ==4){
		var args = C;
		var callback = D;
		// pagesize
		var limit = args.pageamount || 0;
		//应该跳过的条数
		var skipnumber = args.pageamount * args.page || 0;	

		// 排序方式
		var sort = args.sort || {};
	}else{
		throw new Error("参数的个数必须是3个或者4个");
		return;
	}
	
	_connectDB(function(err,db){
		// 表示连接成功之后做的事情
		var cursor  = db.collection(collectionName).find(json).limit(limit).skip(skipnumber).sort(sort);
		cursor.each(function(err,doc){
			if(err){
				callback(err,null);
				return;
			}
			if(doc != null){
				result.push(doc);
			}else{
				// 遍历结束之后再去执行回调
				callback(null,result);
				// 关闭数据库
				db.close();
			}
		});
		
	});

}



// 修改
exports.updateMany = function(collectionName,json,newjson,callback){
	_connectDB(function(err,db){
		// 表示连接成功之后做的事情
		db.collection(collectionName).updateMany(
			json,newjson ,
	      function(err, results) {
	        callback(err, results);
	        // 关闭数据库
			db.close();
	   });
		
	});
}

// 删除
exports.deleteMany = function(collectionName,json,callback){
	_connectDB(function(err,db){
		// 表示连接成功之后做的事情
		db.collection(collectionName).deleteMany(
	      json,
	      function(err, result) {
	         callback(err, result);
	         // 关闭数据库
			db.close();
	      }
	   );
		
	});
}


// 得到文件总数
exports.getCount = function(collectionName,callback){
	_connectDB(function(err,db){
		// 表示连接成功之后做的事情
		db.collection(collectionName).count({}).then(function(count){
			console.log(count);
			callback(count);
			db.close();
		});
		
	});
}


