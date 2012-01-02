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

		script.src = 'tests/'+oldObj;

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
	}).on('click',function(self){
	
		injectJs($(this).data('source'),(function(self){
			return function() {
			
				var dg = self.next().datagrid(dataGridJSON)
				
				if ('example7' === dg[0].id) {
				
					dg.dialog({
						width: 600
						,title: ' Example 7 - Using jQuery UI Dialog'
					});
					
					self.off('click').on('click',function(){
						dg.dialog('open')
					}).button('option','label','Show Dialog');
					
				} else {
					self.button('destroy').remove();
				}
			}
		}($(this))));
	});
	
	injectJs('datagrid.html',function(self){
		$('#example1').datagrid(dataGridJSON)
	});
	
}(jQuery));
