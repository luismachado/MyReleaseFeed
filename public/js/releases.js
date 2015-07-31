$(document.body).on('click', '#tabAll', function(){
	$('.tab-pane').each(function(i,t){
		$('#releaseTabs li').removeClass('active'); 
  		$(this).addClass('active');  
  	});
});

$('#myModal').on('hidden.bs.modal', function (e) {
  angular.element(document.getElementById('id_test')).scope().saveConfig();
});

// Avoid page jumping down when clicking on a tab
$('.nav-pills li a').click( function(e) {
	e.preventDefault();
});