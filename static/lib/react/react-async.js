;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['react'], factory);
  } else {
    root.ReactAsync = factory(root.React);
  }
})(this, function(React) {

  var __ReactShim = window.__ReactShim = window.__ReactShim || {};

  __ReactShim.React = React;

  __ReactShim.cloneWithProps = React.addons.cloneWithProps;

  __ReactShim.invariant = function(check, msg) {
    if (!check) {
      throw new Error(msg);
    }
  }

  var
require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"Focm2+":[function(__browserify__,module,exports){
"use strict";

var BaseMixin               = __browserify__('./lib/BaseMixin');
var getComponentFingerprint = __browserify__('./lib/getComponentFingerprint');

var Mixin = {
  mixins: [BaseMixin],

  getDefaultProps: function() {
    if (window.__reactAsyncStatePacket === undefined) {
      return {};
    }

    var fingerprint = getComponentFingerprint(this);

    if (window.__reactAsyncStatePacket[fingerprint] === undefined) {
      return {};
    }

    var state = window.__reactAsyncStatePacket[fingerprint];
    delete window.__reactAsyncStatePacket[fingerprint];

    if (typeof this.stateFromJSON === 'function') {
      state = this.stateFromJSON(state);
    }

    return {asyncState: state};
  }
};

module.exports = {
  prefetchAsyncState: __browserify__('./lib/prefetchAsyncState'),
  isAsyncComponent: __browserify__('./lib/isAsyncComponent'),
  Mixin: Mixin
};

},{"./lib/BaseMixin":3,"./lib/getComponentFingerprint":4,"./lib/isAsyncComponent":5,"./lib/prefetchAsyncState":6}],"__main__":[function(__browserify__,module,exports){
module.exports=__browserify__('Focm2+');
},{}],3:[function(__browserify__,module,exports){
"use strict";

var invariant         = (window.__ReactShim.invariant);
var isAsyncComponent  = __browserify__('./isAsyncComponent');

/**
 * Mixin for asynchronous components.
 *
 * Asynchronous state is fetched via `getInitialStateAsync(cb)` method but also
 * can be injected via `asyncState` prop.
 *
 * In the latter case `getInitialStateAsync` won't be called at all.
 */
var BaseMixin = {

  getInitialState: function() {
    return this.props.asyncState || {};
  },

  componentDidMount: function() {

    invariant(
      isAsyncComponent(this),
      "%s uses ReactAsync.Mixin and should provide getInitialStateAsync(cb) method",
      this.displayName
    );

    if (!this.props.asyncState) {
      this.getInitialStateAsync(this._onStateReady);
    }
  },

  componentWillReceiveProps: function(nextProps) {
    if (nextProps.asyncState) {
      this.setState(nextProps.asyncState);
    }
  },

  _onStateReady: function(err, state) {
    if (err) {
      throw err;
    }

    if (this.isMounted()) {
      this.setState(state);
    }
  }
};

module.exports = BaseMixin;

},{"./isAsyncComponent":5}],4:[function(__browserify__,module,exports){
"use strict";

/**
 * Get a fingerprint of the component.
 *
 * @param {Object} component
 * @return {String}
 */
function getComponentFingerprint(component) {
  return component._rootNodeID + '__' + component._mountDepth;
}

module.exports = getComponentFingerprint;

},{}],5:[function(__browserify__,module,exports){
"use strict";

/**
 * Check if a component is an async component.
 *
 * @param {ReactComponent} component
 */
function isAsyncComponent(component) {
  return typeof Object.getPrototypeOf(component).getInitialStateAsync === 'function';
}

module.exports = isAsyncComponent;

},{}],6:[function(__browserify__,module,exports){
"use strict";

var invariant         = (window.__ReactShim.invariant);
var cloneWithProps    = (window.__ReactShim.cloneWithProps);
var isAsyncComponent  = __browserify__('./isAsyncComponent');

/**
 * Prefetch an async state for an unmounted async component instance.
 *
 * @param {ReactComponent} component
 * @param {Callback} cb
 */
function prefetchAsyncState(component, cb) {

  invariant(
    isAsyncComponent(component),
    "%s should be an async component to be able to prefetch async state, " +
    "but getInitialStateAsync(cb) method is missing or is not a function",
    component.displayName
  );

  var getInitialStateAsync = Object.getPrototypeOf(component).getInitialStateAsync;

  getInitialStateAsync.call(component, function(err, asyncState) {
    if (err) {
      return cb(err);
    }

    cb(null, cloneWithProps(component, {asyncState: asyncState}));
  });
}

module.exports = prefetchAsyncState;

},{"./isAsyncComponent":5}]},{},[])

  return require('__main__');
});
