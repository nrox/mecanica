var one = 1;
var zero = 0;
var helloNuno = hello('Nuno');

function hello(world){
  return 'Hello , ' + world;
}

onmessage = function(e) {
  postMessage(e.data);
}
