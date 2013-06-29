var path = require('path');
var tplPath = path.join(__dirname, '../public/tpl/');
var shotPath = path.join(__dirname,  '../public/data/')
var url = require('url');
var exec = require('child_process').exec;

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
		console.log("result:"+result);
		return cb_end(me,result);	
	});
	child.on('error', function(err){
		console.log("error");
		return cb_err(me,err);
	});
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
	
	var tmpl = template.compileFile(tplPath+'index.html');
	renderedHTML= tmpl.render({
	   
	});
	res.send(renderedHTML);
};

exports.shoot = function(req,res){
	//var webshot = require('webshot');
	var options = {
	  screenSize: {
	    width: 320
	  , height: 480
	  }
	, shotSize: {
	    width: 320
	  , height: 'all'
	  }
	, userAgent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_2 like Mac OS X; en-us)'
	    + ' AppleWebKit/531.21.20 (KHTML, like Gecko) Mobile/7B298g'

	
	}
	var fs = require('fs');
	var obj = {
	  name: req.body.url
	};

	var shotUrl=JSON.stringify(obj);
	console.log(shotUrl);
	//var shotUrl = req.body.url;
	var parts = url.parse(req.body.url, true);
	host=parts.host;
	console.log("grabbing:"+host);
	timestamp = new Date().getTime();
	var imgName = host+"_"+timestamp+".png"
	var imgPath = shotPath+imgName;
	console.log("saving to:"+imgPath);

	var imgUrl = "/data/"+imgName
	/*webshot(req.body.url, imgPath, options, function(err) {
	  // screenshot now saved to flickr.jpeg
		if(err){
			res.send("error");
		}

		console.log("serving from:"+imgUrl);
		res.send("<img src=\""+imgUrl+"\">");
	});
	*/
	/*
	webshot('google.com', function(err, renderStream) {
		if (err) {
			console.log(err);
			res.send(err);
		}
		var file = fs.createWriteStream(imgPath, {encoding: 'binary'});
		renderStream.on('error', function(){
				console.log("error in renderstream:"+error);
				res.send("error rendering");
		});

		renderStream.on('data', function(data) {
			console.log("writing data to file:"+data.toString('binary'));
			file.write(data.toString('binary'), 'binary');
		});

		renderStream.on('end', function() {
		
			fs.exists(imgPath, function(exists) {
				if(exists == true){
					console.log("serving from:"+imgUrl);
					res.send("<img src=\""+imgUrl+"\">");
				}
				else{
					console.log("file not saved");
					res.send("could not captr");
				}
			});
		});
	});
	*/
	// let's try running phantom cli
	//var cmd = "../node_modules/phantomjs/bin/phantomjs";
	//console.log(cmd);
	var options = {
	encoding: 'utf8',
	timeout: 7000,
	maxBuffer: 200*1024,
	killSignal: 'SIGTERM',
	cwd: "./",
	env: process.env
	}
	/*exec('phantomjs /Users/raj/Projects/test/js/phantomjs-1.9.1-macosx/examples/rasterize.js www.google.com /tmp/google.png', options, function(error, stdout,stderr){
		if(error){
			console.log(error);
		}
		else{
			console.log("ok");
		}
		res.send("<img src=\""+imgUrl+"\">");
	});
	*/
	var cmd = "/Users/raj/Projects/test/js/phantomjs-1.9.1-macosx/bin/phantomjs";
	var rasterPath = "/Users/raj/Projects/test/js/phantomjs-1.9.1-macosx/examples/rasterize.js";
	if(process.env.OPENSHIFT_DATA_DIR){
		console.log("in openshift");
		cmd = process.env.OPENSHIFT_DATA_DIR+"phantomjs-1.9.1-linux-x86_64/bin/phantomjs";
		rasterPath = process.env.OPENSHIFT_DATA_DIR+"phantomjs-1.9.1-linux-x86_64/examples/rasterize.js";
	}

	
	//cmd = "phantomjs";
	var foo = new cmd_exec(cmd, [
			rasterPath,
			req.body.url,
			imgPath
		],
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
		me.exit = 1;
		console.log("me.result"+result);
		xtext=result;
		console.log("serving from:"+imgUrl);
		res.send("<img src=\""+imgUrl+"\">");
	},
	function(me,err){
		console.log(err);
	}
	);
};
