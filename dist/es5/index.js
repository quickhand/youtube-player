'use strict';

var _lodashCollectionForEach2 = require('lodash/collection/forEach');

var _lodashCollectionForEach3 = _interopRequireDefault(_lodashCollectionForEach2);

var _lodashStringCapitalize2 = require('lodash/string/capitalize');

var _lodashStringCapitalize3 = _interopRequireDefault(_lodashStringCapitalize2);

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.preLoadAPI = preLoadAPI;
exports.youTubePlayer = youTubePlayer;

var _eventemitter3 = require('eventemitter3');

var _eventemitter32 = _interopRequireDefault(_eventemitter3);

var _es6Promise = require('es6-promise');

var _functionNames = require('./functionNames');

var _functionNames2 = _interopRequireDefault(_functionNames);

var _eventNames = require('./eventNames');

var _eventNames2 = _interopRequireDefault(_eventNames);

var _loadYouTubeIframeAPI = require('./loadYouTubeIframeAPI');

var _loadYouTubeIframeAPI2 = _interopRequireDefault(_loadYouTubeIframeAPI);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var YouTubePlayer = undefined,
    youtubeIframeAPI = undefined;

YouTubePlayer = {};

function preLoadAPI() {
    youtubeIframeAPI = (0, _loadYouTubeIframeAPI2['default'])();
    return youtubeIframeAPI;
}

/**
 * Construct an object that defines an event handler for all of the
 * YouTube player events. Proxy captured events through an event emitter.
 *
 * @todo Capture event parameters.
 * @see https://developers.google.com/youtube/iframe_api_reference#Events
 * @param {EventEmmitter} emitter
 * @return {Object}
 */
YouTubePlayer.proxyEvents = function (emitter) {
    var events = undefined;

    events = {};

    (0, _lodashCollectionForEach3['default'])(_eventNames2['default'], function (eventName) {
        var onEventName = undefined;

        onEventName = 'on' + (0, _lodashStringCapitalize3['default'])(eventName);

        events[onEventName] = function (event) {
            emitter.emit(eventName, event);
        };
    });

    return events;
};

/**
 * Delays player API method execution until player state is ready.
 *
 * @todo Proxy all of the methods using Object.keys.
 * @param {Promise} playerAPIReady Promise that resolves when player is ready.
 * @return {Object}
 */
YouTubePlayer.promisifyPlayer = function (playerAPIReady) {
    var functions = undefined;

    functions = {};

    (0, _lodashCollectionForEach3['default'])(_functionNames2['default'], function (functionName) {
        functions[functionName] = function () {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            return playerAPIReady.then(function (player) {
                return player[functionName].apply(player, args);
            });
        };
    });

    return functions;
};

/**
 * @typedef options
 * @see https://developers.google.com/youtube/iframe_api_reference#Loading_a_Video_Player
 * @param {Number} width
 * @param {Number} height
 * @param {String} videoId
 * @param {Object} playerVars
 * @param {Object} events
 */

/**
 * A factory function used to produce an instance of YT.Player and queue function calls and proxy events of the resulting object.
 *
 * @param {HTMLElement|String} elementId Either the DOM element or the id of the HTML element where the API will insert an <iframe>.
 * @param {YouTubePlayer~options} options
 * @return {Object}
 */

function youTubePlayer(elementId) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var emitter = undefined,
        playerAPI = undefined,
        playerAPIReady = undefined;

    playerAPI = {};
    emitter = new _eventemitter32['default']();

    if (options.events) {
        throw new Error('Event handlers cannot be overwritten.');
    }

    if (typeof elementId === 'string' && !document.getElementById(elementId)) {
        throw new Error('Element "#' + elementId + '" does not exist.');
    }

    if (youtubeIframeAPI == null) {
        preLoadAPI();
    }

    options.events = YouTubePlayer.proxyEvents(emitter);

    playerAPIReady = new _es6Promise.Promise(function (resolve) {
        youtubeIframeAPI.then(function (YT) {
            return new YT.Player(elementId, options);
        }).then(function (player) {
            emitter.on('ready', function () {
                resolve(player);
            });
        });
    });

    playerAPI = YouTubePlayer.promisifyPlayer(playerAPIReady);
    playerAPI.on = function (eventName, fn, context) {
        emitter.on(eventName, fn, context);
    };

    return playerAPI;
}

;
//# sourceMappingURL=index.js.map
