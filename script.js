// M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.5,11.9,16,21.2 c6.1-9.3,16-12.1,16-21.2C32,3.8,28.2,0,23.6,0z
// M0 0 L0 200 L200 200 L200 0 Z
// M 25, 50 a 25,25 0 1,1 50,0 a 25,25 0 1,1 -50,0
let	lastSelectedPicture = null;
let isInsertingCropRectangle = false;
canvas = new fabric.Canvas('c', {
  selection: true,
  preserveObjectStacking: true,
  height: 700,
  width: 800
});

let crop_rect, isDown, origX, origY, mask, target;
let done = false;

//let src = "img/graph_paper_540.png";
let src = "img/girl1280.jpg";
fabric.Image.fromURL(src, function(img) {
  img.selectable = true;
  img.id = 'target';
  img.top = 30;
  img.left = 30;
  canvas.add(img);
});


canvas.on('object:added', function(e) {
  target = null;
  mask = null;
  canvas.forEachObject(function(obj) {
    //alert(obj.get('id'));
    let id = obj.get('id');
    if (id === 'target') {
      target = obj;
      canvas.setActiveObject(obj);
    }
    if (id === 'mask') {
      //alert(done);
      //alert('mask');
      mask = obj;
    }
  });
});

canvas.on('object:modified', function(e) {
  e.target.setCoords();
  canvas.renderAll();
});

//////////////////////////////////////////////////////////
// MASK
//////////////////////////////////////////////////////////
document.getElementById("mask").addEventListener("click", function() {
  isInsertingCropRectangle = true;
  canvas.discardActiveObject();
  lastSelectedPicture.selectable = false;
  lastSelectedPicture.setCoords();
  lastSelectedPicture.dirty = true;
  canvas.renderAll();
  canvas.discardActiveObject();
  isInsertingCropRectangle = true;
});

//////////////////////////////////////////////////////////
// CROP
//////////////////////////////////////////////////////////
document.getElementById("crop").addEventListener("click", function() {
  if (target !== null && mask !== null) {
    target.setCoords();
    // Re-scale mask
    mask = rescaleMask(target, mask);
    mask.setCoords();

    // Do the crop
    target.clipPath = mask;

    target.dirty=true;
    canvas.setActiveObject(target);
    canvas.bringToFront(target);
    target.selectable = true;
    canvas.remove(mask);
    canvas.renderAll();
    console.log(target);
  }
});

// un crop
document.getElementById("uncrop").addEventListener("click", function(){
  let activeObject  = canvas.getActiveObject();
  if(activeObject && activeObject.clipPath){
    delete activeObject.clipPath;
    canvas.renderAll();
  }
})

//////////////////////////////////////////////////////////
// RE-SCALE MASK FOR CROPPING
// P R O B L E M  I N  T H I S  F U N C T I O N
//////////////////////////////////////////////////////////
function rescaleMask(target, mask){
  //mask.scaleX = 1;
  //mask.scaleY = 1;

  mask.scaleX/=target.scaleX;
  mask.scaleY/=target.scaleY;

  let targetCenterX = target.width * target.scaleX / 2;
  let targetCenterY = target.height * target.scaleY / 2;

  let maskOverlapX = mask.left  - target.left;
  let maskOverlapY = mask.top - target.top;
  let centerBasedX = maskOverlapX - targetCenterX;
  let centerBasedY = maskOverlapY - targetCenterY;

  if( maskOverlapX >= targetCenterX){
    centerBasedX = (maskOverlapX - targetCenterX)/target.scaleX;
  }
  else{

    centerBasedX = (-(targetCenterX) + maskOverlapX)/target.scaleX;
  }

  if( maskOverlapY >= targetCenterY){
    centerBasedY = (maskOverlapY - targetCenterY)/target.scaleY;
  }
  else{
    centerBasedY = (-(targetCenterY) + maskOverlapY)/target.scaleY;
  }




  console.log('targetleft = '+target.left);
  console.log('targettop = '+target.top);
  console.log('targetCenterX = '+targetCenterX);
  console.log('targetCenterY = '+targetCenterY);
  console.log('maskleft = '+mask.left);
  console.log('masktop = '+mask.top);
  console.log('maskOverlapX = '+maskOverlapX);
  console.log('maskOverlapY = '+maskOverlapY);
  console.log('centerBasedX = '+centerBasedX);
  console.log('centerBasedY = '+centerBasedY);
  console.log('maskScaleX = '+mask.scaleX);
  console.log('maskScaleY = '+mask.scaleY);

  mask.left = centerBasedX;
  mask.top = centerBasedY;
  mask.originX = 'left';
  mask.originY = 'top';

  mask.setCoords();
  mask.dirty=true;
  canvas.renderAll();



  //let newMask = mask;
  return(mask);
}

