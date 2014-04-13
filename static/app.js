if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([
  'react',
  'react-router-component',
  './dashboard',
  './login'
], function(React, Router, Dashboard, Login, undefined) {

  var App = React.createClass({
    displayName: 'App',
    render: function() {
      return (
        Router.Locations({ path: this.props.path }, [
          Router.Location({ path: '/', handler: Dashboard }),
          Router.Location({ path: '/login', handler: Login })
        ])
      );
    }
  });

  return App;

});
