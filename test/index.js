var ThrottleEngine = require("../index.js")
var expect = require("chai").expect;
var assert = require('assert')
var sinon = require('sinon');
var Promise = require("when/es6-shim/Promise");

describe("throttle-exec",function(){
	it("should be able to handle synchronous function",function(done){
		var throttleInstance = new ThrottleEngine(1);
		var wrapped = throttleInstance.wrap(function(a,b){
			return a * b;
		})
		var p1 = 2;
		var p2 = 5;
		wrapped(p1,p2).then(function(res){
			expect(res).to.be.equal(p1 * p2)
			done()
		}).catch(done)
	})
	it("should be able to handle asynchronous function",function(done){
		var throttleInstance = new ThrottleEngine(1);
		var wrapped = throttleInstance.wrap(function(a,b){
			return new Promise(function(resolve,reject){
				setTimeout(function(){
					resolve(a * b)
				},1000)
			})
		})
		var p1 = 2;
		var p2 = 5;
		wrapped(p1,p2).then(function(res){
			expect(res).to.be.equal(p1 * p2)
			done()
		}).catch(done)
	})
	it("should be able to catch error",function(done){
		var throttleInstance = new ThrottleEngine(1);
		var wrapped = throttleInstance.wrap(function(a,b){
			var obj = {}
			a = a + obj.x.num;
			return a * b;
		})
		var p1 = 2;
		var p2 = 5;
		wrapped(p1,p2).then(function(res){
			done(new Error("it should be error here"))
		}).catch(function(reasone){
			expect(reasone).to.be.instanceOf(Error)
			done()
		})	
	})
	it("should be able to throttle execution call",function(done){
		var spy = sinon.spy()
		var throttleCount = 10
		var throttleInstance = new ThrottleEngine(throttleCount);
		var wrapped = throttleInstance.wrap(function(a,b){
			spy();
			return a * b;
		})
		for(var i = 0;i < throttleCount * 3;i++){
			wrapped(1,2)
		}
		expect(spy.callCount).to.be.equal(throttleCount)
		done()
	})
	it("should be able to finish all call",function(done){
		var spy = sinon.spy()
		var throttleCount = 10
		var multiplier = 3;
		var throttleInstance = new ThrottleEngine(throttleCount);
		var wrapped = throttleInstance.wrap(function(a,b){
			return a * b;
		})
		for(var i = 0;i < throttleCount * multiplier;i++){
			wrapped(1,2).then(spy)
		}
		setTimeout(function(){
			expect(spy.callCount).to.be.equal(throttleCount * multiplier)
			done()
		},5000)		
	})	
})