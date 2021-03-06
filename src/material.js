function Material(options, system) {
  this.construct(options, system, 'phong');
}

Material.prototype.types = {
  _intro: function (options) {
    this.include(options, {
      friction: 0.3, restitution: 0.1,
      color: 0x333333, opacity: 1, transparent: false,
      wireframe: false
    });
    if (this.options().wireframe === undefined) {
      this.options().wireframe = this.wireframe = this.globalSettings().wireframe;
    }
    this.options().transparent = !!((this.opacity != undefined) && (this.opacity < 1));
    this.notifyUndefined(['friction', 'restitution']);
  },
  basic: function (options) {
    this.include(options, {
    });
    Material.prototype.types._intro.call(this, options);
    if (this.runsRender()) this.three = new THREE.MeshBasicMaterial(this.options());
  },
  phong: function (options) {
    this.include(options, {
      emissive: 0x000000, specular: 0x555555
    });
    Material.prototype.types._intro.call(this, options);
    if (this.runsRender()) this.three = new THREE.MeshPhongMaterial(this.options());
  }
};

Material.prototype.getFriction = function () {
  return this.options().friction;
};

Material.prototype.getRestitution = function () {
  return this.options().restitution;
};

extend(Material, Component);
Component.prototype.maker.material = Material;
Component.prototype.defaultType.material = 'phong';
