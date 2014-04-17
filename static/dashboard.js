if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([
  'react'
], function(React, undefined) {

  var Dashboard = React.createClass({

    displayName: 'Dashboard',
    
    clickNotifications: function () {
        this.props.markNotificationsAsRead(this.props.notifications);
    },
    
    numNotificationsForBuffer: function(uid) {
        return this.props.notifications.filter(function (n) {
            return n.event.buffer === uid;
        }).length;
    },
    
    sortBuffers: function(buffers) {
        return Object.keys(buffers).map(function(uid) {
            return buffers[uid];
        }).sort(function(a, b) {
            return a.info.short_name.localeCompare( b.info.short_name);
        });
    },

    render: function() {
      var self = this;

      return React.DOM.div({key: 'buffers', className: 'dashboard', style: this.props.layout.dashboard || {}},
               React.DOM.table({className: "table"}, React.DOM.tbody({},
                 [
                     React.DOM.tr({key: "actions", id: "dashboard-actions"}, React.DOM.td({className: "btn-group"}, [
                         React.DOM.button({className: "btn btn-default btn-lg" + (self.props.notifications.length > 0 ? "" : " disabled"),
                                           id: "notifications",
                                           title: "Mark notifications as read",
                                           onClick: self.clickNotifications},
                                             React.DOM.span({ className: "glyphicon glyphicon-bell"},
                                               self.props.notifications.length > 0 ? React.DOM.span({className: "notification-count"},
                                                                                                       self.props.notifications.length): "")),
                         React.DOM.button({className: "btn btn-default btn-lg", disabled: "disabled", title: "Add Network"},
                                          React.DOM.span({ className: "glyphicon glyphicon-plus-sign"})),
                         React.DOM.button({className: "btn btn-default btn-lg", disabled: "disabled", title: "Settings"},
                                          React.DOM.span({ className: "glyphicon glyphicon-cog"})), 
                         React.DOM.button({className: "btn btn-default btn-lg", disabled: "disabled", title: "Help"},
                                           React.DOM.span({ className: "glyphicon glyphicon-question-sign"})), 
                     ]))
                 ].concat(self.sortBuffers(self.props.buffers).map(function(buffer) {
                   var uid = buffer.info.pointers[0];
                   return React.DOM.tr({ key: uid },
                            React.DOM.td({className: (uid == self.props.activeBufferUID ? "active" : "")},
                              React.DOM.a({href: "#",
                                           className: 'dashboard-buffer',
                                           onClick: function(e) {
                                             self.props.openBuffer(uid);
                                             e.preventDefault();
                                           }}, [React.DOM.span({}, buffer.info.short_name + " "),
                                                self.numNotificationsForBuffer(uid) > 0 ? React.DOM.span({className: "notification-count"}, self.numNotificationsForBuffer(uid)) : null,
                                                React.DOM.a({title: "Close", onClick: function(e) {
                                                    self.props.closeBuffer(uid);
                                                }, href: '#',
                                                   className: 'dashboard-buffer-close'},
                                                   React.DOM.span({ className: "glyphicon glyphicon-remove close-buffer"}))])
                            ));
                 })
                 ))
               )
             );
    }
  });

  return Dashboard;

});
