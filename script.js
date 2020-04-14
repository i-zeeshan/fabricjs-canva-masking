// M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.5,11.9,16,21.2 c6.1-9.3,16-12.1,16-21.2C32,3.8,28.2,0,23.6,0z
// M0 0 L0 200 L200 200 L200 0 Z
// M 25, 50 a 25,25 0 1,1 50,0 a 25,25 0 1,1 -50,0

let	lastSelectedPicture = null,maskOldCoords;
let isInsertingCropRectangle = false;
canvas = new fabric.Canvas('c', {
  selection: true,
  preserveObjectStacking: true,
  height:700,
  width: 1000
});
let crop_rect, isDown, origX, origY, mask, target;
let done = false;

//let src = "img/graph_paper_540.png";
//let src = "img/graph_paper_540.png";
let src = 'img/11.jpg';
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
  //isInsertingCropRectangle = true;
  maskOriginalScaleY = canvas.getActiveObject();
  if(target.type === 'image'){
    canvas.discardActiveObject();
    // adding mask object
    let maskTop,maskLeft,maskHeight,maskWidth;
    maskHeight = target.getScaledHeight()/2;
    maskWidth = target.getScaledWidth()/2;
    console.log(maskHeight,maskWidth);
    maskTop = (target.top+(target.getScaledHeight()/2))-(maskHeight/2);
    maskLeft = (target.left+(target.getScaledWidth()/2))-(maskWidth/2);
    crop_rect = new fabric.Path('M507.521,427.394L282.655,52.617c-12.074-20.122-41.237-20.122-53.311,0L4.479,427.394    c-12.433,20.72,2.493,47.08,26.655,47.08h449.732C505.029,474.474,519.955,448.114,507.521,427.394z', {
      left: maskLeft,
      top: maskTop,
      //width: maskWidth,
      //height: maskHeight,
      scaleX:9.121,
      scaleY:9.121,
      opacity: .3,
      transparentCorners: false,
      selectable: true,
      id: 'mask'
    });
    // scaling mask by with;
    let maskScaleX = maskWidth/crop_rect.width;
    let maskScaleY = maskWidth/crop_rect.height;
    crop_rect.set({scaleX:maskScaleX , scaleY:maskScaleY});
    canvas.add(crop_rect);
    canvas.setActiveObject(crop_rect);
    canvas.renderAll();

  }
});

//////////////////////////////////////////////////////////
// CROP
//////////////////////////////////////////////////////////
document.getElementById("crop").addEventListener("click", function() {
  if (target !== null && mask !== null) {
    target.setCoords();
    // Re-scale mask
    maskOldCoords = mask;
    let oldMaskTop = mask.top;
    let oldMaskLeft = mask.left;
    let oldMaskHeight = mask.getScaledHeight();
    let oldMaskWidth = mask.getScaledWidth();
    let oldMaskScaleX = mask.scaleX;
    let oldMaskScaleY = mask.scaleY;

    mask = rescaleMask(target, mask);
    mask.setCoords();
    // Do the crop
    target.clipPath = mask;
    //let ctx =
    target.dirty=true;
    canvas.setActiveObject(target);
    //canvas.bringToFront(target);
    let clippedURL = target.toDataURL({multiplier:2});
    console.log(clippedURL);
    let cropTop = (oldMaskTop - target.top);
    let cropLeft = (oldMaskLeft - target.left);
    //let cropTop =(mask.top + (target.getScaledHeight()/4  ))/4 ;
    //let cropLeft = (mask.left + (target.getScaledWidth()/4  ))/4;
    cropTop = cropTop+ (target.getScaledHeight()/2);
    cropLeft = cropLeft+ (target.getScaledWidth()/2);
    execImage(clippedURL, {
      width:mask.getScaledWidth(),
      height:mask.getScaledHeight(),
      top:cropTop,
      left:cropLeft,
      oldMaskTop,
      oldMaskLeft,
      oldMaskHeight,
      oldMaskWidth,
      oldMaskScaleX,
      oldMaskScaleY,
    });
    //target.selectable = true;
    target.clipPath = null;
    canvas.remove(mask);
    canvas.renderAll();
    console.log(target);
  }
});

function execImage(imgData,params){
  console.log(params);
  let img =  new Image();
  img.onload = function(){
    let imageCanvas = document.createElement('canvas');
    imageCanvas.width = img.width;
    imageCanvas.height = img.height;
    let imageContext = imageCanvas.getContext('2d');
    imageContext.drawImage(img , 0 ,0 , img.width , img.height);
    let finalImageCanvas = trimCanvas(imageCanvas);
    console.log(finalImageCanvas.toDataURL('image/png', 1.0));
    // calculate new scale
    let newScaleX = params.oldMaskHeight / finalImageCanvas.height;
    let newScaleY = params.oldMaskWidth / finalImageCanvas.width;

    // add image to canvas here to keep synced;
    let fabricImage = new fabric.Image.fromURL(finalImageCanvas.toDataURL('image/png', 1.0),function(oImg){
      oImg.set({
        top: params.oldMaskTop,
        left: params.oldMaskLeft,
        height: finalImageCanvas.height,
        width: finalImageCanvas.width,
        scaleX:newScaleX,
        scaleY:newScaleY,
        custom: {
          obj: target,
        }
      });
      canvas.remove(target);
      canvas.add(oImg);
      canvas.setActiveObject(oImg);
      canvas.requestRenderAll();
    });
  };
  img.src = imgData;
}
function trimCanvas(c) {
  let ctx = c.getContext('2d'),
      copy = document.createElement('canvas').getContext('2d'),
      pixels = ctx.getImageData(0, 0, c.width, c.height),
      l = pixels.data.length,
      i,
      bound = {
        top: null,
        left: null,
        right: null,
        bottom: null
      },
      x, y;

  // Iterate over every pixel to find the highest
  // and where it ends on every axis ()
  for (i = 0; i < l; i += 4) {
    if (pixels.data[i + 3] !== 0) {
      x = (i / 4) % c.width;
      y = ~~((i / 4) / c.width);

      if (bound.top === null) {
        bound.top = y;
      }

      if (bound.left === null) {
        bound.left = x;
      } else if (x < bound.left) {
        bound.left = x;
      }

      if (bound.right === null) {
        bound.right = x;
      } else if (bound.right < x) {
        bound.right = x;
      }

      if (bound.bottom === null) {
        bound.bottom = y;
      } else if (bound.bottom < y) {
        bound.bottom = y;
      }
    }
  }

  // Calculate the height and width of the content
  let trimHeight = bound.bottom - bound.top,
      trimWidth = bound.right - bound.left,
      trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

  copy.canvas.width = trimWidth;
  copy.canvas.height = trimHeight;
  copy.putImageData(trimmed, 0, 0);

  // Return trimmed canvas
  return copy.canvas;
}

// un crop
document.getElementById("uncrop").addEventListener("click", function(){
  let activeObject  = canvas.getActiveObject();
  if(activeObject.custom && activeObject.custom.obj){
    canvas.remove(activeObject);
    canvas.add(activeObject.custom.obj);
    canvas.requestRenderAll();
  }

});

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

canvas.on('selection:created', function(event) {
  console.log("canvas.on('selection:created'");
  selectionChanged(event);
});

canvas.on('selection:updated', function(event) {
  console.log("canvas.on('selection:updated'");
  selectionChanged(event);
});
canvas.on('object:moving', function(event){
  if(done && event.target.id == "mask"){
    console.log('is masking object');

  }
})

function selectionChanged(event){
  //console.log("selectionChanged");
  //console.log("selectionChanged type = "+event.target.type);
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
