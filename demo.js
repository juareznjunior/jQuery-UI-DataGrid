(function($,doc) {

	// jquery.ui.dialog options extends
	$.extend($.ui.dialog.prototype.options,{
		resizable: false
		,draggable: false
		,modal: true
		,autoOpen: false
	});
	
	// injectJs
	var injectJs = function( oldObj,callback) {
		var script = doc.createElement( 'script' )
			,src
			,isFileReady = function( readyState ) {	
				return ( ! readyState || readyState == 'loaded' || readyState == 'complete' );
			};

		script.src = 'tests/'+oldObj+'?ts='+(new Date()).getTime();

		script.onreadystatechange = script.onload = function () {

		  if ( isFileReady( script.readyState ) ) {
			
			script.onload = script.onreadystatechange = null;
			
			var c = callback();
			
			if (!c.parent().hasClass('ui-dialog')) {
			
				c.before($('<button>View source</button>').button({
					icons: { primary: 'ui-icon-newwin'}
				}).addClass('button-view-source'));
			}
			
			$.data(c[0],'src','tests/highlight/'+oldObj);
			c = null;

			$(doc.body).find('script').last().remove();
		  }
		};

		doc.body.appendChild(script);
	}
	,$dlgSource
	,viewSource = function(dg) {
		
		if (dg === $.data($dlgSource[0],'active')) {
			$dlgSource.dialog('open');
			return;
		}
		
		$dlgSource
			.text('Loading...')
			.dialog('option','title','#'+dg.id+' datagrid source')
			.dialog('open');
		
		$.get($.data(dg,'src'),function(data){
			$dlgSource
				.data('active',dg)
				.html('<div class="syntax-container syntax-theme-base">'+data+'</div>')
				
		});
	}

	// create datagrid using jquery.ui.dialog and jquery.ui.tabs
	// @arg jQuery button
	// @arg jQuery div
	,plugins = {
		datagrid7: function(b,d) {
			d.datagrid(dataGridJSON).dialog({
				width: 600
				,title: ' Loading...'
				,autoOpen: true
				,open: function() {
					setTimeout(function(){
						d
							.dialog('option','title',' Example 7 - Using jQuery UI Dialog')
							.datagrid('load')
					},1000)
				}
				,buttons: {
					'View Source': function() {
						viewSource(d[0]);
					}
				}
			});

			b.off('click.demo').on('click.demo',function(){
				d.dialog('open');
			}).button('option','label','Show Dialog').button('enable');
		}
		,datagrid8: function(b,d) {

			d
			.data('dataGridJSON',dataGridJSON)
			.html('<ul><li><a href="#tabs-1">Grid 1</a></li><li><a href="#tabs-2">Grid 2</a></li><li><a href="#tabs-3">Grid 3</a></li></ul><div id="tabs-1"><p>Tab 1 content</p></div><div id="tabs-2"><p>Tab 2 content</p></div><div id="tabs-3"><p>Tab 3 content</p></div>')
			.tabs({
				show: function(event,ui) {
					if ( undefined === $.data(ui.panel,'tabs-load') ) {
						var dataGridJSON = $.data(this,'dataGridJSON');
						dataGridJSON.title = 'DataGrid '+ui.tab.innerHTML
						$(ui.panel).empty().datagrid(dataGridJSON);
						$.data(ui.panel,'tabs-load',true);
					}
				}
			})
		}
		,datagrid9: function(b,d) {

			var $full = $('#full');

			$(document.body).addClass('overflow-hidden');
			$(window).scrollTop(0);

			if ( undefined === b ) {
				$full.show();
				return;
			}

			$full
				.data('isload',true)
				.show()
				.datagrid(dataGridJSON);

			b.off('click.demo').on('click.demo',function(){
				plugins.datagrid9();
			}).button('option','label','Show DataGrid').button('enable');
		}
	};

	// jquery.ui.button
	// click.demo event (load JSON datagrid)
    $(doc.getElementsByTagName('button')).button({
		icons: {
			primary: 'ui-icon-arrowrefresh-1-e'
		}
	}).on('click.demo',function(e){

		e.preventDefault();
		
		injectJs($(this).data('source'),(function(self,dg){
			return function() {
				
				dg.empty();
				
				if ( $.isFunction(plugins[dg[0].id]) ) {
					plugins[dg[0].id].call([],self,dg);
				} else {
					
					self.hide();
					
					dg.datagrid(dataGridJSON);
				}
				
				return dg;
			}
		}($(this).button('disable'),$(this).next().text('Loading...'))));
	});
	
	// load basic datagrid
	injectJs('datagrid.html',function(){
		return $('#datagrid')
			.datagrid($.extend({},dataGridJSON,{
				onComplete: function(){
					$('#container').removeClass('xhidden');
				}
			}));
	});
	
	//
	$(doc.body).on('click','button.button-view-source',function(){
		viewSource($(this).next()[0]);
	})
	
	// source
	$dlgSource = $('#dialog-source').dialog({
		width: 800
		,height: 600
	});
	
}(jQuery,document));
