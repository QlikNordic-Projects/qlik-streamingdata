process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const WebSocket = require('ws');
const schema = require('enigma.js/schemas/12.67.2.json');
const enigma = require('enigma.js');
const https = require('https');

const path = require('path');
const fs = require('fs-extra');
const express = require('express');
const httpsapp = express();
const host = process.env.ENGINE_HOST || '127.0.0.1';
const port = 4747;
const httpsport = 3000; //Change Here

const httpsoptions = {
    pfx: fs.readFileSync('./server.pfx'),
    passphrase: 'password'
};
https.createServer(httpsoptions, httpsapp).listen(httpsport);
const certificatesPath='C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/';
const userDirectory = 'xxx'; //Change Here
const userId = 'xxx'; //Change Here
const xrfkey = 'abcdefghijklmnop';
const readCert = filename => fs.readFileSync(path.resolve(__dirname, certificatesPath, filename));

var start = false;
var maxloads = 1200; //How many Partial Loads that should be triggered. 720*every 5th second = 1 hour 
var minutes = 0.05, the_interval = minutes * 60 * 1000; //How often to push in new data (0.1 = every 6th second)

httpsapp.get('/start', (req, res) => {
	console.log(req.query.appId);
	maxloads = 1200;
	var appId=req.query.appId;
	res.send('Data Streaming is started, please close this tab and go back to your application.');
	console.log("start is initiated");
	start = true;
	init(appId); 
})
httpsapp.get('/stop', (req, res) => {
	res.send('Data Streaming is stopped, please close this tab and go back to your application.');
	console.log("stop is initiated");
	start = false;
	maxloads = 0;
})

httpsapp.get('/streamingData', function (req, res) {
	console.log("partial rest api called");
	var query=[{type:0,temperature:Number(req.query.bedroom_temp),humidity:Number(req.query.bedroom_humidity)},
	{type:1,temperature:Number(req.query.kitchen_temp),humidity:Number(req.query.kitchen_humidity)},
	{type:2,temperature:Number(req.query.garage_temp),humidity:Number(req.query.garage_humidity)}
	];
	console.log(query);
	generateData(10,query).then((r) => {		
		res.send(r);
	})
})

httpsapp.get('/fullStreamingData', function (req, res) {
	generateData(10000,[{type:0,temperature:22,humidity:40},{type:1,temperature:22,humidity:35},{type:2,temperature:8,humidity:70}
	]).then((r) => {
		console.log("full rest api called");
		res.send(r);
	})
})

function copy(mainObj) {
  let objCopy = {};
  let key;
  for (key in mainObj) {
    objCopy[key] = mainObj[key];
  }
  return objCopy;
}

async function start(rows,object) {
	return new Promise(async (res, rej) => {
		
		var list=[];
		var e=0;
		var nrOfItems=object.length;
		rows=rows+nrOfItems;
		var d1 = new Date();
		d1.setSeconds(d1.getSeconds()-(rows)+nrOfItems-1);
		d1.setHours(d1.getHours()+1); 
		object.forEach(function(obj) {
			obj.timestamp=d1;
			list.push(obj);
		});
		for(i=nrOfItems;i<rows;i++) {
				for(ii=0;ii<nrOfItems;ii++) {
					var d = new Date();
					d.setSeconds(d.getSeconds()-(rows)+(i));
					d.setHours(d.getHours()+1); 
					var o = await generateSensorData(copy(list[e]));
					o.timestamp=d;
					list.push(o);	
					e++;			
				};	
		}
		res(list);
	})
}


async function generateData(rows,object) {
	return new Promise(async (res, rej) => {
		
		var list=[];
		var e=0;
		var nrOfItems=object.length;
		rows=rows+nrOfItems;
		var d1 = new Date();
		d1.setSeconds(d1.getSeconds()-(rows)+nrOfItems-1);
		d1.setHours(d1.getHours()+1); 
		object.forEach(function(obj) {
			obj.timestamp=d1;
			list.push(obj);
		});
		for(i=nrOfItems;i<rows;i++) {
			for(ii=0;ii<nrOfItems;ii++) {
				var d = new Date();
				d.setSeconds(d.getSeconds()-(rows)+(i));
				d.setHours(d.getHours()+1); 
				var o = await generateSensorData(copy(list[e]));
				o.timestamp=d;
				list.push(o);	
				e++;			
			};	
		}
		res(list);
	})
}
async function generateSensorData(object) {
		
	var tempUp,humidityUp;
		if(Math.floor((Math.random() * 2))>0){
			tempUp=true;
			humidityUp=false;
		}
		else{
			tempUp=false;
			humidityUp=true;
		}
	var temp=(Math.floor((Math.random()*1.1)*10)/1000);
	var humidity=(Math.floor((Math.random()*1.1)*10)/100);
	if(object.type==2){
		if(object.temperature<8)
			tempUp=true;
		if(object.humidity<51)
			humidityUp=true;
		if(object.temperature>12)
			tempUp=false;
		if(object.humidity>79)
			humidityUp=false;
	}
	else{
		if(object.temperature<21)
			tempUp=true;
		if(object.humidity<31)
			humidityUp=true;
		if(object.temperature>24)
			tempUp=false;
		if(object.humidity>54)
			humidityUp=false;
	}
	if(tempUp)
		object.temperature=Math.round((object.temperature+temp)*100)/100;
	else
		object.temperature=Math.round((object.temperature-(temp*1.1))*100)/100;
	if(humidityUp)
		object.humidity=Math.round((object.humidity+humidity)*100)/100;
	else
		object.humidity=Math.round((object.humidity-humidity)*100)/100;
	return object;
}

async function loadData(app) {
  var startTime = Date.now();  
  var result = await app.doReload();
  console.log(result);
  console.log(`Reload took: ${Date.now() - startTime} ms`);
  var count = 0;
  await app.doSave();
  await delay(the_interval);
  while(count < maxloads){
	startTime = Date.now();  
	count ++; 
	await delay(the_interval);
	console.log("reloading",app.id,"round nr",count);
	result = await app.doReload({qMode:0,qPartial:true});
	console.log(result);
	console.log(`Reload took: ${Date.now() - startTime} ms`);
	await app.doSave();
  }	
}

async function init(appId) {
	const session = enigma.create({
	  schema,
	  url: `wss://${host}:${port}/app/${Date.now()}`,
	  createSocket: url => new WebSocket(url, {
		ca: [readCert('root.pem')],
		key: readCert('client_key.pem'),
		cert: readCert('client.pem'),
		headers: {
		  'X-Qlik-User': `UserDirectory=${encodeURIComponent(userDirectory)}; UserId=${encodeURIComponent(userId)}`,
		},
	  }),
	});
	var global = await session.open();
	var app = await global.openDoc(appId);
	try {
		loadData(app);
	}catch (e) {
		console.log(`error: ${e}`);
	}
}

const delay = time => new Promise(res=>setTimeout(res,time));
