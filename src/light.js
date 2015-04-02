function Light(options, system) {
  this.construct(options, system, 'directional');
}

Light.prototype.types = {
  directional: function (options, system) {
    this.include(options, {
      color: 0xbbbbbb, position: {x: 10, y: 5, z: 3},
      lookAt: {}, castShadow: system.getSettings().castShadow,
      shadowDistance: 20
    });
    if (this.runsWebGL()) {
      var light = new THREE.DirectionalLight(this.color);
      light.position.copy(new Vector(this.position).three);
      if (typeof(this.lookAt) == 'object') {
        light.target.position.copy(new Vector(this.lookAt).three);
      }
      if (this.castShadow) {
        light.shadowCameraLeft = -this.shadowDistance;
        light.shadowCameraTop = -this.shadowDistance;
        light.shadowCameraRight = this.shadowDistance;
        light.shadowCameraBottom = this.shadowDistance;
        light.shadowCameraNear = 0.2 * this.shadowDistance;
        light.shadowCameraFar = 10 * this.shadowDistance;
        light.shadowBias = -0.0003;
        light.shadowMapWidth = light.shadowMapHeight = system.getSettings().shadowMapSize;
        light.shadowDarkness = 0.35;
      }
      this.three = light;
    }
  }
};

extend(Light, Component);
Component.prototype.maker.light = Light;