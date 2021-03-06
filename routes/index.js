var path = require('path');
var tplPath = path.join(__dirname, '../public/tpl/');
var shotPath = path.join(__dirname,  '../public/data/')
var url = require('url');
var exec = require('child_process').exec;
var async = require('async');
var request = require('request');
var config = require('../config')

function cmd_exec(cmd, args, options, cb_stdout, cb_end, cb_err) {
	var spawn = require('child_process').spawn,
	child = spawn(cmd, args, options),
	me = this,
	/*
	me = this;
	me.exit = 0;  // Send a cb to set 1 when cmd exits
	child.stdout.on('data', function (data) { cb_stdout(me, data) });
	child.stdout.on('end', function () { cb_end(me) });
	*/
	result = '';
	child.stdout.on('data', function(data) {
		result += data.toString();
	});
	child.on('exit', function(code) {
		//console.log("result:"+result);
		return cb_end(me,result);	
	});
	child.on('error', function(err){
		console.log("error");
		return cb_err(me,err);
	});
	child.stderr.on('data', function (data) {
	    //console.log('stderr: ' + data);
	});
//	spawn.on('error', function(data){
//		console.log("spawn error:"+data);
//		return cb_err(me, data);
//	});
}

exports.home = function(req,res){
    var template  = require('swig');
	template.init({
	  allowErrors: false,
	  autoescape: true,
	  cache: true,
	  encoding: 'utf8',
	  filters: {},
	  root: "public/tpl",
	  tags: {},
	  extensions: {},
	  tzOffset: 0
	});
	var conf = new config();
	console.log(conf.host);
	
	var tmpl = template.compileFile(tplPath+'index.html');
	renderedHTML= tmpl.render({
	   
	});
	res.send(renderedHTML);
};