canvas.on('mouse:down', function(o) {
  if( isInsertingCropRectangle == true ){
    console.log('mouse down done = '+done);
    if (done) {
      canvas.renderAll();
      return;
    }
    isDown = true;
    let pointer = canvas.getPointer(o.e);
    origX = pointer.x;
    origY = pointer.y;
    crop_rect = new fabric.Path('M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.5,11.9,16,21.2 c6.1-9.3,16-12.1,16-21.2C32,3.8,28.2,0,23.6,0z', {
      left: origX,
      top: origY,
      width: pointer.x - origX,
      height: pointer.y - origY,
      opacity: .3,
      transparentCorners: false,
      selectable: true,
      id: 'mask'
    });
    /*crop_rect = new fabric.Rect({
      left: origX,
      top: origY,
      width: pointer.x - origX,
      height: pointer.y - origY,
      opacity: .3,
      transparentCorners: false,
      selectable: true,
      id: 'mask'
    });*/
    canvas.setActiveObject(crop_rect);
    canvas.add(crop_rect);
    canvas.renderAll();
  }
  else{

  }
});

canvas.on('mouse:move', function(o) {
  if( isInsertingCropRectangle == true ){
    console.log('mouse move done = '+done);
    if (done) {
      canvas.renderAll();
      return;
    }
    if (!isDown) return;
    let pointer = canvas.getPointer(o.e);

    if (origX > pointer.x) {
      crop_rect.set({
        left: Math.abs(pointer.x)
      });
    }
    if (origY > pointer.y) {
      crop_rect.set({
        top: Math.abs(pointer.y)
      });
    }
    console.log(origX , origY , pointer.x , pointer.y);
    let oldWidth = crop_rect.width;
    let calcWidth = Math.abs(origX - pointer.x)
    let oldHeight = crop_rect.height;
    let calcHeight = Math.abs(origY - pointer.y)
    crop_rect.set({
      scaleX: (calcWidth-oldWidth)/oldWidth,
    });
    crop_rect.set({
      scaleY: (calcHeight-oldHeight)/oldHeight,
    });

    /*crop_rect.set({
      width: Math.abs(origX - pointer.x)
    });
    crop_rect.set({
      height: Math.abs(origY - pointer.y)
    });*/


    crop_rect.setCoords();
    canvas.renderAll();
  }
  else{

  }
});

canvas.on('mouse:up', function(o) {
  if( isInsertingCropRectangle == true ){
    console.log('mouse up done = '+done);
    if (done) {
      canvas.renderAll();
      return;
    }
    isDown = false;

    crop_rect.set({
      selectable: true
    });
    done = true;
  }
  else{

  }
});

canvas.on('selection:created', function(event) {
  console.log("canvas.on('selection:created'");
  selectionChanged(event);
});

canvas.on('selection:updated', function(event) {
  console.log("canvas.on('selection:updated'");
  selectionChanged(event);
});

function selectionChanged(event){
  console.log("selectionChanged");
  console.log("selectionChanged type = "+event.target.type);
  switch(event.target.type) {
    case 'textbox':
      break;
    case 'image':
      lastSelectedPicture = event.target;
      break;
    case 'rect':
      break;
    case 'group':
      break;
    default:
      break;
  }

}
