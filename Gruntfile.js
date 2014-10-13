module.exports = function( grunt ) {

	"use strict";
	
	grunt.file.defaultEncoding = 'iso-8859-1';

	grunt.loadNpmTasks('grunt-contrib-uglify' );
	grunt.registerTask('default', [ 'uglify' ]);
};