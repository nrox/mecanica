function Vector(options) {
  this.include(options, {
    x: 0, y: 0, z: 0, scale: undefined
  });
  if (this.runsPhysics()) this.ammo = new Ammo.btVector3(this.x, this.y, this.z);
  if (this.runsRender()) this.three = new THREE.Vector3(this.x, this.y, this.z);
  if (this.scale) this.setScale(this.scale);

}

Vector.prototype.fromAmmo = function (ammoVector) {
  var options = {};
  options.x = ammoVector.x();
  options.y = ammoVector.y();
  options.z = ammoVector.z();
  return new Vector(options);
};

Vector.prototype.copyFromAmmo = function (ammoVector) {
  this.x = ammoVector.x();
  this.y = ammoVector.y();
  this.z = ammoVector.z();
  if (this.runsPhysics()) {
    this.ammo.setValue(this.x, this.y, this.z);
  }
  if (this.runsRender()) {
    this.three.set(this.x, this.y, this.z);
  }
  return this;
};

Vector.prototype.add = function (v) {
  if (this.ammo && v.ammo) this.ammo.op_add(v.ammo);
  if (this.three && v.three) this.three.add(v.three);
  return this;
};

Vector.prototype.setScale = function (scale) {
  if (this.ammo) this.ammo.op_mul(scale);
  if (this.three) this.three.multiplyScalar(scale);
  this.x *= scale;
  this.y *= scale;
  this.z *= scale;
  return this;
};

Vector.prototype.destroy = function () {
  if (this.ammo) Ammo.destroy(this.ammo);
};

Vector.prototype.toJSON = function () {
  //don't include scale, because it's already scaled
  return {x: this.x, y: this.y, z: this.z};
};

function Quaternion(options) {
  this.include(options, {
    x: 0, y: 0, z: 0, w: undefined
  });
  if (this.w === undefined) {
    //XYZ order
    var c1 = Math.cos(this.x / 2), c2 = Math.cos(this.y / 2), c3 = Math.cos(this.z / 2);
    var s1 = Math.sin(this.x / 2), s2 = Math.sin(this.y / 2), s3 = Math.sin(this.z / 2);
    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;
  }
  if (this.runsPhysics()) {
    this.ammo = new Ammo.btQuaternion(this.x, this.y, this.z, this.w);
  }
  if (this.runsRender()) {
    this.three = new THREE.Quaternion(this.x, this.y, this.z, this.w);
  }
}

Quaternion.prototype.fromAmmo = function (ammoVector) {
  var options = {};
  options.x = ammoVector.x();
  options.y = ammoVector.y();
  options.z = ammoVector.z();
  options.w = ammoVector.w();
  return new Quaternion(options);
};

Quaternion.prototype.copyFromAmmo = function (ammoVector) {
  this.x = ammoVector.x();
  this.y = ammoVector.y();
  this.z = ammoVector.z();
  this.w = ammoVector.w();
  if (this.runsPhysics()) {
    this.ammo.setValue(this.x, this.y, this.z, this.w);
  }
  if (this.runsRender()) {
    this.three.set(this.x, this.y, this.z, this.w);
  }
  return this;
};

Quaternion.prototype.multiply = function (v) {
  if (this.ammo && v.ammo) this.ammo.op_mul(v.ammo);
  if (this.three && v.three) this.three.multiply(v.three);
  return this;
};

Quaternion.prototype.destroy = function () {
  if (this.ammo) Ammo.destroy(this.ammo);
};

Quaternion.prototype.toJSON = function () {
  return {x: this.x, y: this.y, z: this.z, w: this.w};
};

extend(Vector, Component);
extend(Quaternion, Component);
