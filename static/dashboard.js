if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([
  'react'
], function(React, undefined) {

  var Dashboard = React.createClass({

    displayName: 'Dashboard',

    render: function() {
      var self = this;
      return (
        React.DOM.ul({ key: 'buffers'},
          Object.keys(self.props.buffers).map(function(uid) {
            var buffer = self.props.buffers[uid];
            return (
              React.DOM.li({ key: uid },
                React.DOM.a({
                  href: "#",
                  onClick: function(e) {
                    self.props.openBuffer(uid);
                    e.preventDefault();
                  }
                }, buffer.info.full_name)
              )
            );
          })
        )
      );
    }

  });

  return Dashboard;

});
