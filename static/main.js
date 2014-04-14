requirejs.config({
  paths: {
    'domready': '/bower_components/requirejs-domready/domReady',
    'react' : '/bower_components/react/react-with-addons',
    'react-async' : '/bower_components/react-async/react-async',
    'react-router-component' : '/bower_components/react-router-component/react-router-component',
    'socket.io' : '/socket.io/socket.io'
  }
});

require([
  'domready',
  'react',
  './router'
], function(domready, React, Router, undefined) {

  domready(function() {
    React.renderComponent(Router({
      path: window.location.pathname
    }), document.body);
  });

});