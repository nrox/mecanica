function Mecanica(options) {
  if (!options) options = {};
  this.construct(options, this, 'main');
}

Mecanica.prototype.types = {
  main: function (options) {
    this.include(options, {
      settings: { use: {type: 'global'} },
      scene: { use: {} },
      light: { use: {} },
      system : {},
      monitor: { use: {} }
    });
    this.objects = {
      settings: {}, //preferences
      scene: {}, //three scene + ammo world
      system: {}, //high level structure of objects, identified by keys
      light: {},
      monitor: {} //set of camera + renderer
    };
    this.notifyUndefined(_.keys(this.objects));
    this.init(this.options());
  }
};

Mecanica.prototype.init = function (json) {
  var _this = this;
  //for each already key in objects, check if that type exists in json and build its contents
  _.each(_this.objects, function (groupObject, groupName) {
    groupObject = json[groupName];
    _.each(groupObject, function (objectOptions, objectId) {
      objectOptions.id = objectId;
      _this.make(groupName, objectOptions);
    });
  });

  var settings = this.getSettings();
  var scene = this.getScene();
  if (settings.axisHelper) {
    if (this.runsWebGL()) scene.three.add(new THREE.AxisHelper(settings.axisHelper));
  }

  loadSystem(this.objects);

  function loadSystem(objs) {
    _.each(objs.system, loadSystem);
    _.each(objs.body, function (body) {
      if (!body._added && (body._added = true)) {
        body.updateMotionState();
        if (_this.runsWebGL()) scene.three.add(body.three);
        if (_this.runsPhysics()) scene.ammo.addRigidBody(body.ammo);
      }
    });
    _.each(objs.constraint, function (cons) {
      cons.add();
    });
    if (_this.runsWebGL()) {
      _.each(objs.light, function (light) {
        if (!light._added && (light._added = true)) {
          scene.three.add(light.three);
        }
      });
    }
  }
};

Mecanica.prototype.destroy = function () {

};

Mecanica.prototype.import = function (url, id) {
  var json = require(url);
  sys = this.make('system','basic',{id: id});
  sys.loadJSON(json);
};

extend(Mecanica, System);
