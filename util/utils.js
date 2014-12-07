module.exports = {
  stringify: function (obj) {
    return JSON.stringify(obj,
      function (k, v) {
        if (v === undefined) return null;
        if (typeof v == 'function') return '' + v;
        return v;
      }, '  ');
  },
  deepCopy: function (json) {
    return JSON.parse(JSON.stringify(json));
  },
  randomLinear: function (min, max) {
    min = min || 0;
    max = max || 0;
    return min + (max - min) * Math.random();
  },
  randomColor: function () {
    var color = 0;
    for (var i = 0; i < 3; i++) {
      color = ( color << 8) | ~~(0xff * Math.random());
    }
    return color;
  },
  randomItem: function (list) {
    return list[~~(Math.random() * list.length)];
  },
  randomXYZ: function (min, max) {
    return {
      x: this.randomLinear(min, max),
      y: this.randomLinear(min, max),
      z: this.randomLinear(min, max)
    };
  },
  argList: function (args) {
    //args is like arguments, transform it into an array
    var a = [];
    for (var i = 0; i < args.length; i++) {
      a.push(args[i]);
    }
    return a;
  },
  isNode: function () {
    return typeof(self) === 'undefined';
  },
  isBrowserWindow: function () {
    return (typeof(window) === 'object') && (typeof(window.document) === 'object');
  },
  isBrowserWorker: function () {
    return (typeof(self) === 'object') && !self.window;
  },
  time: function (from) {
    return new Date().getTime() - (from || 0);
  },
  copyFromAmmo: function (ammoVector, toExtend, ammoHelper) {
    if (!toExtend) toExtend = {};
    toExtend.x = ammoVector.x();
    toExtend.y = ammoVector.y();
    toExtend.z = ammoVector.z();
    if (ammoVector instanceof ammoHelper.btQuaternion) {
      toExtend.w = ammoVector.w();
    }
    return toExtend;
  },
  normalizeConnector: function (c, ammoHelper) {
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
    this.copyFromAmmo(up, c.up, ammoHelper);
    this.copyFromAmmo(front, c.front, ammoHelper);
    var t = new ammoHelper.btTransform();
    t.setBasis(m3);
    t.setOrigin(base);
    //ammoHelper.destroy(up);
    //ammoHelper.destroy(front);
    //ammoHelper.destroy(wing);
    return t;
  },
  MxV: function (m, v) {
    var b = m.getBasis();
    var o = m.getOrigin();
    var r = v.dot3(b.getRow(0), b.getRow(1), b.getRow(2));
    r.op_add(o);
    return r;
  },
  MxQ: function (m, q) {
    var r = m.getRotation();
    r.op_mul(q);
    return r;
  },
  logTransform: function (t, title) {
    if (title !== undefined) console.log(title);
    console.log('position:', t.getOrigin().x(), t.getOrigin().y(), t.getOrigin().z());
    console.log('quaternion:', t.getRotation().x(), t.getRotation().y(), t.getRotation().z(), t.getRotation().w());
  },
  approachConnectors: function (fix, move, make, ammoHelper) {
    //move bodies to match connectors, which are already normalized, with computed transforms
    if (!ammoHelper) return;

    //body to move
    var moveConInvTrans = new ammoHelper.btTransform(new ammoHelper.btTransform(move.ammoTransform).inverse());
    var moveBodyInvTrans = new ammoHelper.btTransform(move.body.ammoTransform);
    moveBodyInvTrans = new ammoHelper.btTransform(moveBodyInvTrans.inverse());

    //fixed body
    var fixConTrans = new ammoHelper.btTransform(fix.ammoTransform);
    var fixBodyTrans = new ammoHelper.btTransform(fix.body.ammoTransform);

    //move body to origin and then its connector to origin
    moveConInvTrans.op_mul(moveBodyInvTrans);
    //the move.body to fix connector relative position
    fixConTrans.op_mul(moveConInvTrans);
    //then apply fix body transform
    fixBodyTrans.op_mul(fixConTrans);
    //reuse it apply to body to move
    move.body.ammoTransform.op_mul(fixBodyTrans);
    move.body.position = make('physics', 'position', this.copyFromAmmo(move.body.ammoTransform.getOrigin(), {}, ammoHelper));
    move.body.quaternion = make('physics', 'quaternion', this.copyFromAmmo(move.body.ammoTransform.getRotation(), {}, ammoHelper));
  },
  configChart: function (Chart, customOptions) {
    _.extend(Chart.defaults.global, {
      animation: false,
      showScale: true,
      scaleOverride: false,
      scaleIntegersOnly: false,
      responsive: false,
      maintainAspectRatio: true,
      showTooltips: false
    });
    if (typeof customOptions == 'object') {
      _.extend(Chart.defaults.global, customOptions);
    }
  }
};
