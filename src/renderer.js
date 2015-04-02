function Renderer(options, system) {
  this.construct(options, system, 'available');
}

Renderer.prototype.types = {
  available: function (options, system) {
    try {
      Renderer.prototype.types.webgl.call(this, options, system);
    } catch (e) {
      Renderer.prototype.types.canvas.call(this, options, system);
    }
  },
  _intro: function (options, system) {
    this.include(options, {
      width: 500, height: 500, container: undefined
    });
    if (jQuery && THREE) {
      if (system.getSettings().reuseCanvas) {
        this.canvas = jQuery('canvas[monitor=""]').first();
        if (this.canvas.length) {
          this.canvas.attr('monitor', this.id);
          this.canvas.show();
          this.canvas = this.canvas.get(0);
        } else {
          delete this.canvas;
        }
      }
    }
  },
  _outro: function (options, system) {
    if (jQuery && THREE) {
      var settings = system.getSettings();
      jQuery(settings.canvasContainer).append(this.three.domElement);
      jQuery(this.three.domElement).attr('monitor', this.id);
      this.three.setSize(this.width, this.height);
    }
  },
  webgl: function (options, system) {
    Renderer.prototype.types._intro.call(this, options, system);
    if (this.runsWebGL()) {
      this.three = new THREE.WebGLRenderer({canvas: this.canvas});
    }
    Renderer.prototype.types._outro.call(this, options, system);
  },
  canvas: function (options, system) {
    Renderer.prototype.types._intro.call(this, options, system);
    if (this.runsWebGL()) {
      this.three = new THREE.CanvasRenderer({canvas: this.canvas});
    }
    Renderer.prototype.types._outro.call(this, options, system);
  }
};

extend(Renderer, Component);
Component.prototype.maker.renderer = Renderer;