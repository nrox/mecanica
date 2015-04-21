function Camera(options, system) {
  this.construct(options, system, 'perspective');
}

Camera.prototype.types = {
  perspective: function (options) {
    this.include(options, {
      fov: 45, aspect: 1, near: 0.1, far: 1000,
      position: {x: 5, y: 7, z: 20},
      lookAt: {}
    });
    this.position = new Vector(this.position);
    if (this.runsRender()) {
      this.three = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
      this.three.position.copy(this.position.three);
      this.three.lookAt(new Vector(this.lookAt).three);
    }
    this.addRenderMethod('move', Camera.prototype.methods.movePerspective);
  },
  //follow a body
  tracker: function (options) {
    this.include(options, {
      fov: 45, aspect: 1, near: 0.1, far: 1000,
      axis: {x: 1, y: 0.2, z: 0.3}, //preferred axis of movement
      distance: 15, //distance to keep
      inertia: 1, //for changing position, in seconds
      lookAt: null
    });
    this.notifyUndefined(['lookAt']);
    this.axis = new Vector(this.axis);
    if (this.lookAt instanceof Body) {
    } else {
      this.lookAt = this.parentSystem.getObject('body', this.lookAt);
    }
    if (this.runsRender()) {
      this.axis.three.normalize();
      this.three = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
    }
    this.addRenderMethod('move', Camera.prototype.methods.moveTracker);
  },
  //follow a body
  satellite: function (options) {
    this.include(options, {
      fov: 45, aspect: 1, near: 0.1, far: 1000,
      axis: {x: 1, y: 0.2, z: 0.3}, //preferred axis of movement
      distance: 15, //distance to keep
      inertia: 1, //for changing position, in seconds
      lookAt: null
    });
    this.notifyUndefined(['lookAt']);
    this.axis = new Vector(this.axis);
    if (this.lookAt instanceof Body) {
    } else if (typeof(this.lookAt) == 'string') {
      this.lookAt = this.parentSystem.getObject('body', this.lookAt);
    } else {
      this.lookAt = new Vector(this.lookAt);
    }
    if (this.runsRender()) {
      this.axis.three.normalize();
      this.three = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
    }
    this.addRenderMethod('move', Camera.prototype.methods.moveSatellite);
  }
};

Camera.prototype.methods = {
  moveTracker: function () {
    var camera = this;
    var distance;
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
  },
  moveSatellite: function () {
    var camera = this;
    var phase = 0;
    var time = new Date().getTime();
    camera.three.position.x = camera.distance * Math.sin(phase + time / 2234);
    camera.three.position.z = camera.distance * Math.cos(phase + time / 2234);
    camera.three.position.y = 0.5 * camera.distance * Math.cos(phase + time / 3345);
    if (camera.lookAt.x !== undefined) { //looking to a position
      camera.three.lookAt(camera.lookAt.three);
    } else if (camera.lookAt.shape) { //looking to a body
      camera.three.lookAt(camera.lookAt.three.position);
    }
  },
  movePerspective: function () {

  }
};

extend(Camera, Component);
Component.prototype.maker.camera = Camera;