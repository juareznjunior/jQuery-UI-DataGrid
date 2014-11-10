/*!
 * jQuery datagrid
 * 
 * @autor:.....: Juarez Gonçalves Nery Junior
 * @email:.....: juareznjunior@gmail.com
 * @twitter:...: @juareznjunior
 * @date.......: 2014-11-10
 * 
 * Use jQueryUI - Depends:
 *	 jquery.ui.core.js
 *	 jquery.ui.widget.js
 *	 jquery.ui.button.js
 * 
 */
;(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define([ "jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}(function( $ ) {

	'use strict';

	var jQueryDataGrid = {
		options : {

			/**
			 * limit clause
			 */
			limit: 20

			/**
			 * Data Mapper
			 * Usage:
			 * mapper:[{
			 *   name   : 'field_name'
			 *  ,title  : 'Field Title'
			 *  ,width  : 50
			 *  ,align  : 'center|left|right'
			 *  ,sort   : true
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
			 *    text: 'My Button Label'
			 *   ,icon : 'arrowthickstop-1-s'
			 *   ,click   : function(button) {}
			 * }]
			 *
			 * click context: ui.datagrid
			 * click param: buttton
			 *
			 */
			,toolBarButtons: false
			
			/**
			 * Usage:
			 * {
			 *     initial: integer cellIndex
			 *    ,direction: string desc|asce
			 *    ,remote: boolean
			 * }
			 *
			 */
			,sort: false

			/**
			 * Usage:
			 * {
			 *    eventName: function() {}
			 * }
			 *
			 * click context: ui.datagrid
			 * click param: dom
			 * 
			 */
			,eventController: false
		}
		,_create: function() {

			// render container
			if ( this.element.css('display') === 'none' ) {
				this.element.show();
			}
		
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
			}).end();

			// grid title
			if ( this.options.title === '' ) {
				$(contentScroll.parentNode).prev().remove();
			} else {
				$(contentScroll.parentNode).prev().children().html(this.options.title);
			}

			// remove tfoot if...
			if ( $.isArray(this.options.toolBarButtons) === false && this.options.pagination === false) {
				$(uiDataGridTables[3].parentNode).remove();
			}

			// setters
			this.uiDataGridThead      = $(uiDataGridTables[0].tHead);
			this.uiDataGridLayout     = $(uiDataGridTables[1].tBodies[0].rows[0]);
			this.uiDataGridTheadBody  = $(uiDataGridTables[2].tHead);
			this.uiDataGridColGroup1  = this.uiDataGridThead.prev();
			this.uiDataGridColGroup2  = $(this.uiDataGridLayout[0].parentNode).prev();
			this.uiDataGridColGroup3  = this.uiDataGridTheadBody.prev();
			this.uiDataGridTbody      = $(uiDataGridTables[2].tBodies[0]);
			this.uiDataGridMsgError   = $(uiDataGridTables[2]).next();
			this.uiDataGridTfoot      = (this.options.pagination || $.isArray(this.options.toolBarButtons)) ? $(uiDataGridTables[3].tBodies[0]) : $([]);
			this.uiDataGridScrollBody = $(uiDataGridTables[1].parentNode).height(this.options.height);
			this.uiDataGridScrollMain = $(contentScroll);

			// pagination cache elements
			// initial config
			this.uiDataGridTdPagination = {
				childs: []
			};

			// selected Row(s)
			this._selectedRows = [];

			// clear
			uiDataGridTables = contentScroll = null;
			
			// pagination params
			this._num_rows   = 0;
			this._offset     = 0;
			this._totalPages = 0;

			this._createPagination();
			
			// cast to queryString
			// jsonStore.params
			// literal object (isPlainObject (json))
			if ( $.isPlainObject(this.options.jsonStore.params) ) {
				this.options.jsonStore.params = $.param( this.options.jsonStore.params );
			}
		}
		,_init: function() {
			if ( true === this.options.autoRender ) {
				this.render();
			}
		}
		,_createColumns: function() {

			var self   = this
				,$auxTh = null
				,text   = null
				,tplCol = '<col></col>'
				,tplTh  = '<th class="ui-widget ui-state-default" role="columnheader"></th>'
				,tplTd  = '<td class="ui-widget ui-widget-content"></td>'
				,clsAl  = 'ui-datagrid-align-'
				,clsCh  = 'ui-datagrid-column-hide'
				,sw     = 0;

			var $cols = $([ self.uiDataGridColGroup1[0],self.uiDataGridColGroup2[0],self.uiDataGridColGroup3[0] ]).empty()
				,$trs  = $([ self.uiDataGridThead[0].rows[0],self.uiDataGridTheadBody[0].rows[0] ]).empty()
				,wcols = (100/self.options.mapper.length);

			self.uiDataGridLayout.empty();

			// enable row number
			if ( self.options.rowNumber ) {
				$cols.append( $('<col></col>').addClass('ui-datagrid-cell-rownumber') );
				$trs.append('<th class="ui-state-default ui-datagrid-cell-rownumber" role="columnheader"></th>');
				self.uiDataGridLayout.append(tplTd);
			}
			
			// each mapper
			$.map(self.options.mapper,function(obj,width){
			
				text = obj.title || obj.name;
				width = ( width < self.options.mapper.length - 1 )
					? isNaN( parseFloat(obj.width) )
						? wcols+'%'
						: obj.width
					: '';

				// remove tags
				$auxTh = $(tplTh).html(text);
				$auxTh = $auxTh.text($auxTh.text());
				
				// align
				$auxTh.data('text-align',clsAl+(( /left|right|center/.test(obj.align) ) ? obj.align : 'left')).addClass(function(){
					return $(this).data('textAlign');
				});

				if ( true === obj.sort ) {
					$auxTh
						.addClass('ui-datagrid-sort ui-state-disabled')
						.html(function(b){
							return $('<button>'+this.innerHTML+'</button>',{type:'button'}).button({icons:{primary:'',secondary:'ui-icon-carat-2-n-s'}});
						});
				}

				var  $cell = $(tplTd)
					,$col  = $(tplCol).width( width );

				// hide column
				if ( undefined !== obj.hidden ) {
					$([$auxTh.data('hidden',clsCh)[0],$col[0],$cell[0]]).addClass(clsCh);
				}
				
				$trs.append( $auxTh );
				$cols.append( $col );	
				self.uiDataGridLayout.append( $cell );

				$col = $cell = obj = null;
			});

			// enable overflow-y
			self.uiDataGridColGroup1.children().map(function(){
				sw += $(this).width();
			});
			if ( sw > self.element.width() ) {
				self.uiDataGridScrollMain.width(sw);
			}
			
			sw = wcols = 0;

			$(self.uiDataGridTheadBody[0].parentNode.tHead).hide();
			
			$auxTh = $trs = $cols = null;
			tplCol = null;
			tplTh  = null;
			tplTd  = null;
			clsAl  = null;
			clsCh  = null;
			
			this._sort();
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

			$.map( json ,function(obj,i){

				// break
				if ( localPagination && i === self.options.limit ) {
					return false;
				}
			
				// tr
				row           = oTbody.insertRow(-1);
				row.className = 'ui-state-hover';

				$(row)
					// create row data, using current json mapper
					.data('row-json',obj)
					// create row data, offset index
					.data('row-index',(offset + 1));
			
				// row number
				if ( self.options.rowNumber ) {
					$(row.insertCell(0)).addClass('ui-state-default ui-datagrid-cell-rownumber').text((offset + i));
				}
				
				if ( $.isFunction(self.options.eventController.onClickRow) ) {
					$(row).data('uiDataGridBindClick','onClickRow');
				}
				
				// tds
				$.map(self.options.mapper,function(td,j){
					cell = row.insertCell(-1);
					cell.className = cls;

					// column classes
					$.map($(theadThs[cell.cellIndex]).data(),function(v,k){
						if ( /textAlign|text-align|hidden/.test(k) ) {
							cell.className += ' '+v;
						}
					});

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
				this._updatePagination();

				// reset scroll
				self.uiDataGridScrollBody.scrollTop(0);
			}
			
			// sort
			if ( $.isPlainObject(this.options.sort) ) {
				$( this.uiDataGridThead[0].rows[0].cells ).filter('.ui-datagrid-sort').removeClass('ui-state-disabled');
			}
			
			theadThs = oTbody = row = cell = self = json = null;
		}
		,_createPagination: function() {

			if ( true === this.options.pagination ) {

				var self = this
					,td = $(this.uiDataGridTfoot[0].rows[0].cells).last()[0]
					,i;

				// add dom span
				self.uiDataGridTdPagination.childs.push($(td).children()[0]);

				// create pagination buttons
				$.map(['first','prev','next','end'],function(n,b){

					i = b;

					b = $('<button></button>',{type:'button',name:'uiDataGridSetPage-'+n,disabled:true})
						.text(n)
						.button({
							icons: { primary: 'ui-icon-seek-'+n}
							,text: false
						})
						.data('uiDataGridBindClick','loadPage')
						.appendTo(td);

					// add dom button
					self.uiDataGridTdPagination.childs.push(b[0]);

					b = null;
				});

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
			// using num_rows within mapper
			// [{"num_rows":number,"foo":"bar","date":date}]
			//
			// disable pagination via request
			// [{"foo":"bar","date":date},{"foo":"bar","date":date},{"foo":"bar","date":date}]
			// [] | {}
			//

			if ( this.options.pagination && this._num_rows ) {

				// setters
				this._totalPages = Math.ceil(this._num_rows / this.options.limit);
				currentPage      = (this._offset === 0 ) ? 1 : ((this._offset / this.options.limit) + 1);
				infoPages        = currentPage+' de '+this._totalPages+' ('+this._num_rows+')';

				(function(self){
					$.map(self.uiDataGridTdPagination.childs,function(b){
						if (/span/i.test(b.tagName)) {
							// update info
							$(b).text(infoPages);
						} else {
							// enable buttons
							( /uiDataGridSetPage-(first|prev)/.test(b.name) )
								? (self._offset > 0 && b.disabled && $(b).button('enable') )
								: (self._totalPages > currentPage && $(b).button('enable') );
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
				$.map(self.options.toolBarButtons,function(obj,idx){

					var $button = $('<button></button>',{type:'button'});

					obj.label = obj.label || obj.text;
					obj.click = obj.fn || obj.click;
					obj.icons = obj.icon ? { primary:'ui-icon-'+obj.icon }: {};

					delete obj.fn;

					if ( $.isFunction(obj.click) ) {
						$button.data('uiDataGridBindClick','toolBarButtons:'+idx+':click');
					}

					$button.button(obj).appendTo(cell);
					$button = null;
				});

				cell = self = null;
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
			this.uiDataGridTbody.empty();
			this.uiDataGridMsgError.text(m).addClass('show-message');
		}
		,_ajax: function() {

			var o       = this.options
				,url    = o.jsonStore.url
				,limit  = o.limit
				,offset = this._offset
				,store  = o.jsonStore;
				
			// if sort
			if ( $.isPlainObject(this.options.sort) ) {
				$( this.uiDataGridThead[0].rows[0].cells ).filter('.ui-datagrid-sort').addClass('ui-state-disabled');
			}
			
			// clear selected rows
			this.clearSelectedRows();
			
			// hide error msgs
			this.uiDataGridMsgError.removeClass('show-message');

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
			
			store = null;
			
			this.addParam({limit:limit,offset:offset});
			
			o = o.ajaxMethod.toLowerCase();
			
			// ajax
			$.ajax({
				 type: o
				,url: url.replace(/\?.*/,'')
				,data: this.options.jsonStore.params
				,dataType: 'json'
				,context: this
				,success: function(json) {

					if ( undefined !== json.error || 0 === json.length  ) {
						
						json = (undefined !== json.error)
							? json.error
							: ( json.length === 0 )
								? this.options.emptyDataMessage
								: 'Invalid JSON';
								
						if ( $.isFunction(this.options.onError) ) {
							this.options.onError.call(this.element[0],json);
						} else {
							this._message(json);
						}

						return false;
					}
					
					// create rows
					this._createRows(json,'ajax');
					
					( $.isFunction(this.options.onAjaxSuccess) && this.options.onAjaxSuccess.call(this.element[0]) );
				}
			});
		}
		,_sort: function() {
		
			if ( !$.isPlainObject( this.options.sort ) ) {
				return;
			}
		
			var _cellIndex
				,config = this.options.sort;
		
			function _text(row) {
				row = row.cells.item(_cellIndex).textContent.toLowerCase().replace('.','').replace(',','.');
				return false === isNaN(row) ? parseFloat(row) : row;
			}

			function _sort(a, b) {
				var va = _text(a), vb = _text(b), n = parseInt(va, 10);
				if (n) {
					va = n;
					vb = parseInt(vb, 10);
				}
				return va > vb ? 1 : va < vb ? -1 : 0;
			}
		
			// @param event
			function eventSort(event) {
			
				var th = this.parentNode;
				
				if ( $(th).hasClass('ui-state-disabled') ) {
					return;
				}
				
				var  self = event.data.self
					,tr = th.parentNode
					,cache = $.data(tr,'currentRowSort')
					,tBody = self.uiDataGridTbody[0]
					,i = 0
					,rows
					,len
					,row
					,orderby
					,updateClass = $(th).hasClass('tablesorter-headerAsc')
						? 'tablesorter-headerDesc'
						: 'tablesorter-headerAsc'
					,fragment = document.createDocumentFragment();
				
				$([th,( undefined !== cache && th !== cache ) ? cache : []])
					.removeClass('tablesorter-header')
					.removeClass('tablesorter-headerAsc')
					.removeClass('tablesorter-headerDesc');
			
				_cellIndex = th.cellIndex;
			
				$.data(tr,'currentRowSort',th);
				
				self.addParam('order='+self.options.mapper[_cellIndex].name+'_'+updateClass.replace('tablesorter-header','').toLowerCase());
				
				// remote sort
				if ( true === self.options.sort.remote && self._num_rows > self.options.limit ) {
					self.load();
				} else { // local sort
					rows = tBody.rows;
					len = rows.length;
					
					rows = Array.prototype.sort.call(Array.prototype.slice.call(rows, 0), _sort);
					
					if ( 'tablesorter-headerDesc' === updateClass ) {
						Array.prototype.reverse.call(rows);
					}
					
					while ( tBody.firstChild ) {
						tBody.removeChild(tBody.firstChild);
					}
					
					while ( row = rows[i++] ) {
						fragment.appendChild(row);
					}
					
					tBody.appendChild(fragment);
				}
				
				$(th).addClass('tablesorter-header '+updateClass);
				
				fragment = null;
				self = null;
				tr = null;
				th = null;
				cache = null;
				tBody = null;
				row = null;
				rows = null;
			}
			
			if ( /^[0-9]$/.test(parseInt(config.initial,10).toString()) ) {
				_cellIndex = config.initial;
				$.data(
					 this.uiDataGridThead[0].rows[0]
					,'currentRowSort'
					,$(this.uiDataGridThead[0].rows[0].cells[_cellIndex]).addClass('tablesorter-header tablesorter-header'+(/^(Desc|Asc)$/.test( config.direction ) ?  config.direction : 'Asc'))[0]
				);
			}
			
			this.uiDataGridThead.on('click.uiDataGridEventSort','.ui-button.ui-button-text-icon-secondary',{self:this},eventSort);
		}
		,_eventObserve: function(event) {

			this._on(this.uiDataGridTbody,{'click':this._setupGridEvents});
			
			if ( true === this.options.pagination ) {
				this._on( this.uiDataGridTfoot[0].rows[0].cells[1],{'click':this._setupGridEvents});
			}
			
			if ( $.isArray(this.options.toolBarButtons) ) {
				this._on( this.uiDataGridTfoot[0].rows[0].cells[0],{'click':this._setupGridEvents});
			}
		}
		,_setupGridEvents : function(event) {
			
			var  target    = event.target
				,bindClick = $(target).data('uiDataGridBindClick')
				,inputChk  = target.type === 'checkbox' ||  target.type === 'radio'
				,trigger;
				
			// via DOMStringMap
			// data-ui-data-grid-bind-click=""
			if ( undefined === bindClick && !!target.dataset ) {
				bindClick = target.dataset['uiDataGridBindClick'];
			}
			
			// closest parentNode
			if ( undefined === bindClick ) {
				target    = $(target).closest(':data(uiDataGridBindClick)')[0];
				bindClick = $(target).data('uiDataGridBindClick');
				
				if ( 'onClickRow' === bindClick ) {
					this.options.eventController.onClickRow.call(this.element[0],target,event);
					return inputChk;
				}
			}
			
			if ( undefined !== bindClick ) {
			
				if ( 'loadPage' === bindClick ) {
				
					if ( false === target.disabled ) {
						trigger = $(this.uiDataGridTdPagination.childs).filter('button');
						trigger.removeClass('ui-state-hover ui-state-focus').button('disable');
						trigger = target.name.split('-').slice(-1);
						this['_'+trigger+'Page']();
						this.load();
					}
					
					return;
				}
				
				trigger = ( /^toolBarButtons/.test(bindClick) )
					? this.options.toolBarButtons[bindClick.replace(/[^0-9]/g,'')].click || false
					: this.options.eventController[bindClick] || false;

				if ( $.isFunction(trigger) ) {
					trigger.call(this.element[0],target,event);
					return inputChk;
				}
			}
		}
		,render: function() {
			var self = this,delay = 0;
			
			if ( self._active() ) {
				self.resetOffset();
				self.load();
				self = null;
				return;
			}
				
			// config buttons
			self._createToolBarButtons();
			
			// create ui-datagrid
			self.uiDataGrid.appendTo(self.element);
			
			// create columns
			self._createColumns();
			
			self._eventObserve();
			
			// resize
			self.resize();

			// load
			if ( true === self.options.autoLoad ) {
				delay = 180;
				// delay
				setTimeout((function(ui){
					return function() {
						ui.load();
					};
				}(self)),delay);
			}
			
			// onComplete callback
			if ( $.isFunction(self.options.onComplete) ) {
				// delay
				setTimeout((function(ui){
					return function(){
						ui.options.onComplete.call(ui.element[0]);
					};
				}(self)),(delay++));
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
		,selectRow: function(row) {
			var self = this
				,idx= $.inArray(row,this._selectedRows);
				
			if ( idx > -1 ) {
				this._selectedRows.splice(idx,1);
				$(row).removeClass('ui-state-highlight');
			} else {
				this._selectedRows.push(row);
				$(row).addClass('ui-state-highlight');
			}

			self = null;
		}
		,clearSelectedRows: function() {
			this.getSelectedRows(true).removeClass('ui-state-highlight');
			this._selectedRows = [];
		}
		,getSelectedRows: function(obj) {
			return ( true === obj ) ? $(this._selectedRows) : this._selectedRows;
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
				$.map(this.uiDataGridTdPagination.childs,function(b){
					(/span/i.test(b.tagName))
						? $(b).text(' ')
						: $(b).button('disable');
				});				
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
		,updateColumns: function(newMapper) {
			this.options.mapper = newMapper;
			this.uiDataGridTbody.empty();
			this._createColumns();
			this.resetOffset();
		}
		,addParam: function(new_params) {
			
			function uQs(uri, key, value) {
				
				var re = new RegExp("([\\?|&]?)" + key + "=.*?(&|$)", "i")
					,separator = '&';
					
				return ( uri.match(re) )
					? uri.replace(re, '$1' + key + "=" + value + '$2')
					: uri + separator + key + "=" + value;
			}
			
			var current_params = this.options.jsonStore.params;
			
			if ( '' !== current_params ) {
				
				if ( 'string' === typeof new_params ) {

					new_params = new_params.replace(/^[\\?]/,'').split('&');

					$.map(new_params,function(v){
						v = v.split('=');
						current_params = uQs(current_params,v[0],v[1]);
					});
				} else {
					$.map( new_params, function(v,k){
						current_params = uQs(current_params,k,v);
					});
				}
			} else {
				current_params = ( 'string' === typeof new_params ) ? new_params : $.param(new_params);
			}
			
			this.options.jsonStore.params = current_params;
			current_params = null;
		}
	};
 		
	var getTemplateDataGrid = function() {
		return '<div class="ui-datagrid-container ui-widget ui-widget-content ui-corner-all">'
			+'<div class="ui-datagrid-title"><div class="ui-widget-header">Title</div></div>'
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
												+'<tr role="rowheader" class="active"></tr>'
											+'</thead>'
										+'</table>'
									+'</th>'
									+'<th></th>'
								+'</tr>'
							+'</thead>'
						+'</table>'
					+'</div>'
					+'<div class="ui-widget-content ui-datagrid-body">'
						+'<table class="ui-datagrid ui-front ui-datagrid-gridlayout">'
							+'<colgroup></colgroup>'
							+'<tbody>'
								+'<tr></tr>'
							+'</tbody>'
						+'</table>'
						+'<table class="ui-datagrid ui-front">'
							+'<colgroup></colgroup>'
							+'<thead>'
								+'<tr role="rowheader"></tr>'
							+'</thead>'
							+'<tbody></tbody>'
						+'</table>'
						+'<div class="ui-state-error ui-front"></div>'
					+'</div>'
				+'</div>'
			+'</div>'
			+'<div class="ui-widget ui-state-default ui-datagrid-tools">'
				+'<table class="ui-datagrid">'
					+'<tbody>'
						+'<tr>'
							+'<td>&nbsp;</td>'
							+'<td><span></span></td>'
						+'</tr>'
					+'</tbody>'
				+'</table>'
			+'</div>'
		+'</div>';
	};

	$.widget('ui.datagrid',{
		_setOption: function(option,value) {
			var store;
			if ( 'jsonStore' === option && $.isPlainObject(value) ) {
				store = this.options.jsonStore = $.extend({},this.options.jsonStore,value);
				if ( $.isPlainObject( store.params ) ) {
					this.options.jsonStore.params = $.param(store.params);
				}
				store = null;

			}
			
			this._super(option,value);
			
			if ( 'title' === option ) {
				this.uiDataGridScrollMain.parent().prev().children().html(value);
			}
		}
		,_destroy: function() {
			this.element.empty();
		}
	});

	$.widget('ui.datagrid',$.ui.datagrid,jQueryDataGrid);
	jQueryDataGrid = null;
}));