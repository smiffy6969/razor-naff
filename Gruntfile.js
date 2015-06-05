module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // Vulcanize all components into single file
    vulcanize: {
      // standard
      full: {
        options: {
          // Task-specific options go here.
          csp: false,
          excludes: {
            imports: [
              "polymer.html"
            ]
          },
          "strip-excludes": false
        },
        files: {
          // Target-specific file lists and/or options go here. dest: source
          'build/razor.vulc.html': 'src/razor.html'
        }
      },

      // csp (builds external script file too)
      "full-csp": {
        options: {
          // Task-specific options go here.
          csp: true,
          excludes: {
            imports: [
              "polymer.html"
            ]
          },
          "strip-excludes": false
        },
        files: {
          // Target-specific file lists and/or options go here. dest: source
          'build/razor.vulc.csp.html': 'src/razor.html'
        }
      },

      // Vulcanize each group off components into their own files
      base: {
        options: {
          // Task-specific options go here.
          csp: false,
          excludes: {
            imports: [
              "polymer.html",
              "razor-base.html",
              "razor-control.html",
              "razor-overlay.html",
              "razor-extended.html"
            ]
          },
          "strip-excludes": false
        },
        files: {
          // Target-specific file lists and/or options go here. dest: source
          'build/razor-base.vulc.html': 'src/razor-base.html',
          'build/razor-control.vulc.html': 'src/razor-control.html',
          'build/razor-overlay.vulc.html': 'src/razor-overlay.html',
          'build/razor-extended.vulc.html': 'src/razor-extended.html'
        }
      },    

      // Vulcanize each group csp (builds external script file too)
      "base-csp": {
        options: {
          // Task-specific options go here.
          csp: true,
          excludes: {
            imports: [
              "polymer.html",
              "razor-base.html",
              "razor-control.html",
              "razor-overlay.html",
              "razor-extended.html"
            ]
          },
          "strip-excludes": false
        },
        files: {
          // Target-specific file lists and/or options go here. dest: source
          'build/razor-base.vulc.csp.html': 'src/razor-base.html',
          'build/razor-control.vulc.csp.html': 'src/razor-control.html',
          'build/razor-overlay.vulc.csp.html': 'src/razor-overlay.html',
          'build/razor-extended.vulc.csp.html': 'src/razor-extended.html'
        }
      }
    },

    // replace imports in vulc files with with vulc imports for when using group vulc files
    replace: {
      default: {
        src: ['build/*.html'],
        overwrite: true,                 // overwrite matched source files
        replacements: [
          {from: "src/razor-base.html", to: "build/razor-base.vulc.html"},
          {from: "src/razor-control.html", to: "build/razor-control.vulc.html"},
          {from: "src/razor-overlay.html", to: "build/razor-overlay.vulc.html"},
          {from: "src/razor-extended.html", to: "build/razor-extended.vulc.html"}
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-vulcanize');
  grunt.loadNpmTasks('grunt-text-replace');

  grunt.registerTask('deploy', ['vulcanize', 'replace']);
};