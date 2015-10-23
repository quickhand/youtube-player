import EventEmitter from 'eventemitter3';
import {Promise} from 'es6-promise';
import functionNames from './functionNames';
import eventNames from './eventNames';
import loadYouTubeIframeAPI from './loadYouTubeIframeAPI';
import {capitalize, forEach as _forEach} from 'lodash';

let YouTubePlayer,
    youtubeIframeAPI;

YouTubePlayer = {};
youtubeIframeAPI = loadYouTubeIframeAPI();

/**
 * Construct an object that defines an event handler for all of the
 * YouTube player events. Proxy captured events through an event emitter.
 *
 * @todo Capture event parameters.
 * @see https://developers.google.com/youtube/iframe_api_reference#Events
 * @param {EventEmmitter} emitter
 * @return {Object}
 */
YouTubePlayer.proxyEvents = (emitter) => {
    let events;

    events = {};

    _forEach(eventNames, (eventName) => {
        let onEventName;

        onEventName = `on${capitalize(eventName)}`;

        events[onEventName] = (event) => {
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
YouTubePlayer.promisifyPlayer = (playerAPIReady) => {
    let functions;

    functions = {};

    _forEach(functionNames, (functionName) => {
        functions[functionName] = (...args) => {
            return playerAPIReady
                .then((player) => {
                    return player[functionName](...args);
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
export default (elementId, options = {}) => {
    let emitter,
        playerAPI,
        playerAPIReady;

    playerAPI = {};
    emitter = new EventEmitter();

    if (options.events) {
        throw new Error(`Event handlers cannot be overwritten.`);
    }

    if (typeof elementId === `string` && !document.getElementById(elementId)) {
        throw new Error(`Element "#${elementId}" does not exist.`);
    }

    options.events = YouTubePlayer.proxyEvents(emitter);

    playerAPIReady = new Promise((resolve) => {
        youtubeIframeAPI
            .then((YT) => {
                return new YT.Player(elementId, options);
            })
            .then((player) => {
                emitter.on(`ready`, () => {
                    resolve(player);
                });
            });
    });

    playerAPI = YouTubePlayer.promisifyPlayer(playerAPIReady);
    playerAPI.on = (eventName, fn, context) => {
        emitter.on(eventName, fn, context);
    };

    return playerAPI;
};
