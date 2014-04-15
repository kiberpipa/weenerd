if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([
  'react'
], function(React, undefined) {

  var Dashboard = React.createClass({

    displayName: 'Dashboard',

    render: function() {
      var self = this;

      return React.DOM.div({ key: 'buffers', className: "col-lg-2",style: {height: "100vh", "overflow-y": "auto"}},
               React.DOM.table({className: "table"}, React.DOM.tbody({},
                 Object.keys(self.props.buffers).map(function(uid) {
                   var buffer = self.props.buffers[uid];
                   return React.DOM.tr({ key: uid },
                            React.DOM.td({},
                              React.DOM.a({href: "#",
                                           onClick: function(e) {
                                             self.props.openBuffer(uid);
                                             e.preventDefault();
                                           }}, buffer.info.short_name)
                            ));
                 })
                 )
               )
             );
    }
  });

  return Dashboard;

});
