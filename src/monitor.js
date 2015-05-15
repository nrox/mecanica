function Monitor(options, system) {
  this.construct(options, system, 'complete');
}

Monitor.prototype.types = {
  complete: function (options) {
    this.include(options, {
      renderer: 'available',
      camera: 'perspective',
      width: undefined, height: undefined,
      fov: 35, near: 0.1, far: 1000,
      position: {x: 5, y: 7, z: 10},
      axis: {x: 5, y: 7, z: 10},
      lookAt: {}, //vector or body id
      distance: 15, //distance to keep, in case of tracker
      inertia: 1
    });
    if (this.options().width === undefined) {
      this.options().width = this.width = this.globalSettings().canvasWidth;
    }
    if (this.options().height === undefined) {
      this.options().height = this.height = this.globalSettings().canvasHeight;
    }
    if (this.runsRender()) {
      var o = this.optionsWithoutId();
      o.aspect = o.width / o.height;
      var cameraOptions = utils.deepCopy(o);
      cameraOptions.type = o.camera;
      var rendererOptions = utils.deepCopy(o);
      rendererOptions.type = o.renderer;
      this.renderer = new Renderer(rendererOptions, this.rootSystem);
      this.camera = new Camera(cameraOptions, this.rootSystem);
    }
  }
};

extend(Monitor, Component);
Component.prototype.maker.monitor = Monitor;
Component.prototype.defaultType.monitor = 'complete';
