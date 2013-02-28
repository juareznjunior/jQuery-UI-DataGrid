/*!
 * jQuery UI datagrid
 * 
 * @autor:.....Juarez Gonçalves Nery Junior
 * @email:.....juareznjunior@gmail.com
 * @twitter:...@juareznjunior
 * 
 * Depends:
 *	 jquery.ui.core.js
 *	 jquery.ui.widget.js
 *	 jquery.ui.button.js
 */
;(function($,window,document,undefined) {

	'use strict';

	var JQUERY_UI_VERSION = parseFloat($.ui.version);

	// plugin
	$.widget('ui.datagrid', {

		options: {

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
			 * Data store
			 *
			 * Ajax Request
			 *  url and params OR
			 *
			 * data JSON local
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
			 * AJAX Request method
			 */
			,ajaxMethod: 'GET'

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
			 *   lable: 'My Button Label'
			 *   ,icon: 'arrowthickstop-1-s'
			 *   ,fn: function(event) {}
			 * }]
			 *
			 */
			,toolBarButtons: false
		}
		,_create: function() {

			// render container
			if ( this.element.css('display') === 'none' ) {
				this.element.show();
			}
		
			// helper
			var uiDataGridTables = [],contentScroll;
			
			// container datagrid
			this.uiDataGrid = $(_getTemplateDataGrid());
			
			// tables in container
			this.uiDataGrid.find('table').filter(function(){
				if ( $(this).hasClass('ui-datagrid') ) {
					uiDataGridTables.push(this);
				} else {
					contentScroll = this.parentNode.parentNode;
				}
			}).end();

			// grid title
			if ( this.options.title === '' ) {
				$(contentScroll.parentNode).prev().remove();
			} else {
				$(contentScroll.parentNode).prev().children().text(this.options.title)
			}

			// remove tfoot if...
			if ( $.isArray(this.options.toolBarButtons) === false && this.options.pagination === false) {
				$(uiDataGridTables[2].parentNode).remove();
			}

			// setters
			this.uiDataGridThead      = $(uiDataGridTables[0].tHead);
			this.uiDataGridTheadBody  = $(uiDataGridTables[1].tHead);
			this.uiDataGridColGroup1  = this.uiDataGridThead.prev();
			this.uiDataGridColGroup2  = this.uiDataGridTheadBody.prev();
			this.uiDataGridTbody      = $(uiDataGridTables[1].tBodies[0]);
			this.uiDataGridTfoot      = (this.options.pagination || $.isArray(this.options.toolBarButtons)) ? $(uiDataGridTables[2].tBodies[0]) : $([]);
			this.uiDataGridScrollBody = $(uiDataGridTables[1].parentNode).height(this.options.height);
			this.uiDataGridScrollMain = $(contentScroll);

			// pagination cache elements
			// initial config
			this.uiDataGridTdPagination = {
				childs: []
			};

			// clear
			uiDataGridTables = contentScroll = null;

			// set data-rowselected
			$.data(this.uiDataGridTbody[0],'rowselected',$([]));
			
			// pagination params
			this._num_rows   = 0;
			this._offset     = 0;
			this._totalPages = 0;

			// create pagination, initial config
			// se _updatePagination()
			this._createPagination();
			
			// tBodie onClickRow
			this._tbodyEvents();
		}
		,_init: function() {
			if (this.options.autoRender) {
				this.render();
			}
		}
		,_setOption: function(option,value) {
			if ( 'jsonStore' === option && $.isPlainObject(value) ) {
				this.options.jsonStore = $.extend({},this.options.jsonStore,value);
			} else {
				( JQUERY_UI_VERSION === 1.9 )
					? this._super(option,value)
					: $.Widget.prototype._setOption.apply(this,arguments);
			}
		}
		,_destroy: function() {

			if ( JQUERY_UI_VERSION < 1.9 ) {
				$.Widget.prototype.destroy.call(this);
			}

			this.element.empty();
		}
		,_createColumns: function() {

			var self        = this
				,auxTh      = null
				,row        = []
				,cols       = []
				,text       = null
				,w          = 0
				,sw         = 0
				,col        = '<col></col>'
				,th         = '<th class="ui-widget ui-state-default" role="columnheader"></th>'
				,al         = 'ui-datagrid-align-';
			
			// each mapper
			$.map(self.options.mapper,function(obj,index){
			
				text = obj.title || obj.name;
				w    = 10;

				// remove tags
				auxTh = $(th).html(text);
				auxTh = auxTh.text(auxTh.text());
				
				// align
				if ( /left|right|center/.test(obj.align) ) {
					$(auxTh[0]).data('text-align',al+obj.align).addClass(al+obj.align);
				} else {
					$(auxTh[0]).data('text-align',al+'left').addClass(al+'left');
				}

				// width
				if ( undefined !== obj.width ) {
					w = obj.width;
				}
				
				// append
				cols[cols.length] = $(col).width(w)[0];
				row[row.length] = auxTh[0];

				sw += w;
			});

			// enable row number
			if (self.options.rowNumber) {
				cols.splice(0,0,$(col).width(20)[0]);
				row.splice(0,0,$('<th class="ui-state-default ui-datagrid-cell-rownumber" role="columnheader"><div></div></th>')[0])
				sw += 20;
			}

			// enable overflow-y
			if ( sw > self.element.width() ) {
				self.uiDataGridScrollMain.width(sw)
			}

			// create colgroup cols
			$([self.uiDataGridColGroup1[0],self.uiDataGridColGroup2[0]]).append(cols.slice(0,-1));

			// create thead ths
			$([self.uiDataGridThead[0].rows[0],self.uiDataGridTheadBody[0].rows[0]]).append(row);

			// correct column width
			$(self.uiDataGridThead[0].rows[0].cells).slice(0,-1).map(function(i,w){
				w = $(w).outerWidth();
				self.uiDataGridColGroup1.children().eq(i).width(w);
				self.uiDataGridColGroup2.children().eq(i).width(w);
			});

			// grid layout
			$(self.uiDataGridTbody[0].parentNode).map(function(i,t){

				// clone table
				t = $(t)
						.clone()
						.addClass('ui-datagrid-gridlayout')
						.find('tbody')
						.append('<tr><td class="ui-widget ui-widget-content">&nbsp;'+Array(t.tHead.rows[0].cells.length).join('</td><td class="ui-widget ui-widget-content">&nbsp;')+'</td></tr>')
						.end()
						.appendTo(t.parentNode);

				$(t[0].tHead).remove();

				// update class if rowNumber
				if ( self.options.rowNumber ) {
					t[0].tBodies[0].rows[0].cells[0].className = 'ui-state-default ui-datagrid-cell-rownumber';
				}

			});

			$(self.uiDataGridTheadBody[0].parentNode.tHead).hide();
			
			row = auxTh = self = col = cols = th = al = null;
		}
		,_createRows: function(json,origin,appendRow) {

			var self             = this
				,theadThs        = self.getThead()[0].rows[0].cells
				,oTbody          = appendRow ? self.uiDataGridTbody[0] : self.uiDataGridTbody.empty()[0]
				,cls             = 'ui-widget ui-widget-content'
				,offset          = appendRow ? (oTbody.rows.length + 1) : (self._offset + 1)
				,localPagination = (!appendRow && 'local' === origin && self.options.pagination)
				,row
				,cell;

			// set _num_rows
			if ( self._num_rows === 0 ) {
				self._num_rows = ( undefined === json.num_rows )
					? ( undefined === json.rows )
						? ( undefined === json[0].num_rows )
							? json.length
							: json[0].num_rows
						: ( undefined === json.rows[0].num_rows )
							? json.rows.length
							: json.rows[0].num_rows
					: json.num_rows;
			}

			// correct JSON
			json = json.rows || json;

			// local pagination
			if ( localPagination && offset > 1) {
				// seek?
				json = json.slice(self._offset);
			}

			// use each
			$.each( json ,function(i,obj){

				// break
				if ( localPagination && i === self.options.limit ) {
					return false
				}
			
				// tr
				row           = oTbody.insertRow(-1);
				row.className = 'ui-state-hover';

				// create row data, using current json mapper
				$.data(row,'row-json',obj);
			
				// row number
				if ( self.options.rowNumber ) {
					$(row.insertCell(0)).addClass('ui-state-default ui-datagrid-cell-rownumber').html('<div>'+(offset + i)+'</div>');
				}
				
				// tds
				$.map(self.options.mapper,function(td,j){
					cell = row.insertCell(-1);
					cell.className = cls+' '+$.data(theadThs[cell.cellIndex],'text-align');

					// render
					$(cell)
						.html(
							$.isFunction(td.render)
								// if options.render is a function
								// @context cell
								// @param content
								? td.render.call(cell,obj[td.name])

								// default
								// mapper.row.fieldName
								: obj[td.name]
						);
				});
			});

			if ( !appendRow ) {
				// update paginantion
				this._updatePagination()

				// reset scroll
				self.uiDataGridScrollBody.scrollTop(0);
			}
			
			theadThs = oTbody = row = cell = self = json = null;
		}
		,_createPagination: function() {

			if ( true === this.options.pagination ) {

				var self = this
					,td = $(this.uiDataGridTfoot[0].rows[0].cells).last()[0];

				// add dom span
				self.uiDataGridTdPagination.childs.push($(td).children()[0])

				// create pagination buttons
				$.map(['first','prev','next','end'],function(n,b){

					b = $('<button>').attr('name','data-grid-button-'+n).text(n).button({
						icons: { primary: 'ui-icon-seek-'+n}
						,text: false
						,disabled: true
					}).appendTo(td);

					// add dom button
					self.uiDataGridTdPagination.childs.push(b[0]);

					b = null;
				});

				// prev next event
				$(td).on('click','button.ui-button',(function(self){
					return function(event) {

						event.preventDefault();
						event.stopPropagation();

						if ( false === this.disabled ) {

							var c = ['_',this.name.replace(/data-grid-button-/,''),'Page'];

							// disable buttons
							$(self.uiDataGridTdPagination.childs).filter('button').removeClass('ui-state-hover ui-state-focus').button('disable');

							// call private method
							// _nextPage
							// _prevPage
							// _endPage
							// _firstPage
							self[c.join('')]();

							// load
							self.load();

							// clear
							c = null;
						}

						return false;
					
					}
				})(self));

				// show td buttons
				td.style.visibility = 'visible';

				self = td = null;
			}

		}
		,_updatePagination: function() {

			var currentPage
				,infoPages;

			// 
			// using keys num_rows and rows
			// {"num_rows": number,rows:[{"foo":"bar","date":date},{"foo":"bar","date":date}]}
			//
			// using num_rows mapper
			// [{"num_rows":number,"foo":"bar","date":date}]
			//
			// disable pagination via request
			// [{"foo":"bar","date":date},{"foo":"bar","date":date},{"foo":"bar","date":date}]
			// [] | {}
			//

			if ( this.options.pagination && this._num_rows ) {

				// setters
				this._totalPages = Math.ceil(this._num_rows / this.options.limit);
				currentPage      = (this._offset == 0 ) ? 1 : ((this._offset / this.options.limit) + 1);
				infoPages        = currentPage+' de '+this._totalPages+' ('+this._num_rows+')';

				(function(self){
					$.map(self.uiDataGridTdPagination.childs,function(b){
						if (/span/i.test(b.tagName)) {
							// update info
							$(b).text(infoPages)
						} else {
							// enable buttons
							(/data-grid-button-(first|prev)/.test(b.name))
								? (self._offset > 0 && b.disabled && $(b).button('enable'))
								: (self._totalPages > currentPage && b.disabled && $(b).button('enable'))
						}
					});
				}(this));
			}
		}
		,_createToolBarButtons: function() {

			if ( $.isArray(this.options.toolBarButtons) ) {

				// cell to append btns
				var self = this
					,cell = this.uiDataGridTfoot[0].rows[0].cells[0];

				// each button
				$.map(self.options.toolBarButtons,function(b,i){

					(function(ui){

						if ( $.isFunction(b.fn) ) {

							this.on('click',function(event){

								event.preventDefault();
								event.stopPropagation();

								b.fn.apply(ui.element[0],arguments);
								$(this).blur();

							});
						}
						
						// button
						this.button({
							icons:{
								primary: (undefined === b.icon) ? null : 'ui-icon-'+b.icon
							}
						});
						
						// append button
						cell.appendChild(this[0]);
						
					}).call( $('<button>').text(b.label),self);
				});

				cell = self = null;
			}
		}
		,_tbodyEvents: function() {
				
			if ( $.isFunction(this.options.onClickRow) ) {

				// delegate
				this.uiDataGridTbody.off().on('click','tr.ui-state-hover',(function(ui) {

					return function(event) {

						// highlight
						$(this).addClass('ui-state-highlight');

						// execute callback
						// @context ui.datagrid
						// @param row clicked
						// @param event
						ui.options.onClickRow.call(ui.element[0],this,event);

						// remove selected row
						(function(domTbody){
							
							// get clicked row
							var rowSelected = $.data(domTbody,'rowselected');

							// this = clicked row
							(event.currentTarget !== rowSelected[0] && rowSelected.removeClass('ui-state-highlight'));

							// set current row clicked
							$.data(domTbody,'rowselected',$(event.currentTarget));
							
							// clear
							rowSelected = null;

						})(ui.uiDataGridTbody[0]);
					}

				})(this));
			}

		}
		,_nextPage: function() {
			this._offset += this.options.limit;
		}
		,_prevPage: function() {
			this._offset -= this.options.limit;
		}
		,_endPage: function() {
			this._offset = (this._totalPages * this.options.limit) - this.options.limit;
		}
		,_firstPage: function() {
			this._offset = 0;
		}
		,_active: function() {
			return this.element.children(':eq(0)').hasClass('ui-datagrid-container');
		}
		,_getBHF: function(bfh,callback) {
			return ($.isFunction(callback))
				? callback.call(bfh[0])
				: bfh;
		}
		,_message: function(m) {

			var c = '<td class="ui-widget ui-datagrid-align-center ui-state-error" colspan="1000">'+m+'</td>';
			if ( this.options.rowNumber ) {
				c = '<td class="ui-state-default ui-datagrid-cell-rownumber"><div></div></td>'+c;
			}

			$('<tr>'+c+'</tr>').appendTo(this.uiDataGridTbody.empty()[0]);

			c = null;
		}
		,_ajax: function() {

			var o       = this.options
				,url    = o.jsonStore.url
				,limit  = o.limit
				,offset = this._offset
				,store  = o.jsonStore;
			
			// local data
			if ( undefined === url || '' === url ) {

				// valid JSON
				url = (store.data.rows || store.data)[0];

				if ( undefined === url  || undefined === url[o.mapper[0].name] ) {
					this._message('Invalid JSON or empty data');
				} else {
					// create rows
					this._createRows(store.data,'local');
				}

				url = null;

				return;
			}
			
			// serialize
			// literal object (isPlainObject (json))
			if ('string' === typeof store.params) {
				store.params = (0 === offset)
					? store.params+'&limit='+limit+'&offset='+offset
					: store.params.replace(/(&offset=)(.+)/,'&offset='+offset)
			} else {
			
				// ex: obj.datagrid('option','jsonStore',{url:'foo/bar'})
				if ( undefined === store.params ) {
					store.params = {};
				}
				
				// normalize
				store.params.limit = limit;
				store.params.offset = offset;
			}
			
			// ajax
			$.ajax({
				type: o.ajaxMethod.toLowerCase()
				,url: url.replace(/\?.*/,'')
				,data: store.params
				,dataType: 'json'
				,context: this
				,success: function(json) {

					if ( undefined != json.error || 0 === json.length  ) {

						if ( $.isFunction(this.options.onError) ) {
							this.options.onError.call(this.element[0]);
						} else {
							json = (undefined !== json.error)
								? json.error
								: ( json.length === 0 )
									? this.options.emptyDataMessage
									: 'Invalid JSON';

							this._message(json);
						}

						return false;
					}
					
					// create rows
					this._createRows(json,'ajax');
				}
			});
		}
		,render: function() {
			var self = this,delay = 0;
			
			if ( self._active() ) {
				self.resetOffset();
				self.load()
			} else {
				
				// config buttons
				self._createToolBarButtons();
				
				// create ui-datagrid
				self.uiDataGrid.appendTo(self.element);
				
				// create columns
				self._createColumns();
				
				// resize
				self.resize();

				// load
				if ( self.options.autoLoad ) {
					delay = 180;
					// delay
					setTimeout((function(ui){
						return function() {
							ui.load();
						}
					}(self)),delay)
				}
				
				// onComplete callback
				if ( $.isFunction(self.options.onComplete) ) {
					// delay
					setTimeout((function(ui){
						return function(){
							ui.options.onComplete.call(ui.element[0]);
						}
					}(self)),(delay+1));
				}
			}

			self = null;
		}
		,resize: function() {
			// fit to parent
			if ( this.options.fit ) {
				(function(self){
					var h = self.uiDataGrid.outerHeight() - self.element.height();
					this.style.height = $(this).height() - h +'px';
				}).call(this.uiDataGridScrollBody[0],this);
			}
		}
		,getSelectedRow: function() {
			return $.data(this.uiDataGridTbody[0],'rowselected');
		}
		,clearSelectedRow: function() {
			(function(){
				// remove highlight
				$.data(this,'rowselected').removeClass('ui-state-highlight');
				// reset
				$.data(this,'rowselected',$([]));
			}).call(this.uiDataGridTbody[0]);
		}
		,load: function() {
			this._ajax();
		}
		,widget: function() {
			return this.uiDataGrid;
		}
		,getOffset: function() {
			return this._offset;
		}
		,resetOffset: function() {
			this._num_rows = 0;
			this._offset = 0;
			if ( true === this.options.pagination ) {
				// disable pagination buttons
				$(this.uiDataGridTdPagination.childs).filter('button').button('disable');
			}
		}
		,getThead: function(callback) {
			return this._getBHF(this.uiDataGridThead,callback);
		}
		,getTbody: function(callback) {
			return this._getBHF(this.uiDataGridTbody,callback);
		}
		,getTFoot: function(callback) {
			return this._getBHF(this.uiDataGridTfoot,callback);
		}
		,addRow: function(json) {
			this._createRows(json,null,true);
		}
		,loadLocalData: function(json,callback) {
			this.resetOffset();
			this.options.jsonStore = {
				url: ''
				,params: {}
				,data: json
			};

			this.load();
			( $.isFunction(callback) && callback.call([]) );
		}
	});

	// private

	var _getTemplateDataGrid = function() {
		return '<div class="ui-datagrid-container ui-widget ui-widget-content ui-corner-all">'
			+'<div class="ui-datagrid-title"><div class="ui-widget-header"></div></div>'
			+'<div class="ui-datagrid-content">'
				+'<div class="ui-datagrid-content-scroll">'
					+'<div class="ui-datagrid-header ui-state-default">'
						+'<table>'
							+'<thead>'
								+'<tr>'
									+'<th>'
										+'<table class="ui-datagrid">'
											+'<colgroup></colgroup>'
											+'<thead>'
												+'<tr role="rowheader"></tr>'
											+'</thead>'
										+'</table>'
									+'</th>'
									+'<th></th>'
								+'</tr>'
							+'</thead>'
						+'</table>'
					+'</div>'
					+'<div class="ui-widget-content ui-datagrid-body">'
						+'<table class="ui-datagrid">'
							+'<colgroup></colgroup>'
							+'<thead>'
								+'<tr role="rowheader"></tr>'
							+'</thead>'
							+'<tbody></tbody>'
						+'</table>'
					+'</div>'
				+'</div>'
			+'</div>'
			+'<div class="ui-widget ui-state-default ui-datagrid-tools">'
				+'<table class="ui-datagrid">'
					+'<tbody>'
						+'<tr>'
							+'<td>&nbsp;</td>'
							+'<td style="visibility:hidden"><span></span></td>'
						+'</tr>'
					+'</tbody>'
				+'</table>'
			+'</div>'
		+'</div>';
	};
	
}(jQuery,window,document));