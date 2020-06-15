/**
* @package   lizmap
* @subpackage geopoppy
* @author    Michaël DOUCHIN
* @copyright 2020 3liz
* @link      http://3liz.com
* @license    Mozilla Public Licence
*/

var lizGeopoppy = function() {
    var css_scale_active = false;
    var geopoppyMessageTimeoutId = null;
    var action_pending = false;

    function cleanGeopoppyMessage() {
        var $GeopoppyMessage = $('#lizmap-geopoppy-message');
        if ( $GeopoppyMessage.length != 0 ) {
            $GeopoppyMessage.remove();
        }
        geopoppyMessageTimeoutId = null;
    }

    function addGeopoppyMessage(aMessage, aType, aClose){
        if ( geopoppyMessageTimeoutId ) {
            window.clearTimeout(geopoppyMessageTimeoutId);
            geopoppyMessageTimeoutId = null;
        }
        var $GeopoppyMessage = $('#lizmap-geopoppy-message');
        if ( $GeopoppyMessage.length != 0 ) {
            $GeopoppyMessage.remove();
        }
        lizMap.addMessage(aMessage, aType, aClose).attr('id','lizmap-geopoppy-message');
        geopoppyMessageTimeoutId = window.setTimeout(cleanGeopoppyMessage, 2000);
    }

    function addGeopoppyDock(){

        // Build HTML interface
        var html = '';
        html+= '<div id="geopoppy_form_container">';
        html+= '<center>';
        html+= '<button class="btn btn-success btn-large geopoppy geopoppy_action" value="test_central_connection">Test connection</button>';
        html+= '</br>';
        html+= '<button class="btn btn-success btn-large geopoppy geopoppy_action" value="synchronize">Synchronize database</button>';
        html+= '</br>';
        html+= '<button class="btn btn-success btn-large geopoppy geopoppy_action" value="ftp_synchronize">Synchronize media</button>';
        html+= '</br>';
        html+= '<div class="row">';
        html+= '<div class="span-6">';
        html+= '<button class="btn btn-success btn-large geopoppy geopoppy_fullscreen" value="Fullscreen">Fullscreen</button>';
        html+= '</div>';
        html+= '<div class="span-6">';
        html+= '<button class="btn btn-success btn-large geopoppy geopoppy_scalecss" value="scalecss">Zoom interface</button>';
        html+= '</div>';
        html+= '</div>';
        html+= '</br>';
        html+= '</center>';
        html+= '<p id="geopoppy_message" style="display: none;">&nbsp;</p>';
        html+= '<p id="geopoppy_message_description" style="display: none;">&nbsp;</p>';
        html+= '</div>';

        // Add Lizmap minidock
        lizMap.addDock(
            'geopoppy',
            'GeoPoppy',
            'dock',
            html,
            'icon-refresh'
        );
    }

    function initGeopoppyView(activate) {
        // Show dock if needed
        if (activate) {
            $('#mapmenu li.geopoppy:not(.active) a').click();
        }

        // Click on action buttons
        $('#geopoppy_form_container button.geopoppy_action').click(function(){
            if (action_pending) {
                msg = 'Previous action is still in progress';
                addGeopoppyMessage(msg, 'info', true);
                return false;
            }
            action_pending = true;

            // Clean interface
            var action_title = $(this).text();
            beforeAction(action_title);

            // Build URL
            var action = $(this).val();
            var options = {
                geopoppy_action: action,
                geopoppy_token: ''
            };
            var url = geopoppyConfig['urls']['service'];
            var action_url = OpenLayers.Util.urlAppend(
                url,
                OpenLayers.Util.getParameterString(lizUrls.params)
            );

            var pollingStatus = true;
            var pollingTm = null;
            var pollinTimeout = 2000;
            var token = null;
            function pollData() {
                if (token) {
                    options['geopoppy_token'] = token;
                }
                $.ajax({
                    type: 'get',
                    url: action_url,
                    data: options,
                    success : function(result){
                        if (result) {
                            if (result.status == 'progress') {
                                setActionMessage(result);
                                token = result.data.token;
                                pollingTm = setTimeout(function() {
                                    pollData();
                                }, pollinTimeout);
                            } else {
                                stopPolling();
                                setActionMessage(result);
                                reactivateInterface();
                            }
                        } else {
                            stopPolling();
                            reactivateInterface();
                        }
                    }
                });
            }
            function stopPolling() {
                action_pending = false;
                pollingStatus = false;
                clearTimeout(pollingTm);
            }
            pollData();

        });

        // Fullscreen
        $('#geopoppy_form_container button.geopoppy_fullscreen').click(function(){
            toggleFullScreen();
            var fullscreen_active = document.fullscreenElement;
            $(this).toggleClass('active', fullscreen_active);
        });

        // Big buttons
        $('#geopoppy_form_container button.geopoppy_scalecss').click(function(){
            toggleCssScale();
            $(this).toggleClass('active', css_scale_active);
        });


    }


    function beforeAction(title) {
        // message
        $('#geopoppy_message')
        .removeClass('error').removeClass('success').removeClass('progress')
        .addClass('progress')
        .html(title)
        .show()
        ;

        // description
        $('#geopoppy_message_description')
        .html('Action started...')
        .show();

        // Disable buttons
        $('#geopoppy_form_container button.geopoppy_action')
        .addClass('disabled');

        return false;
    }

    function setActionMessage(data) {

        // message
        $('#geopoppy_message')
        .removeClass('error').removeClass('success').removeClass('progress')
        .addClass(data.status)
        .html(data.message.title)
        .show();

        // description
        $('#geopoppy_message_description')
        .html(data.message.description)
        .show();
    }

    function reactivateInterface() {

        // Enable buttons
        $('#geopoppy_form_container button.geopoppy_action')
        .removeClass('disabled');

        return false;
    }

    function toggleFullScreen() {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }

    function addHamburgerMenu() {

        // Add dock with all mapmenu item as buttons
        var html = '';
        html+= '<div id="mobile_menu_container">';
        html+= '<center>';
        var buttons = {};
        $('#mapmenu ul li a').each(function(){
            var a = $(this);
            var aid = a.attr('id');
            var btn_class = 'btn-inverse';
            if (aid) {
                var atitle = a.attr('data-original-title');
                var li = a.parent('li:first');
                var menu_type = li.attr('class')
                .replace('nav-', '')
                .replace('active', '')
                .replace(aid.replace('button-', ''), '')
                .trim()
                ;
                if (menu_type != 'dock' && li.hasClass('active')) {
                    btn_class = 'btn-warning';
                }
                var button = '<button class="btn btn-large ' + ' ' + btn_class + ' ' + menu_type + '" value="' + aid + '">' + atitle + '</button>';
                button+= '</br>';
            }
            if (!(menu_type in buttons))
                    buttons[menu_type] = [];
            buttons[menu_type].push(button);
        });

        // Add the buttons
        var docks = ['dock', 'minidock', 'bottomdock', 'rightdock'];
        for(var d in docks){
            var dock = docks[d];
            if (dock in buttons) {
                html+= '<h3>'+dock+'</h3>';
                html+= '<div>';
                html+= buttons[dock].join(' ');
                html+= '</div>';
            }
        }

        html+= '</center>';
        html+= '</div>';

        // Add dock
        lizMap.addDock('mobile', 'Menu', 'dock', html, 'icon-list');

        // Trigger action when button is clicked
        // It opens the corresponding mapmenu item
        $('#mobile_menu_container button').click(function(){
            var aid = $(this).val();

            // If the dock is not the left dock, hide the left dock
            if (!($(this).hasClass('dock'))) {
                $('#mapmenu li.mobile.active a').click();
            }

            // Change button class
            if ($(this).hasClass('minidock')) {
                $('#mobile_menu_container button.minidock')
                .removeClass('btn-warning').addClass('btn-inverse');
            }
            if (!($(this).hasClass('dock'))) {
                var li = $('#'+aid).parent('li:first');
                var was_active = li.hasClass('active');
                $(this)
                .toggleClass('btn-inverse', was_active)
                .toggleClass('btn-warning', !was_active)
                ;
            }
            $('#'+aid).click();
        });

        // Add humburger button
        var html = '';
        html += '<div id="mobile_hamburger">';
        html+= '<center>';
        html+= '<div class="hamburger_line"></div>';
        html+= '<div class="hamburger_line"></div>';
        html+= '<div class="hamburger_line"></div>';
        html+= '</center>';
        html += '</div>';
        $('#map-content').append(html);
        $('#mobile_hamburger').click(function(){
            $('#mapmenu li.mobile a').click();
            $(this).hide();
        });

        // Hide mapmenu
        $('#mapmenu').css('width', '0px').hide();
        $('#dock').css('left', '0px').css('border-left', 'none');
        $('#map-content').css('margin-left', '0px');

        // Hide active dock
        $('#mapmenu li.nav-dock.active a').click();

        // Show hamburger button when dock is closed
        lizMap.events.on({
            'dockclosed': function(){
                $('#mobile_hamburger').show();
            },
            'minidockclosed': function(){
                $('#mobile_menu_container button.minidock')
                .removeClass('btn-warning')
                .addClass('btn-inverse');
            },
            'bottomdockclosed': function(){
                $('#mobile_menu_container button.bottomdock')
                .removeClass('btn-warning')
                .addClass('btn-inverse');
            }
        });

        // Move dock-close button at the left
        $('#dock-close').css('left', '5px').css('right', 'unset');
    }

    function toggleCssScale() {
        if (!css_scale_active) {
            var css = '';
            css += '#switcher td button,';
            css += '#switcher td > a,';
            css += '#switcher-layers-actions button,';
            css += '#filter-content button,';
            css += '#sub-dock a.btn,';
            css += 'span.popupButtonBar button {';
            css += '    transform: scale(2) !important;';
            css += '    margin: 12px !important;';
            css += '}';
            css += '#switcher-layers-actions td > a {';
            css += '    border: 10px solid #c3c3c3;';
            css += '}';
            css += '#switcher td {';
            css += '    white-space: nowrap !important;';
            css += '}';
            css += '#switcher td span {';
            css += '    font-size: 1.5em;';
            css += '}';
            $('head').append(
                '<style type="text/css" data-name="geopoppy">' + css + '</style>'
            );
        } else {
            $('head style[data-name="geopoppy"]').remove();
        }
        css_scale_active = !css_scale_active;
    }


    // Add tools on startup
    lizMap.events.on({
        'uicreated': function(e) {
            // Add Dock
            addGeopoppyDock();

            // Activate tools
            initGeopoppyView(false);

            // Add hamburger menu and button
            addHamburgerMenu();

            // Prevent back button
            window.addEventListener('beforeunload', (event) => {
                // Cancel the event as stated by the standard.
                event.preventDefault();
                // Chrome requires returnValue to be set.
                event.returnValue = '';
            });

        },
        'minidockclosed': function(e) {
        }
    });
    return {};
}();



