function Connector(options, system) {
  this.construct(options, system, 'relative');
}

Connector.prototype.types = {
  //base and axis are specified in local coordinates
  relative: function (options) {
    this.include(options, {
      body: undefined, //the parent body id
      base: {x: 0, y: 0, z: 0}, //origin
      up: {y: 1}, //axis of rotation or direction of movement, normalized
      front: {z: 1} //defines the angle, should be perpendicular to 'up', normalized
    });
    this.notifyUndefined(['body', 'base', 'up', 'front']);
    var body = options.bodyObject || this.parentSystem.getObject('body', this.body);
    if (body) {
      body.connector[this.id] = this;
      this.body = body;
      this.ammoTransform = this.normalize();

      this.base = new Vector(this.base);
      this.applyLengthConversionRate(this.base);

      this.up = new Vector(this.up);
      this.front = new Vector(this.front);
      //check for orthogonality
      var settings = this.getSettings();
      var helper = settings.connectorHelper;
      if (THREE && helper) {
        helper = this.applyLengthConversionRate(helper);
        //TODO reuse material and geometry
        var connectorHelperMaterial = new THREE.MeshBasicMaterial({
          color: settings.connectorColor,
          transparent: true,
          opacity: 0.5
        });
        if (!this.body.shape.three.boundingSphere) this.body.shape.three.computeBoundingSphere();
        helper = Math.min(this.body.shape.three.boundingSphere.radius / 2, helper);

        var connectorHelperGeometry = new THREE.SphereGeometry(helper / 2, 6, 6);
        var s = new THREE.Mesh(connectorHelperGeometry, connectorHelperMaterial);
        var axis = new THREE.AxisHelper(helper);
        s.add(axis);

        //rotate the axis to match required directions
        s.up.copy(this.up.three); // (y axis, green)
        s.lookAt(this.front.three); // (z axis, blue)
        s.updateMatrix();

        //reset up
        //s.up.set(0, 1, 0);
        s.position.copy(this.base.three);
        body.three.add(s);
      }
    }
  }
};

Connector.prototype.normalize = function () {
  var ammoHelper = Ammo;
  var c = this;
  if (!ammoHelper) return undefined;
  var up = new ammoHelper.btVector3(c.up.x || 0, c.up.y || 0, c.up.z || 0);
  up.normalize();
  var front = new ammoHelper.btVector3(c.front.x || 0, c.front.y || 0, c.front.z || 0);
  var wing = up.cross(front);
  wing = new ammoHelper.btVector3(wing.x(), wing.y(), wing.z());
  wing.normalize();
  front = wing.cross(up);
  front = new ammoHelper.btVector3(front.x(), front.y(), front.z());
  front.normalize();
  var base = new ammoHelper.btVector3(c.base.x || 0, c.base.y || 0, c.base.z || 0);
  var v1 = wing;
  var v2 = up;
  var v3 = front;
  var m3 = new ammoHelper.btMatrix3x3(
    v1.x(), v1.y(), v1.z(),
    v2.x(), v2.y(), v2.z(),
    v3.x(), v3.y(), v3.z()
  );
  m3 = m3.transpose();
  c.up = {
    x: up.x(), y: up.y(), z: up.z()
  };
  c.front = {
    x: front.x(), y: front.y(), z: front.z()
  };
  var t = new ammoHelper.btTransform();
  t.setBasis(m3);
  t.setOrigin(base);
  ammoHelper.destroy(up);
  ammoHelper.destroy(front);
  ammoHelper.destroy(wing);
  return t;
};


Connector.prototype.approachConnector = function (fix) {
  //move bodies to match connectors, which are already normalized, with computed transforms
  if (!ammoHelper) return;
  var move = this;
  //body to move
  var moveConInvTrans = new ammoHelper.btTransform(new ammoHelper.btTransform(move.ammoTransform).inverse());
  var moveBodyInvTrans = new ammoHelper.btTransform(move.body.ammoTransform);
  moveBodyInvTrans = new ammoHelper.btTransform(moveBodyInvTrans.inverse());

  //fixed body
  var fixConTrans = new ammoHelper.btTransform(fix.ammoTransform);
  var fixBodyTrans = new ammoHelper.btTransform(fix.body.ammoTransform);

  moveBodyInvTrans.op_mul(fixBodyTrans);
  moveBodyInvTrans.op_mul(fixConTrans);
  moveBodyInvTrans.op_mul(moveConInvTrans);

  move.body.ammoTransform.op_mul(moveBodyInvTrans);
  move.body.position = Vector.prototype.fromAmmo(move.body.ammoTransform.getOrigin());
  move.body.quaternion = Quaternion.prototype.fromAmmo(move.body.ammoTransform.getRotation());

  move.body.updateMotionState();

  Ammo.destroy(moveConInvTrans);
  Ammo.destroy(moveBodyInvTrans);
  Ammo.destroy(fixConTrans);
  Ammo.destroy(fixBodyTrans);
};

Connector.prototype.updateOptions = function () {
  _.each(['base', 'up', 'front'], function (v) {
    this._options[v] = this[v].toJSON();
  }, this);
};

extend(Connector, Component);
Component.prototype.maker.connector = Connector;