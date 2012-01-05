(function($,doc) {

	// jquery.ui.dialog options extends
	$.extend($.ui.dialog.prototype.options,{
		resizable: false
		,draggable: false
		,modal: true
		,autoOpen: false
	});
	
	// injectJs
	var isFileReady = function( readyState ) {	
		return ( ! readyState || readyState == 'loaded' || readyState == 'complete' );
	}
	,injectJs = function( oldObj,callback) {
		var script = doc.createElement( 'script' ),src;

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
		
		$dlgSource.dialog('option','title','#'+dg.id+' datagrid source');
		
		$.get($.data(dg,'src'),function(data){
			$dlgSource
				.data('active',dg)
				.html('<div class="syntax-container syntax-theme-base">'+data+'</div>')
				.dialog('open');
		});
	};

	// jquery.ui.button
	// click.demo event (load JSON datagrid)
    $(doc.getElementsByTagName('button')).button({
		icons: {
			primary: 'ui-icon-arrowrefresh-1-e'
		}
	}).on('click.demo',function(){
		
		injectJs($(this).data('source'),(function(self,dg){
			return function() {
				
				dg.empty();
				
				if ('datagrid7' === dg[0].id) {
				
					dg.datagrid(dataGridJSON).dialog({
						width: 600
						,title: ' Example 7 - Using jQuery UI Dialog'
						,autoOpen: true
						,buttons: {
							'View Source': function() {
								viewSource(dg[0]);
							}
						}
					});
					
					self.off('click.demo').on('click.demo',function(){
						dg.dialog('open');
					}).button('option','label','Show Dialog');
					
				} else {
					
					self.button('destroy').remove();
					
					dg.datagrid(dataGridJSON);
				}
				
				return dg;
			}
		}($(this),$(this).next().text('Loading...'))));
	});
	
	// load basic datagrid
	injectJs('datagrid.html',function(){
		return $('#datagrid').datagrid(dataGridJSON);
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
