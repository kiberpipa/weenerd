if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([
  'react'
], function(React, undefined) {

  var Dashboard = React.createClass({

    displayName: 'Dashboard',

    render: function() {
      var self = this;

      return React.DOM.div({key: 'buffers', className: 'dashboard', style: this.props.layout.dashboard || {}},
               React.DOM.table({className: "table"}, React.DOM.tbody({},
                 Object.keys(self.props.buffers).map(function(uid) {
                   var buffer = self.props.buffers[uid];
                   return React.DOM.tr({ key: uid },
                            React.DOM.td({},
                              React.DOM.a({href: "#",
                                           className: 'dashboard-buffer',
                                           onClick: function(e) {
                                             self.props.openBuffer(uid);
                                             e.preventDefault();
                                           }}, [React.DOM.span({}, buffer.info.short_name),
                                                React.DOM.a({onClick: function(e) {
                                                    self.props.closeBuffer(uid);
                                                }, href: '#',
                                                             className: 'dashboard-buffer-close'},
                                                             React.DOM.span({ className: "glyphicon glyphicon-remove close-buffer"}))])
                            ));
                 })
                 )
               )
             );
    }
  });

  return Dashboard;

});
