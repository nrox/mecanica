function Monitor(options, system){
  this.construct(options, system, 'complete');
}

Monitor.prototype.types = {
  complete: function (options, system) {
    this.include(options, {
      renderer: 'available',
      camera: 'perspective',
      width: 500, height: 500,
      fov: 35, near: 0.1, far: 1000,
      position: {x: 5, y: 7, z: 10},
      axis: {x: 5, y: 7, z: 10},
      lookAt: {}, //vector or body id
      distance: 15, //distance to keep, in case of tracker
      inertia: 1
    });
    var o = this.optionsWithoutId();
    o.aspect = o.width / o.height;
    this.renderer = system.make('renderer', o.renderer, o);
    this.camera = system.make('camera', o.camera, o);
  }
};

extend(Monitor, Component);
Component.prototype.maker.monitor = Monitor;