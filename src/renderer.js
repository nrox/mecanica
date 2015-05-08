function Renderer(options, system) {
  this.construct(options, system, 'available');
}

Renderer.prototype.types = {
  available: function (options) {
    try {
      Renderer.prototype.types.webgl.call(this, options);
    } catch (e) {
      Renderer.prototype.types.canvas.call(this, options);
    }
  },
  _intro: function (options) {
    this.include(options, {
      width: this.settingsFor('canvasWidth'), height: this.settingsFor('canvasHeight'), container: undefined
    });
    if (jQuery && THREE) {
      if (this.getSettings().reuseCanvas) {
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
  _outro: function () {
    if (jQuery && THREE) {
      var settings = this.getSettings();
      jQuery(settings.canvasContainer).append(this.three.domElement);
      jQuery(this.three.domElement).attr('monitor', this.id);
      this.three.setSize(this.width, this.height);
      this.three.setClearColor(this.settingsFor('clearColor'));
    }
  },
  webgl: function (options) {
    Renderer.prototype.types._intro.call(this, options);
    if (this.runsRender()) {
      this.three = new THREE.WebGLRenderer({canvas: this.canvas, alpha: true});
    }
    Renderer.prototype.types._outro.call(this);
  },
  canvas: function (options) {
    Renderer.prototype.types._intro.call(this, options);
    if (this.runsRender()) {
      this.three = new THREE.CanvasRenderer({canvas: this.canvas, alpha: true});
    }
    Renderer.prototype.types._outro.call(this);
  }
};

extend(Renderer, Component);
Component.prototype.maker.renderer = Renderer;