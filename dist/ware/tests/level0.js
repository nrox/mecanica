//console.log('module.exports.current should be undefined at level 0.js: ', module.exports.current);
module.exports.older = module.exports.current;
module.exports.previous = module.exports.current;
module.exports.current = 0;
