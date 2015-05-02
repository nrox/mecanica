module.exports.older = module.exports.current;
var zero = require('/level0.js');
var one = require('/level1.js');
//console.log("after require level 1 in level 2");
//console.log('module.exports.current should be undefined at level 2.js: ', module.exports.current);
module.exports.previous = module.exports.current;
module.exports.current = 2;
module.exports.zero = zero.current;
module.exports.one = one.current;

