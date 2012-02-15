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
(function($){

	$.widget('ui.datagrid',{
		// plugin options
		options: {

			// default 20
			limit: 20

			// params
			//  - name
			//  - title
			//  - width
			//  - align
			//  - render -> callback
			//  - globalFunction -> callback
			,mapper: []

			// data grid body height
			,height:200

			// params
			//  - request params
			//  - url ajax
			//  - data local JSON
			,jsonStore:{
				params: {}
				,url: ''
				,data:{}
			}

			// boolean
			,pagination: true
			,refresh: false
			,rowNumber: false
			,fit: false
			,autoRender: true
			,autoLoad: true

			// POST or GET
			// default GET
			,ajaxMethod: 'GET'

			// string
			,title: ''

			// callback
			,onClickRow: false
			,onComplete: false
			,onError: false

			// json
			,toolBarButtons:false
		}
		,_create: function() {
		
			// helper
			var uiDataGridTables;
			
			// container datagrid
			this.uiDataGrid = $(this._getMarkup());
			
			// tables in container
			uiDataGridTables = this.uiDataGrid.find('table.ui-datagrid');
			
			// others
			this.uiDataGridThead = $(uiDataGridTables[0].tHead);
			this.uiDataGridColGroup = this.uiDataGridThead.prev();
			this.uiDataGridTheadBody = $(uiDataGridTables[1].tHead);
			this.uiDataGridTbody = $(uiDataGridTables[1].tBodies[0]);
			this.uiDataGridTfoot = (this.options.pagination || $.isArray(this.options.toolBarButtons))
				? $(uiDataGridTables[2].tBodies[0])
				: $([]);
			this.uiDataGridScroll = $(uiDataGridTables[1].parentNode).height(this.options.height);

			// set data-rowselected
			$.data(this.uiDataGridTbody[0],'rowselected',$([]));
			
			// plugin params
			this._offset = 0;
			this._totalPages = 0;
			this._selectedRows = [];
			
			// tbody events
			this._tbodyEvents();
			
			// clear
			uiDataGridTables = null
		}
		,_init: function() {
			(this.options.autoRender && this.render());
		}
		,_setOption: function(option,value) {
			$.Widget.prototype._setOption.apply(this,arguments);
		}
		,_getMarkup: function() {
			var _div = document.createElement('div')
				,frag = document.createDocumentFragment()
				,markup
				,caption = '<caption></caption>';
			
			_div.className = 'ui-datagrid-container ui-widget ui-widget-content ui-corner-all';
			
			if (this.options.title != '') {
				caption = '<caption class="ui-state-default"><div class="ui-widget-header">'+this.options.title+'</div></caption>';
			}
			
			// markup
			markup = '<div class="ui-datagrid-header ui-state-default">'
					+'<table>'
						+caption
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
								+'<th style="width:17px"></th>'
							+'</tr>'
						+'</thead>'
					+'</table>'
				+'</div>'
				+'<div class="ui-widget-content ui-datagrid-body">'
					+'<table class="ui-datagrid">'
						+'<thead>'
							+'<tr></tr>'
						+'</thead>'
						+'<tbody></tbody>'
					+'</table>'
				+'</div>';
			
			if (this.options.pagination || $.isArray(this.options.toolBarButtons)) {
				markup += '<div class="ui-widget ui-state-default ui-datagrid-tools">'
					+'<table cellspacing="0" cellpadding="0" class="ui-datagrid">'
						+'<tbody>'
							+'<tr>'
								+'<td>&nbsp;</td>';
			
				if (this.options.pagination) {
					markup += '<td><span></span></td>';
				}
			
				markup += '</tr></tbody></table></div>';
			}
			
			markup += '</div>';
			
			_div.innerHTML = markup;
			_div = frag.appendChild(_div);
			markup = frag = caption = null;
			
			return _div;
		}
		,_createToolButtons: function() {
		
			var a = $(this.uiDataGridTfoot[0].rows[0].cells).eq(-1)[0];

			['first','prev','next','end'].map(function(n,b){

				b = document.createElement('button');
				b.name = 'data-grid-button-'+n;
				b.innerHTML = n;

				$(b).button({
					icons: { primary: 'ui-icon-seek-'+n}
					,text: false
				}).appendTo(a);
			});
			
			a = null;
			
			return this;
		}
		,_disableToolButtons: function() {
			$(this.uiDataGridTfoot[0].rows[0].cells).eq(-1)
				.children(':button')
				.removeClass('ui-state-hover ui-state-focus')
				.button('disable');
			
			return this;
		}
		,_createColumns: function() {

			var self = this
				,cls = 'ui-widget ui-state-default'
				,auxTh
				,row = [];
			
			// each mapper
			self.options.mapper.map(function(obj,index){
			
				auxTh = document.createElement('th');
				auxTh.className = cls;
				
				var html = obj.title || obj.name
					,helper = document.createElement('div')
					,col = document.createElement('col')
					,w = 10;
					
				auxTh.innerHTML = html;
					
				helper.className = 'ui-widget ui-state-default';
				helper.style.cssText = 'overflow:scroll;position:absolute;left:0';
				helper.innerHTML = html;
				
				document.body.appendChild(helper);
				
				// align
				if ( /left|right|center/.test(obj.align) ) {
					auxTh.style.textAlign = obj.align;
				}

				// width
				if ( undefined !== obj.width ) {
					w = obj.width;
				}
				
				// ajuste do width
				w = (Math.max(w,helper.scrollWidth));
				
				// cel into colgroup
				col.style.width = w+'px';
				self.uiDataGridColGroup[0].appendChild(col);
				
				// append
				row[row.length] = auxTh;
				
				// remove helper
				document.body.removeChild(helper);
				helper = col = w = null;
			});
			
			// last cell width auto
			self.uiDataGridColGroup.children().eq(-1)[0].style.width = 'auto';
			
			if (self.options.rowNumber) {
				auxTh = document.createElement('th');
				auxTh.className = 'ui-state-default ui-datagrid-cell-rownumber';
				auxTh.innerHTML = '<div></div>';

				// cel into colgroup
				$(document.createElement('col'))
					.width(20)
					.prependTo(self.uiDataGridColGroup[0]);

				row.splice(0,0,auxTh)
			}

			self.uiDataGridColGroup.clone().insertBefore(self.uiDataGridTheadBody[0]);
			
			$([self.uiDataGridThead[0].rows[0],self.uiDataGridTheadBody[0].rows[0]]).append(row);
			
			row = auxTh = self = null;
		}
		,_createRows: function(json) {
		
			var self = this
				,theadThs = self.getThead()[0].rows[0].cells
				,oTbody = self.uiDataGridTbody.empty()[0]
				,row
				,cell
				,cls = 'ui-widget ui-widget-content';
		
			// reset scroll
			self.uiDataGridScroll.scrollTop(0);
			
			json.rows.map(function(obj,i){
			
				// tr
				row = oTbody.insertRow(-1);
				row.className = 'ui-state-hover';
			
				// row number
				if ( self.options.rowNumber ) {
					cell = row.insertCell(0);
					cell.className = 'ui-state-default ui-datagrid-cell-rownumber';
					cell.innerHTML = '<div>'+(parseInt(self._offset > 0 || 1) + i)+'</div>';
				}
				
				// tds
				self.options.mapper.map(function(td,j){
					cell = row.insertCell(-1);
					cell.className = cls;
					cell.style.cssText = 'text-align:'+theadThs[cell.cellIndex].style.textAlign;
					cell.innerHTML = $.isFunction(td.render)
						// if options.render is a function
						// param cell innerHTML
						? td.render.call(cell,obj[td.name])

						// default
						// mapper.row.fieldName
						: obj[td.name];
				});
			});
			
			theadThs = oTbody = row = cell = self = null;
		}
		,_ajax: function() {
			
			var self = this;
			
			// ajax
			if (self.options.jsonStore.url != '') {
			
				// serialize
				// literal object (isPlainObject (json))
				if ('string' === typeof self.options.jsonStore.params) {
					self.options.jsonStore.params = (0 === self._offset)
						? self.options.jsonStore.params+'&limit='+self.options.limit+'&offset='+self._offset
						: self.options.jsonStore.params.replace(/(&offset=)(.+)/,'&offset='+self._offset)
				} else {
				
					// ex: obj.datagrid('option','jsonStore',{url:'foo/bar'})
					if ( undefined === self.options.jsonStore.params ) {
						self.options.jsonStore.params = {};
					}
					self.options.jsonStore.params.limit = self.options.limit;
					self.options.jsonStore.params.offset = self._offset
				}
				
				// disable toolbar button
				// before ajax request
				if (self.options.pagination) {
					self._disableToolButtons();
				}
				
				// ajax
				$.ajax({
					type: self.options.ajaxMethod.toLowerCase()
					,url: self.options.jsonStore.url.replace(/\?.*/,'')
					,data: self.options.jsonStore.params
					,dataType: 'json'
					,context: self
					,success: function(json) {

						var self = this;

						if (undefined != json.error) {

							if ( $.isFunction(self.options.onError) ) {
								self.options.onError.call(self.element[0]);
							} else {
								alert(json.error);
							}

							return false;
						}
						
						if (undefined === json.num_rows || json.num_rows == 0) {
							return false;
						}
						
						if (self.options.pagination) {
						
							self._totalPages = Math.ceil(json.num_rows / self.options.limit);
							var currentPage = (self._offset == 0 ) ? 1 : ((self._offset / self.options.limit) + 1)
								,infoPages = currentPage+' de '+self._totalPages+' ('+json.num_rows+')';
							
							// last cell
							$.each($(self.uiDataGridTfoot[0].rows[0].cells).eq(-1).children(),function(){
								if (/span/i.test(this.tagName)) {
									// update info
									this.innerHTML = infoPages
								} else {

									// enable buttons
									(/data-grid-button-(first|prev)/.test(this.name))
										? (self._offset > 0 && this.disabled && $(this).button('enable'))
										: (self._totalPages > currentPage && this.disabled && $(this).button('enable'))
								}
							})
						}
						
						// create rows
						self._createRows(json);

						self = null;
					}
				})
			} else {
				self._createRows(self.options.jsonStore.data)
			}
		}
		,render: function() {
			var self = this;
			
			if ( self._active() ) {
				self.resetOffset();
				self.load()
			} else {
				if ( $.isArray(self.options.toolBarButtons) ) {

					// cell to append btns
					var cell = self.uiDataGridTfoot[0].rows[0].cells[0];

					// each button
					self.options.toolBarButtons.map(function(b,i){

						(function(ui){

							if ( $.isFunction(b.fn) ) {

								this.on('click',function(){
									b.fn.apply(ui.element[0],arguments);
									$(this).blur();
								});
							}
							
							this.button({
								icons:{
									primary: (undefined === b.icon) ? null : 'ui-icon-'+b.icon
								}
							});
							
							cell.appendChild(this[0]);
							
						}).call( $(document.createElement('button')).html(b.label),self);
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
				var h = self.uiDataGridThead.outerHeight();
				
				// set margin
				self.uiDataGridTheadBody
					.parent()
					.css('marginTop',-h);
				h = null;
				
				if (self.options.pagination) {
				
					// create and disable buttons 
					self._createToolButtons()._disableToolButtons();
					
					// prev next event
					$(self.uiDataGridTfoot[0].rows[0].cells).eq(-1).delegate('button','click',(function(self){
						return function() {

							if ( false === this.disabled ) {
								var c = ['_',this.name.replace(/data-grid-button-/,''),'Page'];

								// call private function
								// _nextPage
								// _prevPage
								// _endPage
								// _firstPage
								self[c.join('')]();

								// clear selectec row
								self._selectedRows = [];

								// load
								self.load();

								// clear
								c = null;
							}
						
						}
					})(self));
				}
				
				// resize
				self.resize();

				// load
				(self.options.autoLoad && self.load());
				
				// onComplete callback
				if ( $.isFunction(self.options.onComplete) ) {

					(function(ui){
						setTimeout(function(){
							ui.options.onComplete.call(ui.element[0]);
						})
					}(self));
					
				}
			}

			self = null;
			
			return this
		}
		,_nextPage: function() {
			this._offset += this.options.limit
		}
		,_prevPage: function() {
			this._offset -= this.options.limit
		}
		,_endPage: function() {
			this._offset = (this._totalPages * this.options.limit) - this.options.limit
		}
		,_firstPage: function() {
			this._offset = 0
		}
		,_tbodyEvents: function() {
			
			if ( $.isFunction(this.options.onClickRow) ) {

				// delegate
				this.uiDataGridTbody.off().on('click','tr',(function(ui) {

					return function(event) {

						// highlight
						$(this).addClass('ui-state-highlight');

						// execute callback
						// context ui.datagrid
						// param row clicked
						ui.options.onClickRow.call(ui,this);

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
			return this.element.children(':eq(0)').hasClass('ui-datagrid-container')
		}
		,resize: function() {
			// fit to parent
			if ( this.options.fit ) {
				(function(self){
					var h = self.uiDataGrid.outerHeight() - self.element.height();
					this.style.height = $(this).height() - h +'px';
				}).call(this.uiDataGridScroll[0],this);
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
			this._ajax()
			return this
		}
		,widget: function() {
			return this.uiDataGrid
		}
		,destroy: function() {
			$.Widget.prototype.destroy.call(this);
			this.element.empty()
		}
		,getOffset: function() {
			return this._offset
		}
		,resetOffset: function() {
			this._offset = 0
		}
		,getThead: function(callback) {
			return ($.isFunction(callback))
				? callback.call(this.uiDataGridThead[0])
				: this.uiDataGridThead
		}
		,getTbody: function(callback) {
			return ($.isFunction(callback))
				? callback.call(this.uiDataGridTbody[0])
				: this.uiDataGridTbody
		}
		,getTFoot: function(callback) {
			return ($.isFunction(callback))
				? callback.call(this.uiDataGridTfoot[0])
				: this.uiDataGridTfoot
		}
	})
}(jQuery));