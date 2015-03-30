module.exports = function (grunt) {

  grunt.initConfig({
    concat: {
      basic: {
        src: [
          'src/component.js',
          'src/settings.js',
          'src/system.js',
          'src/method.js',
          'src/vector.js',
          'src/shape.js',
          'src/material.js',
          'src/light.js',
          'src/body.js',
          'src/connector.js',
          'src/constraint.js',
          'src/scene.js',
          'src/monitor.js',
          'src/renderer.js',
          'src/worker.js',
          'src/simulation.js',
          'src/exports.js'
        ],
        dest: 'mecanica.js'
      },
      options: {
        banner: '(function(){\n',
        footer: '\n})();'
      }
    },
    connect: {
      server: {
        options: {
          port: 8080,
          base: '.'
        }
      }
    },
    shell: {
      listDir: {
        command: 'cd util && bash listdir.sh'
      }
    },
    watch: {
      files: ['<%= concat.basic.src %>'],
      tasks: ['concat','shell:listDir']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('default', ['connect','watch']);

};