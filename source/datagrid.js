/*!
 * Datagrid
 * 
 * @autor:.....: Juarez Gonçalves Nery Junior
 * @email:.....: juareznjunior@gmail.com
 * @twitter:...: @juareznjunior
 * @date.......: 2014-01-29
 * 
 */
;(function($,window,document,undefined) {

	'use strict';

	if ( undefined === $.ui.core ) {
		$.extend( $.expr[ ":" ], {
			data: $.expr.createPseudo(function( dataName ) {
				return function( elem ) {
					return !!$.data( elem, dataName );
				};
			})
		});
	}
	
	var getTemplateDataGrid = function() {
		return '<div class="ui-datagrid-container ui-widget ui-widget-content ui-corner-all">'
			+'<div class="ui-datagrid-title"><div class="ui-widget-header">Title</div></div>'
			+'<div class="ui-datagrid-content">'
				+'<div class="ui-datagrid-content-scroll">'
					+'<div class="ui-datagrid-header">'
						+'<table>'
							+'<thead>'
								+'<tr>'
									+'<th>'
										+'<table class="ui-datagrid">'
											+'<colgroup></colgroup>'
											+'<thead>'
												+'<tr></tr>'
											+'</thead>'
										+'</table>'
									+'</th>'
									+'<th></th>'
								+'</tr>'
							+'</thead>'
						+'</table>'
					+'</div>'
					+'<div class="ui-widget-content ui-datagrid-body">'
						+'<table class="ui-datagrid ui-front">'
							+'<colgroup></colgroup>'
							+'<thead>'
								+'<tr></tr>'
							+'</thead>'
							+'<tbody></tbody>'
						+'</table>'
						+'<div class="ui-state-error ui-front"></div>'
					+'</div>'
				+'</div>'
			+'</div>'
			+'<div class="ui-widget ui-state-default ui-datagrid-tools">'
				+'<table class="ui-datagrid ">'
					+'<tbody>'
						+'<tr>'
							+'<td>&nbsp;</td>'
							+'<td><span></span></td>'
						+'</tr>'
					+'</tbody>'
				+'</table>'
			+'</div>'
		+'</div>';
	}
	,defaults = {

		/**
		 * limit clause
		 */
		limit: 20

		/**
		 * Data Mapper
		 * Usage:
		 * mapper:[{
		 *  name    : 'field_name'
		 *  ,title  : 'Field Title'
		 *  ,width  : 50
		 *  ,align  : 'center|left|right'
		 *  ,render : function(DOMCell,json.name,json) {}
		 * }]
		 *
		 */
		,mapper: []

		/**
		 * Scroll height
		 */
		,height: 200

		/**
		 * Data store and ajax config
		 * $.ajax
		 *  param
		 *  url
		 *
		 * Local data
		 *  data
		 * 
		 */
		,jsonStore: {
			 url: ''
			,params: {}
			,data: {}
		}
		
		,pagination: true
		,refresh: false
		,rowNumber: false
		,fit: false
		,autoRender: true
		,autoLoad: true

		/**
		 * Datagrid title
		 */
		,title: ''

		/**
		 * Callback
		 *
		 * @context ui.datagrid
		 * @param row clicked
		 * @param event
		 */
		,onClickRow: false

		/**
		 * Callback
		 * After render grid template
		 *
		 * @context ui.datagrid
		 */
		,onComplete: false
		
		/**
		 * Callback
		 * After ajax Load (success)
		 * 
		 * @context ui.datagrid
		 */
		,onAjaxSuccess: false

		/**
		 * Callback
		 * Ajax Error
		 *
		 * @context ui.datagrid
		 */
		,onError: false

		/**
		 * empty rows, request or local data
		 */
		,emptyDataMessage: 'Empty rows'

		/**
		 * Usage:
		 * [{
		 *    text  : 'My Button Label'
		 *   ,icon  : 'arrowthickstop-1-s'
		 *   ,click : function(button) {}
		 * }]
		 *
		 * click context: ui.datagrid
		 * click param: buttton
		 *
		 */
		,toolBarButtons: false
 	}
	,DataGrid = function(elem,options) {
		this.element = elem;
		this.options = $.extend( {}, defaults, options );
	};
	
	DataGrid.prototype = {
		init: function() {
		}
		,render: function() {
		}
	}
	
	// expose jQuery plugin
	$.fn.datagrid = function(options,get,set) {

		var returnValue = this;

		this.each(function(data,elem){

			data = $.data(this,'DataGrid');
			elem = this;

			if ( undefined === data ) {
				$.data(this,'DataGrid',new DataGrid(elem,options));
			} else {
				var isMethodCall = (typeof options === "string")
					,methodValue
					,instance = data;
				if ( isMethodCall ) {
					if ( 'option' === options ) {
						if ( undefined !== get ) {
							if ( undefined !== set ) {
								instance.options[get] = ( $.isPlainObject(set) )
									? $.extend({},instance.options[get],set)
									: set;
							} else {
								returnValue = instance.options[get];
							}
						}
					} else {
						methodValue = instance[ options ].apply( instance, [options]);
						if ( methodValue !== instance && methodValue !== undefined ) {
							returnValue = methodValue && /^get/i.test(options)
								? methodValue
								: returnValue.pushStack( methodValue.get() );
						}
					}
					methodValue = instance = null;
				}
			}
			data = elem = null;
		});

		return returnValue;
	};

}(jQuery,window,document));