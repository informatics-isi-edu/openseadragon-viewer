
// svg layers sidebar js
function sidebar_layers_slideOut() {

  if (jQuery('#layers').hasClass('menuDisabled')) {
    return;
  }

  var panelptr=$('#layers');
  var sidebarptr=$('#sidebar');
  sidebarptr.css("display","");
  panelptr.css("display","");
  panelptr.removeClass('fade-out').addClass('fade-in');

}

function sidebar_layers_slideIn() {

  if (jQuery('#layers').hasClass('menuDisabled')) {
    return;
  }

  var panelptr=$('#layers');
  panelptr.removeClass('fade-in').addClass('fade-out');
  panelptr.css("display","none");

}

// channel sidebar js
function sidebar_channels_slideOut() {

  if (jQuery('#channels').hasClass('menuDisabled')) {
    // if this menu is disabled, don't slide
    return;
  }

  var panelptr=$('#channels');
  var sidebarptr=$('#sidebar');
  sidebarptr.css("display","");
  panelptr.css("display","");
  panelptr.removeClass('fade-out').addClass('fade-in');
}

function sidebar_channels_slideIn() {

  if (jQuery('#channels').hasClass('menuDisabled')) {
    // if this menu is disabled, don't slide
    return;
  }

  var panelptr=$('#channels');
  panelptr.removeClass('fade-in').addClass('fade-out');
  panelptr.css("display","none");
}

// annotorious sidebar js
function sidebar_anno_slideOut() {

  if (jQuery('#annotations').hasClass('menuDisabled')) {
    // if this menu is disabled, don't slide
    return;
  }

  var panelptr=$('#annotations');
  var sidebarptr=$('#sidebar');
  sidebarptr.css("display","");
  panelptr.css("display","");
  panelptr.removeClass('fade-out').addClass('fade-in');
}

function sidebar_anno_slideIn() {

  if (jQuery('#annotations').hasClass('menuDisabled')) {
    // if this menu is disabled, don't slide
    return;
  }

  var panelptr=$('#annotations');
  panelptr.removeClass('fade-in').addClass('fade-out');
  panelptr.css("display","none");
}
