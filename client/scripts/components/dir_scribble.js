.directive('writeScribble', function(){
  return {
    restrict: 'A',
    scope:false,
    link: function(scope, element){
        
      // canvas reset
      function reset(){
       deltas=[];
       scope.message.scribble='';
       element[0].width = element[0].width; 
      }
     
      var deltas = [];

      var ctx = element[0].getContext('2d');
      
      // variable that decides if something should be drawn on mousemove
      var drawing = false;
      
      // the last coordinates before the current move
      var lastX;
      var lastY;
      
      element.bind('mousedown', function(event){
        if(event.offsetX!==undefined){
          lastX = event.offsetX;
          lastY = event.offsetY;
        } else {
          lastX = event.layerX - event.currentTarget.offsetLeft;
          lastY = event.layerY - event.currentTarget.offsetTop;
        }

        scope.message.initX=lastX;
        scope.message.initY=lastY;
        reset();
        // begins new line
        ctx.beginPath();
        
        drawing = true;
      });

      element.bind('mousemove', function(event){
        if(drawing){
          // get current mouse position
          if(event.offsetX!==undefined){
            currentX = event.offsetX;
            currentY = event.offsetY;
          } else {
            currentX = event.layerX - event.currentTarget.offsetLeft;
            currentY = event.layerY - event.currentTarget.offsetTop;
          }
          
          draw(lastX, lastY, currentX, currentY);
          deltas.push(currentX-lastX,currentY-lastY);
          // set current coordinates to last one
          lastX = currentX;
          lastY = currentY;
        }
        
      });
      element.bind('mouseup', function(event){
        // stop drawing
        drawing = false;
          scope.message.scribble=deltas.join(',');
      });
      
      function draw(lX, lY, cX, cY){
        // line from
        ctx.moveTo(lX,lY);
        // to
        ctx.lineTo(cX,cY);
        // color
        ctx.strokeStyle = '#000';
        // draw it
        ctx.stroke();
      }
    }
  };
})