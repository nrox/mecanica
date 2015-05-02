module.exports.older = module.exports.current;
require('/level0.js');
//console.log("after require level 0 in level 1");
//console.log('module.exports.current should be undefined at level 1.js: ', module.exports.current);
module.exports.previous = module.exports.current;
module.exports.current = 1;
