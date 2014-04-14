if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([
  'react'
], function(React, undefined) {

  var Buffer = React.createClass({

    displayName: 'Buffer',

    render: function() {
      var buffer = this.props.buffer;
      return (
        React.DOM.div({}, [
          React.DOM.h3({ key: 'title' }, buffer.info.short_name),
          React.DOM.div({ key: 'content' }, JSON.stringify(buffer.messages))
        ])
      );
    }

  });

  return Buffer;

});
