'use strict';

module.exports = function (grunt) {
  grunt.initConfig({
  uglify: {
    target: {
      files: {
        './server/public/app.min.js': ['./client/scripts/app.js']
      }
    }
  },
  concat: {
    options: {
      separator: '\n',
    },
    dist: {
      src: [
      './client/scripts/main_module.js',
      './client/scripts/components/*.js'
      ],
      dest: './client/scripts/app.js',
    }
  },
    less:{
      options:{
        banner:'\/\/Global Style Sheet Powered By grunt-contrib-less\n\n'
        //,compress:true
      },
      files:{
        dest:'./server/public/global.css',
        src:'./client/less/styles.less'
      }
    },
    watch: {
      scripts:{
        files:['client/scripts/*.js','client/scripts/components/*.js'],
        tasks:['concat','uglify']
      },
      styles:{
        files:['client/less/*.less'],
        tasks:['less']
      },
      all: {
        files: ['server/**/*.*'],
        tasks: ['myTask']
      },
      options:{
        livereload:true
      }
    }
  });

  grunt.registerTask('myTask', function() {
    console.log('\x1b[40m\x1b[37m','there was a change');
  });

  grunt.registerTask('startServer', function() {
    require('./index.js');
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.registerTask('default', ['less','concat','uglify','startServer','watch']);
};