// sidebar javascript
jQuery(function() {

  // activate the tab boxes
  // .. for channels filtering
/*
  jQuery(".controlTab").bind('mouseenter', function() {
    jQuery('.controlTab').removeClass('selected');
    jQuery(this).addClass("selected");
  });
*/
  
});

// channel sidebar js
function sidebar_channels_slideOut() {

  if (jQuery('#channels').hasClass('menuDisabled')) {
    // if this menu is disabled, don't slide
    return;
  }

  // make sure it is displaying
  var ctrlElm = document.getElementById('sidebar');
//  ctrlElm.style.opacity = 0;
  ctrlElm.style.display = '';
    
//  var iPtr=$('#sidebar');
//  iPtr.removeClass('fade-out').addClass('fade-in');

  jQuery('.navigationLi').stop().animate({'marginLeft': '-2px' }, 400);

/*
  jQuery('#channelsMenu', jQuery('.navigationLi')).stop().animate({
    'marginLeft': '-2px'
  }, 400);
*/

}

function sidebar_channels_slideIn() {

  if (jQuery('#channels').hasClass('menuDisabled')) {
    // if this menu is disabled, don't slide
    return;
  }

  var ctrlElm = document.getElementById('sidebar');
  ctrlElm.style.display = '';
    
// var iPtr=$('#sidebar');
//  iPtr.removeClass('fade-in').addClass('fade-out');
//  ctrlElm.style.display = 'none';
//  ctrlElm.style.opacity = 0;

  jQuery('.navigationLi').stop().animate({ 'marginLeft': '-450px' }, 400);

/*
  jQuery('#channelsMenu', jQuery('.navigationLi')).stop().animate({
    'marginLeft': '-300px'
  }, 400);
*/
}

// annotorious sidebar js
function sidebar_anno_slideOut() {

  if (jQuery('#annotations').hasClass('menuDisabled')) {
    // if this menu is disabled, don't slide
    return;
  }

  // make sure it is displaying
  var annoElm = document.getElementById('annotations');
  annoElm.style.display = '';
    
  jQuery('#annoMenu', jQuery('.navigationLi')).stop().animate({
    'marginLeft': '-2px'
  }, 200);
}

function sidebar_anno_slideIn() {

  if (jQuery('#annotations').hasClass('menuDisabled')) {
    // if this menu is disabled, don't slide
    return;
  }

  // make sure it is displaying
  var annoElm = document.getElementById('annotations');
  annoElm.style.display = '';
    
  jQuery('#annoMenu',jQuery('.navigationLi')).stop().animate({
    'marginLeft': '-300px'
  }, 200);
}
