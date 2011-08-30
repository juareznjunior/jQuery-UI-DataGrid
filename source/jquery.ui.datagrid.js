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
			limit:5
			,mapper:[]
			,height:200
			,jsonStore:{
				// ajax params
				params: {}
				// is ajax
				,url: ''
				// json
				,data:{}
			}
			,pagination: true
			,toolBarButtons:false
			,refresh: false
			,onSelectRow: false
			,rowHover: true
			,rowClick: true
			,rowNumber: false
			,ajaxMethod: 'GET'
			,autoRender: true
			,autoLoad: true
			,title: ''
			,classThead: 'ui-state-default'
			,containerBorder: true
			,fit: false
		}
		,_create: function() {
		
			// plugin params elements
			this.uiDataGrid = $(this._getMarkup());
			this.uiDataGridTables = this.uiDataGrid.find('table.ui-datagrid');
			this.uiDataGridThead = $(this.uiDataGridTables[0].tHead);
			this.uiDataGridTheadBody = $(this.uiDataGridTables[1].tHead);
			this.uiDataGridTbody = $(this.uiDataGridTables[1].tBodies[0]);
			this.uiDataGridTfoot = (this.options.pagination || $.isArray(this.options.toolBarButtons))
				? $(this.uiDataGridTables[2].tBodies[0])
				: $([]);
			this.uiDataGridScroll = $(this.uiDataGridTables[1].parentNode).height(this.options.height);
			
			// plugin params
			this._offset = 0;
			this._totalPages = 0;
			this._selectedRows = [];
			
			this._tbodyEvents();
			
			this.uiDataGridTables = this.uiDataGridChilds = null
		}
		,_init: function() {
			(this.options.autoRender && this.render());
		}
		,_setOption: function(option,value) {
			$.Widget.prototype._setOption.apply(this,arguments);
		}
		,_getMarkup: function() {
			var _div = document.createElement('div')
				,markup = '';
			
			_div.className = 'ui-datagrid-container ui-widget'+((this.options.containerBorder) ? ' ui-widget-content ui-corner-all' : '');
			
			if (this.options.title != '') {
				markup += '<div class="ui-widget-header ui-datagrid-title ui-corner-all">'
						+this.options.title
					+'</div>'
				+'<div>'	
			}
			
			// markup
			markup += '<div class="'+this.options.classThead+' ui-datagrid-header ">'
					+'<table cellspacing="0" cellpadding="0">'
						+'<tr>'
							+'<td>'
								+'<table class="ui-datagrid">'
									+'<thead>'
										+'<tr></tr>'
									+'</thead>'
								+'</table>'
							+'</td>'
							+'<td style="width:16px"></td>'
						+'</tr>'
					+'</table>'
				+'</div>'
				+'<div class="ui-datagrid-body">'
					+'<table class="ui-datagrid">'
						+'<thead>'
							+'<tr></tr>'
						+'</thead>'
						+'<tbody></tbody>'
					+'</table>'
				+'</div>';
			
			if (this.options.pagination || $.isArray(this.options.toolBarButtons)) {
				markup += '<div class="ui-widget ui-state-default ui-corner-all ui-datagrid-tools">'
					+'<table class="ui-datagrid">'
						+'<tbody>'
							+'<tr>'
								+'<td>&nbsp;</td>';
			
				if (this.options.pagination) {
					markup += '<td><span></span></td>';
				}
			
				markup += '</tr></tbody></table></div>';
			}
			
			if (this.options.title != '') {
				markup += '</div>'
			}
			
			markup += '</div>';
			
			_div.innerHTML = markup;
			markup = null;
			
			return _div
		}
		,_createToolButtons: function() {
			
			for(var btns = [],t = ['first','prev','next','end'],b,c,k = 0;c=t[k++];) {
				b = document.createElement('button');
				b.name = 'data-grid-button-'+c;
				b.innerHTML = c;
				
				$(b).button({
					icons: {
						primary: 'ui-icon-seek-'+c
					}
					,text:false
				});
				btns[btns.length] = b
				
			}
			
			$(btns).appendTo($(this.uiDataGridTfoot[0].rows[0].cells).eq(-1)[0]);
			btns = t = b = c = null;
			
			return this
		}
		,_disableToolButtons: function() {
			$(this.uiDataGridTfoot[0].rows[0].cells).eq(-1)
				.children(':button')
				.removeClass('ui-state-hover ui-state-focus')
				.button('disable');
			
			return this
		}
		,_createColumns: function() {
		
			for(var cls = 'ui-widget '+this.options.classThead,aux,row = [],_th,i=0,_w=0;_th = this.options.mapper[i++];) {
				aux = document.createElement('th');
				aux.className = cls;
				
				// helper
				var html = undefined !== _th.alias ? _th.alias : _th.name
					,$helper = $(document.createElement('div')).addClass('ui-widget ui-state-default').css({overflow:'scroll',position:'absolute',left:0}).html(html).appendTo(document.body);
					
				$(aux).attr('role','gridcell')[0].innerHTML = html;
				
				// css
				if ( $.isPlainObject(_th.css) ) {
					$(aux).css(_th.css);
				}
				
				// ajuste do width
				_w = $(aux).width();
				aux.style.width = (Math.max(_w,$helper[0].scrollWidth))+'px';
				
				document.body.removeChild($helper[0]);
				$helper = null;
				
				row[row.length] = aux
			}
			
			$(row).last().width('auto')
			
			if (this.options.rowNumber) {
				aux = document.createElement('th');
				aux.className = this.options.classThead+' ui-datagrid-cell-rownumber';
				aux.innerHTML = '<div></div>'
				row.splice(0,0,aux)
			}
			
			// last cell tbody
			$([this.uiDataGridThead[0].rows[0],this.uiDataGridTheadBody[0].rows[0]]).append(row);
			
			row = aux = _th = null;
		}
		,_createRows: function(json) {
			var theadThs = this.getThead()[0].rows[0].cells;
		
			this.uiDataGridTbody.empty();
			this.uiDataGridScroll.scrollTop(0);
			
			for(var cls = 'ui-widget ui-widget-content',row,cell,item,i=0,j=0;item = json.rows[i++];) {
				row = document.createElement('tr');

				if (this.options.rowNumber) {
					cell = document.createElement('td');
					cell.className = this.options.classThead+' ui-datagrid-cell-rownumber';
					cell.innerHTML = '<div>'+(parseInt(this._offset) + i)+'</div>';
					row.appendChild(cell)
				}
				
				while (_td = this.options.mapper[j++]) {
					cell = document.createElement('td');
					cell.className = cls;
					
					// append
					row.appendChild(cell);
					
					// default
					cell.style.cssText = 'text-align:'+theadThs[cell.cellIndex].style.textAlign;
					
					// apply the css text-align
					if ( (undefined != _td.css) && (_td.css.hasOwnProperty('textAlign')) ) {
						$(cell).css('textAlign',_td.css.textAlign);
					}
					
					// width normalize
					cell.style.width = $(theadThs[cell.cellIndex]).width()+'px';
					
					// cell content
					cell.innerHTML = $.isFunction(_td.map)
						? _td.map(item[_td.name]) // aplica uma função no valor do campo
						: ($.isFunction(window[_td.globalFunction]))
							? window[_td.globalFunction](item[_td.name])
							: item[_td.name]; // mapper.row.fieldName
				}
				
				row.appendChild(document.createElement('th'));
				this.uiDataGridTbody[0].appendChild(row);
				
				// reset
				j = 0;
				row = cell = null
			}
			
			row = cell = theadThs = null;
			i = y = 0
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
					self.options.jsonStore.params.limit = self.options.limit;
					self.options.jsonStore.params.offset = self._offset
				}
				
				// disable button toolbar
				if (self.options.pagination) {
					self._disableToolButtons();
				}
				
				$.ajax({
					type: self.options.ajaxMethod.toLowerCase()
					,url: self.options.jsonStore.url.replace(/\?.*/,'')
					,data: self.options.jsonStore.params
					,dataType: 'json'
					,success: function(json) {

						if (undefined != json.error) {
							alert(json.error);
							return;
						}
						
						if (undefined === json.numRows || json.numRows == 0) {
							return false;
						}
						
						if (self.options.pagination) {
						
							self._totalPages = Math.ceil(json.numRows / self.options.limit);
							var currentPage = (self._offset == 0 ) ? 1 : ((self._offset / self.options.limit) + 1)
								,infoPages = currentPage+' de '+self._totalPages+' ('+json.numRows+')';
							
							// ultimo td
							$.each($(self.uiDataGridTfoot[0].rows[0].cells).eq(-1).children(),function(){
								if (/span/i.test(this.tagName)) {
									this.innerHTML = infoPages
								} else {
									(/data-grid-button-(first|prev)/.test(this.name))
										? (self._offset > 0 && this.disabled && $(this).button('enable'))
										: (self._totalPages > currentPage && this.disabled && $(this).button('enable'))
								}
							})
						}
						
						self._createRows(json)
					}
				})
			} else {
				self._createRows(self.options.jsonStore.data)
			}
		}
		,render: function() {
			var self = this;
			
			if (self.element.children().eq(0).hasClass('ui-data-grid-container')) {
				self.resetOffset();
				self.load()
			} else {
			
				if ($.isArray(self.options.toolBarButtons)) {
					$.each(self.options.toolBarButtons,function(i,b){
						$(document.createElement('button')).html(b.label).each(function(){
							if ($.isFunction(b.fn)) {
								$(this).click(function(e){
									b.fn.call(this,self.element);
									$(this).blur()
								})
							}
							
							$(this).button({icons:{primary:(undefined === b.icon) ? null : 'ui-icon-'+b.icon}});
							
							self.uiDataGridTfoot[0].rows[0].cells[0].appendChild(this);
						})
					})
				}
				
				// create ui-datagrid
				self.uiDataGrid.appendTo(self.element);
				
				// create columns
				self._createColumns();
				
				// dimensions
				var h = self.uiDataGridThead.outerHeight();
				
				// grid scorll width
				self.uiDataGridTheadBody
					.parent()
					.css('marginTop',-h);
				h = null;
				
				if (self.options.pagination) {
				
					// create and disable buttons 
					self._createToolButtons()._disableToolButtons();
					
					// prev next event
					$(self.uiDataGridTfoot[0].rows[0].cells).eq(-1).delegate('button','click',function(){
						if (!this.disabled) {
							self[this.name.replace(/data-grid-button-/,'')+'Page']();
							self._selectedRows = [];
							self.load()
						}
					});
				}
				
				self.resize();

				// load
				(self.options.autoLoad && self.load());
				
				// onComplete callback
				($.isFunction(self.options.onComplete) && self.options.onComplete.call(self.uiDataGridTbody[0]));
			}
			
			return this
		}
		,nextPage: function() {
			this._offset += this.options.limit
		}
		,prevPage: function() {
			this._offset -= this.options.limit
		}
		,endPage: function() {
			this._offset = (this._totalPages * this.options.limit) - this.options.limit
		}
		,firstPage: function() {
			this._offset = 0
		}
		,_tbodyEvents: function() {
			var self = this,ev = [];
			
			if (this.options.rowHover) {
				ev[ev.length] = 'mouseover';
				ev[ev.length] = 'mouseout'
			}
			
			if (this.options.rowClick) {
				ev[ev.length] = 'click'
			}
			
			if (ev.length > 0) {
			
				self.uiDataGridTbody.undelegate().delegate('tr',ev.join(' '),function(event){
					('click' === event.type)
						? self._clickRow(this,event)
						: $(this)[(('mouseover' ===  event.type) ? 'addClass' : 'removeClass')]('ui-state-hover')
				})
			}
			
			ev = null
		}
		,_clickRow: function(tr,event) {
			var self = this
				$tr = $(tr)
				cls = $tr.hasClass('ui-state-highlight');
			if (cls) {
				$tr.removeClass('ui-state-highlight');
				
				for(var i=0,row;row=self._selectedRows[i++];) {
					if (tr === row) {
						self._selectedRows.splice(--i,1);
						break
					}
				}
				
			} else {
				$tr.addClass('ui-state-highlight');
				self._selectedRows[self._selectedRows.length] = tr;
				($.isFunction(self.options.onSelectRow) && self.options.onSelectRow.call(tr,[self.element[0]]))
			}
			
			$tr = cls = null;
		}
		,resize: function() {
			var self = this;
			// fit to parent
			if (self.options.fit) {
				(function(){
					var h = self.uiDataGrid.outerHeight() - self.element.height();
					this.style.height = $(this).height() - h +'px';
				}).call(self.uiDataGridScroll[0]);
			}
			
			return this
		}
		,getSelectedRows: function() {
			return this._selectedRows
		}
		,clearSelectedRows: function() {
			
			for(var i=0,row;row=this._selectedRows[i++];) {
				$(row).removeClass('ui-state-highlight');
			}
			
			this._selectedRows = [];
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
})(jQuery);
