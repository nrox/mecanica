function tryCall(obj, list){
  for (var i = 0; i < list.length; i++){
    try {
      console.log("  " + list[i] + "() => " + obj[list[i]]());
    } catch (e){
      console.log("failed " + list[i] + "()   exists? " + !!obj[list[i]]);
    }
  }
}

var tests = {
  btVector3: function(obj){
    //FIXME 'getX','getY','getZ' don't exist
    var na = ['x','y','z'];
    tryCall(obj, na);

  },
  btBoxShape: function(obj){

  }
};

function log(obj, title){
  console.log(title);
  console.log(obj);
}

function inspect(obj, title){
  console.log(title);
  for (var i in obj){
    console.log('  ' + i + ': ' + obj[i]);
  }
}

function keys(obj, title){
  console.log(title);
  for (var i in obj){
    console.log('  ' + i);
  }
}

module.exports = {
  log: log,
  inspect: inspect,
  keys: keys
};