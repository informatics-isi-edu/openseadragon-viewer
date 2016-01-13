// sidebar javascript
jQuery(function() {

  // activate the tab boxes
  // .. for control
  jQuery(".controlTab").bind('mouseenter', function() {
    jQuery('.controlTab').removeClass('selected');
    jQuery(this).addClass("selected");
  });
  
});

// control sidebar js
function sidebar_control_slideOut() {

  if (jQuery('#control').hasClass('menuDisabled')) {
    // if this menu is disabled, don't slide
    return;
  }

  // make sure it is displaying
  var ctrlElm = document.getElementById('control');
  ctrlElm.style.display = '';
    
  jQuery('#controlMenu', jQuery('.navigationLi')).stop().animate({
    'marginLeft': '-2px'
  }, 200);
}

function sidebar_control_slideIn() {

  if (jQuery('#control').hasClass('menuDisabled')) {
    // if this menu is disabled, don't slide
    return;
  }

  // make sure it is displaying
  var ctrlElm = document.getElementById('control');
  ctrlElm.style.display = '';
    
  jQuery('#controlMenu', jQuery('.navigationLi')).stop().animate({
    'marginLeft': '-300px'
  }, 200);
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
