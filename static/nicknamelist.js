if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([
  'react',
], function(React, undefined) {

  var NicknameList = React.createClass({
    displayName: 'Buffer',
    
    getInitialState: function () {
      return {value: ""};
    },
    
    clickNickname: function(e) {
        this.props.sendInput("/query " + e.target.text);
        // TODO: openbuffer? which one?
    },
    
    render: function() {
      var self = this;
      return React.DOM.div({style: this.props.layout.nicklist || {}},
                 React.DOM.table({className: "table"}, React.DOM.tbody({},
                    this.props.nicklist.map(function (nickname) {
                       return React.DOM.tr({}, 
                         React.DOM.td({}, 
                           React.DOM.a({href: "#",
                                        title: "Query " + nickname,
                                        onClick: self.clickNickname}, nickname)));
                    })
                 ))
        );
    }
  });
  
  return NicknameList;

});
