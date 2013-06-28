var path = require('path');
var tplPath = path.join(__dirname, '../public/tpl/');
var shotPath = path.join(__dirname, '../public/data/')
var url = require('url');

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
	var webshot = require('webshot');
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
	var imgUrl = "/data/"+imgName
	webshot(req.body.url, imgPath, options, function(err) {
	  // screenshot now saved to flickr.jpeg
		if(err){
			res.send(err)
		}
		res.send("<img src=\""+imgUrl+"\">");
	});
/*	webshot('google.com', "abcd.png",options, function(err, renderStream) {
		if(err){
			res.send(err);
		}
		
		var file = fs.createWriteStream(imgPath, {encoding: 'binary'});
		renderStream.on('data', function(data) {
	    	file.write(data.toString('binary'), 'binary', function(){
				res.send("<img src=\"/data/abc.png\">");
			});
			
	  	});
	

	});*/
};
