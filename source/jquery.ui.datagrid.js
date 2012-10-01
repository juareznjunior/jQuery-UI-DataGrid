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

	$.widget('ui.datagrid', {

		options: {

			/**
			 * Sql limit clause
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
			 *
			 * @context ui.datagrid
			 */
			,onComplete: false
			,onError: false

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
		
			// helper
			var uiDataGridTables = [],contentScroll;
			
			// container datagrid
			this.uiDataGrid = $(getTemplateDataGrid());
			
			// tables in container
			this.uiDataGrid.find('table').filter(function(){
				if ( $(this).hasClass('ui-datagrid') ) {
					uiDataGridTables.push(this);
				} else {
					contentScroll = this.parentNode.parentNode;
				}
			});

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

			// pagination td cache
			// initial config
			this.uiDataGridTdPagination = {
				td: []
				,childs: []
			};

			// clear
			uiDataGridTables = contentScroll = null;

			// set data-rowselected
			$.data(this.uiDataGridTbody[0],'rowselected',$([]));

			if ( true === this.options.pagination ) {
				// create and disable buttons 
				this._createPageButtons();
			}
			
			// plugin params
			this._offset = 0;
			this._lastNumberRow = 0;
			this._totalPages = 0;
			
			// tbody events
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
				$.Widget.prototype._setOption.apply(this,arguments);
			}
		}
		,_createPageButtons: function() {
		
			var self = this
				,td = $(self.uiDataGridTfoot[0].rows[0].cells).last()[0];

			// setter dom td cache
			self.uiDataGridTdPagination.td = td;
			// add dom span
			self.uiDataGridTdPagination.childs.push($(td).children()[0])

			$.map(['first','prev','next','end'],function(n,b){

				b = $('<button>').attr('name','data-grid-button-'+n).text(n).button({
					icons: { primary: 'ui-icon-seek-'+n}
					,text: false
					,disabled: true
				}).appendTo(td);

				// add dom button
				self.uiDataGridTdPagination.childs.push(b[0]);
			});

			// prev next event
			$(td).on('click','button.ui-button',(function(self){
				return function(event) {

					event.preventDefault();

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

			td = self = null;
		}
		,_managePagination: function(num_rows) {

			var self = this,currentPage,infoPages;

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

			if ( self.options.pagination && num_rows ) {

				// setters
				self._totalPages = Math.ceil(num_rows / self.options.limit);
				currentPage      = (self._offset == 0 ) ? 1 : ((self._offset / self.options.limit) + 1);
				infoPages        = currentPage+' de '+self._totalPages+' ('+num_rows+')';

				this.uiDataGridTdPagination.td.style.visibility = 'visible';

				$.each(this.uiDataGridTdPagination.childs,function(){
					if (/span/i.test(this.tagName)) {
						// update info
						this.innerHTML = infoPages
					} else {
						// enable buttons
						(/data-grid-button-(first|prev)/.test(this.name))
							? (self._offset > 0 && this.disabled && $(this).button('enable'))
							: (self._totalPages > currentPage && this.disabled && $(this).button('enable'))
					}
				});
			}

			self = null;
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
				,$helperTag = $('<div>')
				,$helper    = $('<div class="ui-widget ui-state-default" style="overflow:scroll;position:absolute;left:0"></div>');
			
			// each mapper
			$.map(self.options.mapper,function(obj,index){
			
				text = obj.title || obj.name;
				w = 10;

				// remove tags
				auxTh = $(th).text($helperTag.html(text).text())
				
				// align
				if ( /left|right|center/.test(obj.align) ) {
					auxTh[0].style.textAlign = obj.align;
				}

				// width
				if ( undefined !== obj.width ) {
					w = obj.width;
				}
				
				// ajuste do width - using div helper
				(function(div){
					w = (Math.max(w,div.innerWidth()));
					return div;
				}( $helper.html(text).appendTo(document.body) )).remove();
				
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

			// last col
			$(cols).last().width('auto');

			// create colgroup cols
			$([self.uiDataGridColGroup1[0],self.uiDataGridColGroup2[0]]).append(cols);

			// create thead ths
			$([self.uiDataGridThead[0].rows[0],self.uiDataGridTheadBody[0].rows[0]]).append(row);
			
			row = auxTh = self = col = cols = $helper = $helperTag = th = null;
		}
		,_createRows: function(json,origin,appendRow) {
		
			var self = this
				,theadThs = self.getThead()[0].rows[0].cells
				,oTbody = appendRow ? self.uiDataGridTbody[0] : self.uiDataGridTbody.empty()[0]
				,row
				,cell
				,cls = 'ui-widget ui-widget-content'
				,offset = appendRow ? (oTbody.rows.length + 1) : (self._offset + 1)
				,localPagination = ('local' === origin && self.options.pagination)
				// this not good!!!
				,num_rows = ( undefined === json.num_rows )
					? ( undefined === json.rows )
						? ( undefined === json[0].num_rows )
							? json.length
							: json[0].num_rows
						: ( undefined === json.rows[0].num_rows )
							? json.rows.length
							: json.rows[0].num_rows
					: json.num_rows;

			// correct JSON
			json = json.rows || json;

			// local pagination
			if ( !appendRow && localPagination && offset > 1 ) {
				// seek?
				json = json.slice(self._offset);
			}

			if ( !appendRow ) {
				// manage paginantion
				self._managePagination(num_rows);
				// reset scroll
				self.uiDataGridScrollBody.scrollTop(0);
			}
	
			// use each
			$.each( json ,function(i,obj){

				// break
				if ( !appendRow && localPagination && i === self.options.limit ) {
					return false
				}
			
				// tr
				row = oTbody.insertRow(-1);
				row.className = 'ui-state-hover';
			
				// row number
				if ( self.options.rowNumber ) {
					cell = row.insertCell(0);
					cell.className = 'ui-state-default ui-datagrid-cell-rownumber';
					cell.innerHTML = '<div>'+(offset + i)+'</div>';
				}
				
				// tds
				$.map(self.options.mapper,function(td,j){
					cell = row.insertCell(-1);
					cell.className = cls;
					cell.style.cssText = 'text-align:'+theadThs[cell.cellIndex].style.textAlign;
					$(cell).html(
						$.isFunction(td.render)
							// if options.render is a function
							// @context cell
							// @param content
							// @param json row
							? td.render.call(cell,obj[td.name],obj)

							// default
							// mapper.row.fieldName
							: obj[td.name]
					);
				});
			});
			
			theadThs = oTbody = row = cell = self = json = null;
		}
		,_ajax: function() {

			var o = this.options
				,url = o.jsonStore.url
				,limit = o.limit
				,offset = this._offset
				,store = o.jsonStore;
			
			// local data
			if ( undefined === url || '' === url ) {
				this._createRows(store.data,'local');
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
							alert((0=== this.length) ? 'Empty rows' : this.error);
						}

						return false;
					}
					
					// create rows
					this._createRows(json,'ajax');
				}
			});
		}
		,render: function() {
			var self = this,cell,h;
			
			if ( self._active() ) {
				self.resetOffset();
				self.load()
			} else {
				if ( $.isArray(self.options.toolBarButtons) ) {

					// cell to append btns
					cell = self.uiDataGridTfoot[0].rows[0].cells[0];

					// each button
					$.map(self.options.toolBarButtons,function(b,i){

						(function(ui){

							if ( $.isFunction(b.fn) ) {

								this.on('click',function(event){
									event.preventDefault();
									b.fn.apply(ui.element[0],arguments);
									$(this).blur();
									return false;
								});
							}
							
							this.button({
								icons:{
									primary: (undefined === b.icon) ? null : 'ui-icon-'+b.icon
								}
							});
							
							cell.appendChild(this[0]);
							
						}).call( $('<button>').text(b.label),self);
					});

					cell = null;
				}
				
				// render container
				if ( self.element.css('display') === 'none' ) {
					self.element.show();
				}
				
				// create ui-datagrid
				self.uiDataGrid.appendTo(self.element);
				
				// create columns
				self._createColumns();
				
				// dimensions
				h = self.uiDataGridThead.outerHeight();
				
				// set margin
				self.uiDataGridTheadBody
					.parent()
					.css('marginTop',-h);
				h = null;
				
				// resize
				self.resize();

				// load
				(self.options.autoLoad && self.load());
				
				// onComplete callback
				if ( $.isFunction(self.options.onComplete) ) {

					setTimeout((function(ui){
						return function(){
							ui.options.onComplete.call(ui.element[0]);
						}
					}(self)),1);
					
				}
			}

			self = null;
			
			return this;
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
		,_tbodyEvents: function() {
			
			if ( $.isFunction(this.options.onClickRow) ) {

				// delegate
				this.uiDataGridTbody.off().on('click','tr',(function(ui) {

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

			return this;
		}
		,_active: function() {
			return this.element.children(':eq(0)').hasClass('ui-datagrid-container');
		}
		,_getBHF: function(bfh,callback) {
			return ($.isFunction(callback))
				? callback.call(bfh[0])
				: bfh;
		}
		,resize: function() {
			// fit to parent
			if ( this.options.fit ) {
				(function(self){
					var h = self.uiDataGrid.outerHeight() - self.element.height();
					this.style.height = $(this).height() - h +'px';
				}).call(this.uiDataGridScrollBody[0],this);
			}
			
			return this;
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
			return this;
		}
		,widget: function() {
			return this.uiDataGrid;
		}
		,destroy: function() {
			$.Widget.prototype.destroy.call(this);
			this.element.empty();
		}
		,getOffset: function() {
			return this._offset;
		}
		,resetOffset: function() {
			this._offset = 0;
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
	});

	// Helpers

	var getTemplateDataGrid = function() {
		return '<div class="ui-datagrid-container ui-widget ui-widget-content ui-corner-all">'
			+'<div class="ui-state-default ui-datagrid-title"><div class="ui-widget-header"></div></div>'
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