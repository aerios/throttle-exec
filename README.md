# throttle-exec

A simple job-queue manager based on Promise mechanims

## Installation

`$ npm install throttle-exec`

## Usage
```javascript
var ThrottleEngine = require("throttle-exec")
var maximumProcess = 10
var throttleInstance = new ThrottleEngine(maximumProcess) 
```

### Function that perform asynchronous logic
```javascript
var wrappedAsync = throttleInstance.wrap(function(p1,p2){
    return new Promise(function(resolve,reject){
        var ret = {}
        // some logic
        resolve(ret)
    })
})
wrappedAsync("http://npmjs.org","http://google.com").then(function(ret){
    console.log(ret)
}).catch(console.error)
```
### Function that perform synchronous logic
```javascript
var wrappedSync = throttleInstance.wrap(function(p1,p2){
    
    // some logic
    return p1 * p2;
})
wrappedSync(5,2).then(function(result){
    console.log(result) // 10
}).catch(console.error) // any error will be thrown from try and trigger reject

```