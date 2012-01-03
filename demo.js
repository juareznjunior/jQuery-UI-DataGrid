(function($) {

	$.extend($.ui.dialog.prototype.options,{
		resizable: false
		,draggable: false
		,modal: true
	});
	
	var isFileReady = function( readyState ) {	
		return ( ! readyState || readyState == 'loaded' || readyState == 'complete' );
	};
	
	var injectJs = function( oldObj,callback) {
		var script = document.createElement( 'script' );

		script.src = 'tests/'+oldObj+'?ts='+(new Date()).getTime();

		script.onreadystatechange = script.onload = function () {

		  if ( isFileReady( script.readyState ) ) {
			script.onload = script.onreadystatechange = null;
			callback();
		  }
		};

		document.body.appendChild(script);
	}

    $(document.getElementsByTagName('button')).button({
		icons: {
			primary: 'ui-icon-arrowrefresh-1-e'
		}
	}).on('click.demo',function(){
		
		injectJs($(this).data('source'),(function(self,dg){
			return function() {
				
				dg.empty();
				
				if ('example7' === dg[0].id) {
				
					dg.datagrid(dataGridJSON).dialog({
						width: 600
						,title: ' Example 7 - Using jQuery UI Dialog'
					});
					
					self.off('click.demo').on('click.demo',function(){
						dg.dialog('open');
					}).button('option','label','Show Dialog');
					
				} else {
					self.button('destroy').remove();
					dg.datagrid(dataGridJSON);
				}
				
			}
		}($(this),$(this).next().text('Loading...'))));
	});
	
	injectJs('datagrid.html',function(self){
		$('#example1').datagrid(dataGridJSON)
	});
	
}(jQuery));
