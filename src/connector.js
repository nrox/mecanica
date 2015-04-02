function Connector(options, system){
  this.construct(options, system, 'relative');

}

Connector.prototype.types = {
  //base and axis are specified in local coordinates
  relative: function (options, system) {
    this.include(options, {
      body: undefined, //the parent body id
      base: {x: 0, y: 0, z: 0}, //origin
      up: {x: 0, y: 0, z: 0}, //axis of rotation or direction of movement, normalized
      front: {x: 0, y: 0, z: 0} //defines the angle, should be perpendicular to 'up', normalized
    });
    this.notifyUndefined(['body', 'base', 'up', 'front']);
    var body = options.bodyObject || system.getObject('body', this.body);
    if (body) {
      body.connector[this.id] = this;
      this.body = body;
      this.ammoTransform = utils.normalizeConnector(this, ammoHelper);
      this.base = new Vector(this.base);
      this.up = new Vector(this.up);
      this.front = new Vector(this.front);
      //check for orthogonality
      var helper = system.getSettings().connectorHelper;
      if (THREE && helper) {
        //TODO reuse material and geometry
        var connectorHelperMaterial = new THREE.MeshBasicMaterial({
          color: 0x555555,
          transparent: true,
          opacity: 0.5
        });
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

extend(Connector, Component);
Component.prototype.maker.connector = Connector;