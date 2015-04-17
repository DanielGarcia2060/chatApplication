.directive('triggerMenu',function(argument) {
	return{
		restrict:'C',
		link:function (scope, elem) {
			var removing = undefined;

			elem.on('click',function(){
				
				if(elem.hasClass('open')){
					elem.removeClass('open');
				}
				else{
					scope.$digest();
					elem.addClass('open');
				}

			});
			
			elem.on('mouseleave',function () {
				removing=setTimeout(function () {
					elem.removeClass('open');
					removing = undefined;
				},800);
			});

			elem.on('mouseenter',function () {
				if(removing){
					clearTimeout(removing);
					removing=undefined;
				}
			})

		}
	}
})