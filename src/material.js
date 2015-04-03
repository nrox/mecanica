function Material(options, system) {
  this.construct(options, system, 'phong');
}

Material.prototype.types = {
  basic: function (options) {
    this.include(options, {
      friction: 0.3, restitution: 0.2,
      color: 0x333333, opacity: 1, transparent: false,
      wireframe: this.system.getSettings().wireframe || false
    });
    if (this.runsWebGL()) this.three = new THREE.MeshBasicMaterial(this.options());
  },
  phong: function (options) {
    this.include(options, {
      friction: 0.3, restitution: 0.2,
      color: 0x333333, opacity: 1, transparent: false,
      emissive: 0x000000, specular: 0x555555,
      wireframe: this.system.getSettings().wireframe || false
    });
    if (this.runsWebGL()) this.three = new THREE.MeshPhongMaterial(this.options());
  }
};

extend(Material, Component);
Component.prototype.maker.material = Material;