exports.shoot = function(req,res){
	
	var fs = require('fs');
	var obj = {
	  name: req.body.url
	};

	var shotUrl=JSON.stringify(obj);
	console.log(shotUrl);
	//var shotUrl = req.body.url;
	var u = req.body.url;
	if (u && !u.match(/^http([s]?):\/\/.*/)) {
	    u = 'http://' + u;
	  }
	var parts = url.parse(u, true);
	host=parts.host;
	//console.log("grabbing:"+host);
	timestamp = new Date().getTime();
	var imgName = host+"_"+timestamp+".png"
	var imgPath = shotPath+imgName;
	var imgThumbnail = host+"_thumbnail_"+timestamp+".png";
	var imgThumbnailPath = shotPath+imgThumbnail;
	var imgCrop = host+"_crop_"+timestamp+".png";
	var imgCropPath = shotPath+imgCrop;
	
	var imgUrl = "/data/"+imgName;
	var imgThumbnailUrl = "/data/"+imgThumbnail;
	var imgCropUrl = "/data/"+imgCrop;
	
	var shortImgUrl="",
		shortThumbnailUrl="",
		shortCropUrl="";
	
	
	var thumbnail = req.body.thumb;
	var orgText;
	var shotStatus="0";
	console.log(req.body);	
	
	// Default options
	var defaults = {
	  windowSize: {
	    width: 1024
	  , height: 768
	  }
	, shotSize: {
	    width: 'all'
	  , height: 'all'
	  }
	, script: function() {}
	, paperSize: ''
	, userAgent: 'Mozilla/5.0 (X11; Linux i686; rv:18.0) Gecko/20100101 Firefox/18.0'
	, streamType: 'png'
	, siteType: 'url'
	, phantomPath: 'phantomjs'
	, renderDelay: 200
	, timeout: 10
	, takeShotOnCallback: false
	, ignoreSslErrors: "--ignore-ssl-errors=yes"
	};

	// set paths
	var cmd = "/Users/raj/Projects/test/js/phantomjs-1.9.1-macosx/bin/phantomjs";
	//var rasterPath = "/Users/raj/Projects/test/js/phantomjs-1.9.1-macosx/examples/rasterize.js";
	var rasterScript = "/Users/raj/Projects/urlshot/node_modules/phantomjs/lib/phantom/examples/rasterize.js";
	var convertCmd = "convert";
	if(process.env.OPENSHIFT_DATA_DIR){
		console.log("in openshift");
		cmd = process.env.OPENSHIFT_DATA_DIR+"phantomjs-1.9.1-linux-x86_64/bin/phantomjs";
		rasterScript = process.env.OPENSHIFT_REPO_DIR+"node_modules/phantomjs/lib/phantom/examples/rasterize.js";
		convertCmd = "convert";
	}
	var crop = false;
	async.series([
		// get the page
/*		function(callback){
			var request = require('request');
			var ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36";
			request({ method: 'GET' ,uri: u, headers: {'User-Agent': ua}, followAllRedirects:true}, function (error, response, body) {
				if(error){
			        console.log(error);
					res.send({doc:orgText,xtext:"<html><body><div>"+error.stack+"</div></body</html>"});
					callback();
				} else {
					//store the retreived text in a var
					orgText = body;
					//console.log(response.headers);
					//console.log(response.request.uri);
					//console.log("fetched the url:" + u + "- got body:"+orgText);
					callback();
				}

			});
		},*/
		// grab the screenshot
		function(callback){
			
			var phantomArgs = [
			    rasterScript
			  , u
			  , imgPath
			  , defaults.windowSize.width
			  , defaults.windowSize.height
			  , defaults.shotSize.width
			  , defaults.shotSize.height
			  , defaults.userAgent
			  , defaults.script
			  , defaults.paperSize
			  , defaults.streamType
			  , defaults.siteType
			  , defaults.renderDelay
			  , defaults.takeShotOnCallback
			  , defaults.ignoreSslErrors
			  ].map(function(arg) {
			    return arg.toString();
			  });
			var foo = new cmd_exec(cmd, phantomArgs,
				{
					//stdio:"inherit",
					cwd:'./',
					env:process.env
					//detached: true,
				},
			function (me, data) {
				me.stdout += data.toString();
				xtext1=me.stdout;
				console.log("xtext1:"+xtext1);
			},
			  function (me,result) {
				console.log("saved to:"+imgPath);
				console.log(result);
				shotStatus=result;
				shotStatus = shotStatus.replace(/(\r\n|\n|\r)/gm,"");
				// convert to thumbnail if required
				callback();
				
			},
			function(me,err){
				console.log(err);
			}
			);
		},
		// crop the image to generate a thumbnail if required
		function(callback){
			
			if(thumbnail == 'true'){
				console.log("cropping for thumbnail");
				imgName = imgThumbnail;
				var crop = " -crop 1024x768+0+0";
				//var filter = " -filter Lanczos -thumbnail 200x150";
				//var cmd1=convertCmd+" \""+imgPath+"\" " +crop+ " \""+imgPath+"\" ";
				//console.log(cmd1);
				//var cmd2=convertCmd+" \""+imgPath+"\""+  "\""+imgThumbnailPath+"\""; 
				var foo = new cmd_exec(convertCmd, [
					"-verbose",
					imgPath,
					"-crop","1024x768+0+0",
					imgCropPath
					],
					{
						//stdio:"inherit",
						cwd:'./',
						env:process.env
						//detached: true,
					},
				function (me, data) {
					me.stdout += data.toString();
					//xtext1=me.stdout;
					//console.log("xtext1:"+xtext1);
				},
				  function (me,result) {
					console.log("done cropping:"+me);
				
					callback();

				},
				function(me,err){
					console.log(err);
				}
					);
			}
			else{
				callback();
			}
		
		},
		function(callback){
			if(thumbnail == 'true'){
				console.log("generating thumbnail");
				imgName = imgThumbnail;
				//var crop = " -crop 1024x768+0+0";
				//var filter = " -filter Lanczos -thumbnail 40%";
				//var cmd1=convertCmd+" \""+imgPath+"\" "+ "\""+imgPath+"\"";
				//var cmd2=convertCmd+" \""+imgPath+"\" "+filter+  " \""+imgThumbnailPath+"\""; 
				//console.log(cmd2);
				var foo = new cmd_exec(convertCmd, [
					"-verbose",
					imgCropPath,
					"-filter","Lanczos",
					"-thumbnail","200x150",
					imgThumbnailPath
					],
					{
						//stdio:"inherit",
						cwd:'./',
						env:process.env
						//detached: true,
					},
				function (me, data) {
					me.stdout += data.toString();
					//xtext1=me.stdout;
					//console.log("xtext1:"+xtext1);
				},
				  function (me,result) {
					console.log("done creating thumbnail:"+me)
					callback();

				},
				function(me,err){
					console.log("error:"+err);
					callback();
				}
					);
			}
			else{
				callback();
			}
		},
		//shorten urls
		function(callback){
			//imgUrl = "/data/"+imgName;
			// shorten urls
			var conf = new config();
			host = conf.host;
			console.log("serving from:"+imgUrl);
			var fullImgUrl = "http://"+host+imgUrl;
			var googl = require('goo.gl');
			// Shorten a long url and output the result
			googl.shorten(fullImgUrl, function (shortUrl) {
			    //console.log(shortUrl);
				shortImgUrl = shortUrl.id;
				callback();
			});
			
		},
		//shorten thumb url
		function(callback){
			var fullThumbnailUrl = "http://"+host+imgThumbnailUrl
			var googl = require('goo.gl');
			// Shorten a long url and output the result
			googl.shorten(fullThumbnailUrl, function (shortUrl) {
			    //console.log(shortUrl);
				shortThumbnailUrl = shortUrl.id;
				callback();
			});
		},
		//shorten thumb url
		function(callback){
			var fullThumbnailUrl = "http://"+host+imgCropUrl
			var googl = require('goo.gl');
			// Shorten a long url and output the result
			googl.shorten(fullThumbnailUrl, function (shortUrl) {
			    //console.log(shortUrl);
				shortCropUrl = shortUrl.id;
				callback();
			});
		}
		], function(err, result){
			
			res.send({"shot":shortImgUrl,"crop":shortCropUrl,"thumb":shortThumbnailUrl,"status":shotStatus});
			//res.send({shot:"<img src=\""+imgUrl+"\">", thumb:"<img src=\""+imgThumbnailUrl+"\">"});
		});
	
};


