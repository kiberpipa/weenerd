if (typeof define !== 'function') { var define = require('amdefine')(module) }

define([
  'react',
], function(React, undefined) {

  var NicknameList = React.createClass({
    displayName: 'Buffer',
    
    getInitialState: function () {
      return {value: ""};
    },
    
    render: function() {
        return React.DOM.div({className: "col-lg-2", style: {"overflow-y": "auto", height: "100vh"}},
                 React.DOM.table({className: "table"}, React.DOM.tbody({},
                    this.props.nicklist.map(function (nickname) {
                       return React.DOM.tr({}, React.DOM.td({}, nickname))
                    })
                 ))
        );
    }
  });
  
  return NicknameList;

});
