requirejs.config({
  paths: {
    'domready': '/bower_components/requirejs-domready/domReady',
    'react' : '/bower_components/react/react-with-addons',
    'react-async' : '/bower_components/react-async/react-async',
    'moment' : '/bower_components/moment/moment',
    'react-router-component' : '/bower_components/react-router-component/react-router-component',
    'socket.io' : '/socket.io/socket.io'
  }
});

require([
  'domready',
  'react',
  './router'
], function(domready, React, AppRouter, undefined) {

  domready(function() {


    var router = AppRouter({
      path: window.location.pathname
    });

    // TODO:
    //window.addEventListener('resize', function(e) {
    //  router.setState({ layout: calculate(window.innerWidth, window.innerHeight) });
    //});
    React.renderComponent(router, document.body);
  });

});
