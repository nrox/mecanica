module.exports = function (grunt) {

  grunt.initConfig({
    concat: {
      basic: {
        src: ['src/*.js'],
        dest: 'mecanica.js'
      },
      options: {
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
