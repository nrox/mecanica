function Light(options, system) {
  this.construct(options, system, 'directional');
}

Light.prototype.types = {
  directional: function (options) {
    this.include(options, {
      color: 0xbbbbbb, position: {x: 10, y: 5, z: 3},
      lookAt: {}, castShadow: this.getSettings().castShadow,
      shadowDistance: 20
    });
    if (this.runsRender()) {
      var light = new THREE.DirectionalLight(this.color);
      light.position.copy(this.applyLengthConversionRate(new Vector(this.position)).three);
      if (typeof(this.lookAt) == 'object') {
        light.target.position.copy(new Vector(this.lookAt).three);
      }
      if (this.castShadow) {
        this.shadowDistance = this.applyLengthConversionRate(this.shadowDistance);
        light.shadowCameraLeft = -this.shadowDistance;
        light.shadowCameraTop = -this.shadowDistance;
        light.shadowCameraRight = this.shadowDistance;
        light.shadowCameraBottom = this.shadowDistance;
        light.shadowCameraNear = 0.2 * this.shadowDistance;
        light.shadowCameraFar = 10 * this.shadowDistance;
        light.shadowBias = -0.0003;
        light.shadowMapWidth = light.shadowMapHeight = this.getSettings().shadowMapSize;
        light.shadowDarkness = 0.35;
      }
      this.three = light;
    }
    this.addRenderMethod('addToScene', Light.prototype.methods.addToScene);
  },
  ambient: function (options) {
    this.include(options, {
      color: 0x222222
    });
    if (this.runsRender()) {
      this.three = new THREE.AmbientLight(this.color);
    }
    this.addRenderMethod('addToScene', Light.prototype.methods.addToScene);
  }
};

Light.prototype.methods = {
  addToScene: function (scene) {
    if (this.runsRender()) {
      if (!this._added) {
        this._added = true;
        scene.three.add(this.three);
      }
    }
  }
};

extend(Light, Component);
Component.prototype.maker.light = Light;