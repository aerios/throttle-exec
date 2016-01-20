var Promise = require('when/es6-shim/Promise');
var underscore = require('underscore')
var EventEmitter = require('events').EventEmitter;
var uuidSeed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
var uuidLength = uuidSeed.length

function generateUUID(){
	var str = "";
	for(var i = 0;i<uuidLength;i++){
		str += uuidSeed.charAt(Math.random() * (uuidSeed.length-1));
	}
	return str;
}


function reloadJob(ctx){
	var job = ctx._job.slice(0);
	ctx._job = [];
	underscore.each(job,function(itemJob){
		ctx._job.push(itemJob)
		execJob(ctx)
	})
}

function execJob(ctx) {
	var execCount = ctx._current_job;
	var maxJobCount = ctx._config.max_job;
	if (execCount < maxJobCount && ctx._job.length) {
		up(ctx);
		var job = ctx._job.shift();

		var funcName = job.name;
		var funcArgs = job.data;
		var resolve = job.resolve;
		var reject = job.reject;
		var delay = job.delay || 0;
		var funcHandler = ctx._callback[funcName];
		try{
			var ret = funcHandler.apply(null, funcArgs);	
			job = null;
			if (typeof ret.then == "function") {
				
				funcArgs = null;
				ret.then(function(result) {
					resolve(result)
					result = null;
					ret = null;
					down(ctx)
				}, function(reason) {
					reject(reason)
					reason = null;
					ret = null;
					down(ctx)
				}).catch(function(err) {
					reject(err)
					err = null;
					ret = null;
					down(ctx)
				})
			} else {		
				setTimeout(function() {													
					resolve(ret);	
					ret = null;
					down(ctx)
				}, delay)
			}
		}catch(err){
			setTimeout(function() {													
				reject(err);	
				err = null;
				down(ctx)
			}, delay)
		}		
	}	
}

function up(ctx) {
	ctx._current_job += 1;
}

function down(ctx) {

	ctx._current_job -= 1;
	if(ctx._job.length == 0){
		ctx.emit('empty')
	}
	if(global.gc){
		global.gc();
	}
	execJob(ctx)
}

function dropQueue(){
	this._job = []
}

function setJobCount(num) {
	this._config.max_job = num;
	reloadJob(this)
}

function registerFunction(name, func) {
	if (this._callback[name]) {
		throw new Error("handler for " + name + " is already defined")
	}
	if (!underscore.isFunction(func)) {
		throw new Error("func is not a function")
	}
	this._callback[name] = func
	return (function(){
			return this.registerAction(name,underscore.toArray(arguments))
		}).bind(this)
}

function registerAction(name, argList, initDelay) {
	if (!this._callback[name]) {
		throw new Error("handler for " + name + " is not defined")
	}
	if (!argList) {
		argList = []
	}
	var that = this;
	var pr = new Promise(function(resolve, reject) {
		that._job.push({
			name: name,
			data: argList,
			resolve: resolve,
			reject: reject,
			delay: initDelay
		})
	})
	execJob(this);
	return pr;
}

function wrapFunction(func){

	// create random function name
	var functionName = generateUUID()
	return this.registerFunction(functionName,func);
}


function Throttle(num){
	underscore.extend(this,new EventEmitter)	
	this._callback = {}
	this._job = []
	this._config = {
		max_job:10
	}
	this._current_job = 0;
	this.setJobCount(num ? num : 10);
}

Throttle.prototype.setJobCount = setJobCount
Throttle.prototype.registerFunction = registerFunction
Throttle.prototype.registerAction = registerAction
Throttle.prototype.dropQueue = dropQueue;
Throttle.prototype.wrap = wrapFunction

module.exports = Throttle;
