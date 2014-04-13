if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([
  'react',
  'react-router-component',
  './chat',
  './login'
], function(React, Router, Chat, Login, undefined) {

  var App = React.createClass({

    displayName: 'App',

    render: function() {
      return (
        React.DOM.div({ className: 'container' },
          Router.Locations({ path: this.props.path }, [
            Router.Location({ path: '/', handler: Chat}),
            Router.Location({ path: '/login', handler: Login })
          ])
        )
      );
    }
  });

  return App;

});
