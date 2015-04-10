
//TODO remove this file

module.exports = {
  moveCamera: function (camera) {
    var distance;
    var phase = 0;
    var time = new Date().getTime();
    if (camera.type == 'tracker') {
      var requiredPosition = camera.three.position.clone();
      var bodyPosition = camera.lookAt.three.position;
      var axis = camera.axis.three;
      var requiredDistance = camera.distance;
      var projection = bodyPosition.clone().projectOnVector(axis);
      distance = projection.distanceTo(bodyPosition);
      var normal = bodyPosition.clone().sub(projection);
      var extension;
      if (distance == 0) {
        requiredPosition.copy(axis.clone().multiplyScalar(requiredDistance));
      } else if (distance == requiredDistance) {
        requiredPosition.copy(projection);
      } else if (distance > requiredDistance) {
        extension = distance - requiredDistance;
        normal.normalize().multiplyScalar(extension);
        requiredPosition.copy(normal.add(projection));
      } else {
        extension = Math.sqrt(Math.pow(requiredDistance, 2) - Math.pow(normal.length(), 2));
        requiredPosition.copy(projection.add(axis.clone().multiplyScalar(extension)));
      }
      //get saved time
      camera._lastTime = camera._lastTime || (new Date()).getTime();
      var curTime = (new Date()).getTime();
      var lapse = curTime - camera._lastTime;
      camera._lastTime = curTime; //save time
      var beta;
      if (lapse == 0) {
        beta = 10000;
      } else {
        beta = lapse / 1000 / (camera.inertia + 0.001);
      }
      //TODO use PID controller
      // pos = (ß * new + pos) / (1 + ß)
      camera.three.position.add(requiredPosition.multiplyScalar(beta)).divideScalar(1 + beta);
      camera._lastLookAt = camera._lastLookAt || bodyPosition.clone();
      camera.three.lookAt(camera._lastLookAt.add(bodyPosition.clone().multiplyScalar(beta)).divideScalar(1 + beta));

    } else if (camera.type == 'satellite') {
      camera.three.position.x = camera.distance * Math.sin(phase + time / 2234);
      camera.three.position.z = camera.distance * Math.cos(phase + time / 2234);
      camera.three.position.y = 0.5 * camera.distance * Math.cos(phase + time / 3345);
      if (camera.lookAt.x!==undefined) { //looking to a position
        camera.three.lookAt(camera.lookAt.three);
      } else if (camera.lookAt.shape) { //looking to a body
        camera.three.lookAt(camera.lookAt.three.position);
      }
    } else {
      camera.three.lookAt(camera.lookAt);
    }
  }
};