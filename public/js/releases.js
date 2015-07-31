$(document.body).on('click', '#tabAll', function(){
	$('.tab-pane').each(function(i,t){
		$('#releaseTabs li').removeClass('active'); 
  		$(this).addClass('active');  
  	});
});

$('#myModal').on('hidden.bs.modal', function (e) {
  angular.element(document.getElementById('id_test')).scope().saveConfig();
})