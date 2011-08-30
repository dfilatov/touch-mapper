/**
 * Touch-mapper jQuery plugin (from ymaps api inspired)
 *
 * Copyright (c) 2011 Filatov Dmitry (dfilatov@yandex-team.ru)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * @version 0.0.2
 */

(function($) {

var userAgent = navigator.userAgent.toLowerCase(),
    hasTouchScreen =
        ($.browser.webkit && userAgent.indexOf('mobile') > -1) ||
        ($.browser.opera && userAgent.indexOf('opera mobi') > -1) ||
        userAgent.indexOf('android') > -1 ||
        (userAgent.indexOf('dolfin') > -1 && userAgent.indexOf('mobile')) > -1,
    options = {
        contextMenuTimeout : 400,
        dblClickTimeout    : 500
    },
    special = $.event.special,
    mouseEvents = ['mouseenter', 'mousemove', 'mousedown', 'mouseup', 'mouseleave', 'contextmenu', 'click', 'dblclick'];

hasTouchScreen && $.each(mouseEvents, function(i, e) {
    special[e] = {

        setup : function() {

            var elem = $(this);

            elem.data('touch-mapper') || elem
                .data(
                    'touch-mapper',
                    {
                        isStarted : false,
                        isMoved   : false,
                        isMulti   : false
                    })
                .bind({
                    'touchstart.touch-mapper'  : onTouchStart,
                    'touchmove.touch-mapper'   : onTouchMove,
                    'touchend.touch-mapper'    : onTouchEnd,
                    'touchcancel.touch-mapper' : onTouchEnd
                });

        },

        teardown : function() {

            var elem = $(this),
                eData = elem.data('events'),
                needUnbind = true;

            // чтобы отписаться от тач-событий, нужно проверить, нет ли хэндлеров на любое другое событие мыши,
            // которое может вызвать тач-событие
            eData && $.each(mouseEvents, function(i, e2) {
                e != e2 && eData[e2] && eData[e2].length && (needUnbind = false);
            });

            needUnbind && elem
                .removeData('touch-mapper')
                .unbind('.touch-mapper');

        }

    };
});

function onTouchStart(e) {

    var origE = e.originalEvent,
        elem = $(this),
        state = elem.data('touch-mapper');

    if(!state.isStarted && origE.touches.length == 1) {
        state.isStarted = true;
        triggerTouchEvent(state.initTouch = e, 'mouseenter', elem);
        triggerTouchEvent(e, 'mousemove', elem);
        triggerTouchEvent(e, 'mousedown', elem);
    }

    // Если поставлен второй палец
    if(origE.touches.length > 1 && !state.isMulti) {
        state.isMulti = true;
    }

}

function onTouchMove(e) {

    var origE = e.originalEvent,
        elem = $(this),
        state = elem.data('touch-mapper');

    state.lastTouchMove = e;

    // move шлется только если палец один
    if(origE.touches.length == 1) {
        // В норме isStarted должен быть true, но возможны ситуации, когда
        // touch-и начали слушать после touchstart-а.
        state.isStarted || onTouchStart(e);
        state.isMoved || (state.isMoved = true);
        triggerTouchEvent(e, 'mousemove', elem);
    }
    else {
        state.isMulti = true;
    }

}

function onTouchEnd(e) {

    var elem = $(this),
        state = elem.data('touch-mapper'),
        touchE = state.isMoved? state.lastTouchMove : state.initTouch;

    if(state.isStarted) {
        triggerTouchEvent(touchE, 'mouseup', elem);

        // Если был мультитач или движение, то никаких кликов быть не должно
        if(!state.isMulti && !state.isMoved) {
            // Если прошло больше contextMenuTimeout времени, значит это ContextMenu
            if(e.timeStamp - state.initTouch.timeStamp > options.contextMenuTimeout) {
                triggerTouchEvent(touchE, 'contextmenu', elem);
                state.lastClickTimeStamp = null;
            }
            // Иначе это клик. Если прошло меньше, чем dblClickTimeout с предыдущего клика, то клик - двойной.
            else {
                if(state.lastClickTimeStamp && e.timeStamp - state.lastClickTimeStamp < options.dblClickTimeout) {
                    triggerTouchEvent(touchE, 'click', elem);
                    triggerTouchEvent(touchE, 'dblclick', elem);
                    state.lastClickTimeStamp = null;
                }
                else {
                    triggerTouchEvent(touchE, 'click', elem);
                    state.lastClickTimeStamp = e.timeStamp;
                }
            }
        }

        triggerTouchEvent(touchE, 'mousemove', elem);
        triggerTouchEvent(touchE, 'mouseleave', elem);

        state.isStarted = state.isMoved = state.isMulti = false;
    }

}

function triggerTouchEvent(sourceE, type, elem) {

    var e = $.Event(type),
        touch = sourceE.originalEvent.touches[0];

    // добавляем недостающие свойства
    e.button = 0;
    $.each(['pageX', 'pageY', 'target'], function(i, name) {
        e[name] = touch[name];
    });

    elem.trigger(e);

}

})(jQuery);