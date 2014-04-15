requirejs.config({
  paths: {
    'domready': '/static/lib/domready',
    'react' : '/static/lib/react/react-with-addons',
    'react-async' : '/static/lib/react/react-async',
    'moment' : '/static/lib/moment',
    'react-router-component' : '/static/lib/react/react-router-component',
    'socket.io' : '/socket.io/socket.io'
  }
});

require([
  'domready',
  'react',
  './router'
], function(domready, React, AppRouter, undefined) {

  domready(function() {
    React.renderComponent(AppRouter({
      path: window.location.pathname
    }), document.body);
  });

});
