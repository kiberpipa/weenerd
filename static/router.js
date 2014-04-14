if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([
  'react',
  'react-router-component',
  './app',
  './login'
], function(React, Router, App, Login, undefined) {

  var AppRouter = React.createClass({

    displayName: 'AppRouter',

    render: function() {
      return (
        React.DOM.div({ className: 'container' },
          Router.Locations({ path: this.props.path }, [
            Router.Location({ path: '/', handler: App }),
            Router.Location({ path: '/login', handler: Login })
          ])
        )
      );
    }
  });

  return AppRouter;

});
