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

    // Hamburger menu black list
    var menu_black_list = [
        'permaLink',
        'metadata',
        'popupcontent', // will not prevent to use popup, just no see the item in the menu
    ];

    // Auto-center button (replaces Lizmap original #geolocation-bind
    var autoCenterTimeout = 10000;
    var autoCenterStatus = false;
    var autoCenterTm = null;
    var removeStopButton = false;

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
        html+= '<button class="btn btn-primary btn-large geopoppy geopoppy_action" value="test_central_connection">'+geopoppyLocales['ui.button.test.connection.title']+'</button>';
        html+= '</br>';
        html+= '<button class="btn btn-primary btn-large geopoppy geopoppy_action" value="synchronize">'+geopoppyLocales['ui.button.synchronize.database.title']+'</button>';
        html+= '</br>';
        html+= '<button class="btn btn-primary btn-large geopoppy geopoppy_action" value="ftp_synchronize">'+geopoppyLocales['ui.button.synchronize.media.title']+'</button>';
        html+= '</br>';
        html+= '<div class="row">';
        html+= '<div class="span-6">';
        html+= '<button class="btn btn-primary btn-large geopoppy geopoppy_fullscreen" value="Fullscreen">'+geopoppyLocales['ui.button.toggle.fullscreen.title']+'</button>';
        html+= '</div>';
        html+= '<div class="span-6">';
        html+= '<button class="btn btn-primary btn-large geopoppy geopoppy_scalecss" value="scalecss">'+geopoppyLocales['ui.button.zoom.interface.title']+'</button>';
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
            geopoppyLocales['ui.dock.geopoppy.title'],
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
                msg = geopoppyLocales['ui.msg.previous.action'];
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
        .html(geopoppyLocales['ui.msg.action.started'])
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

    function addHamburgerMenu(menu_black_list) {

        // Build panel content from original map-menu
        var slide_content = '';
        slide_content+= '<div id="mobile_menu_container">';
        slide_content+= '<center>';
        var buttons = {'dock': []};
        var ha = $('#mapmenu li.home > a');
        var home_href = ha.attr('href');
        var home_title = ha.attr('data-original-title');
        var home_button = '<button class="btn btn-large btn-inverse dock" value="home" data-href="' + home_href + '">' + home_title + '</button>';
        home_button+= '</br>';
        buttons['dock'].push(home_button);
        $('#mapmenu ul li a').each(function(){
            var a = $(this);
            var aid = a.attr('id');
            var btn_class = 'btn-inverse';
            if (aid) {
                var item = aid.replace('button-', '');
                if (!menu_black_list.includes(item)) {
                    var atitle = a.attr('data-original-title');
                    var li = a.parent('li:first');
                    var menu_type = li.attr('class')
                    .replace('nav-', '')
                    .replace('active', '')
                    .replace(item, '')
                    .trim()
                    ;
                    if (menu_type != 'dock' && li.hasClass('active')) {
                        btn_class = 'btn-warning';
                    }
                    var button = '<button class="btn btn-large ' + ' ' + btn_class + ' ' + menu_type + '" value="' + aid + '">' + atitle + '</button>';
                    button+= '</br>';
                }
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
                slide_content+= '<h3>'+dock+'</h3>';
                slide_content+= '<div>';
                slide_content+= buttons[dock].join(' ');
                slide_content+= '</div>';
            }
        }

        slide_content+= '</center>';
        slide_content+= '</div>';

        // Add hamburger button at the top left
        var hamburger_html = '';
        hamburger_html += '<div id="mobile_hamburger">';
        hamburger_html+= '<center>';
        hamburger_html+= '<div class="hamburger_line"></div>';
        hamburger_html+= '<div class="hamburger_line"></div>';
        hamburger_html+= '<div class="hamburger_line"></div>';
        hamburger_html+= '</center>';
        hamburger_html += '</div>';
        $('#map-content').append(hamburger_html);
        $('#mobile_hamburger').click(function(){
            $('#mapmenu li.mobile a').click();
            $(this).hide();
        });

        // Add edition button at the bottom
        var edition_layer_select = $('#edition-layer');
        if (edition_layer_select.length == 1) {
            var edition_layers_count = edition_layer_select.find('option').length;
            var edition_html = '';
            edition_html += '<div id="mobile_edition">';
            edition_html+= '<center>';
            edition_html+= '<i class="icon-pencil icon-white"></i>';
            edition_html+= '</center>';
            edition_html += '</div>';
            $('#map-content').append(edition_html);

            $('#edition-draw').click(function(){

                // Adapt geolocation minidock interface
                setTimeout(() => {
                    changeGeolocationInterface();
                }, 1000);
            });
            $('#mobile_edition').click(function(){
                // Open creation form automatically if only 1 layer
                if (!lizMap.editionPending && edition_layers_count == 1){
                    $('#edition-draw').click();
                }
                // Toggle edition dock
                $('#mapmenu li.edition a').click();
            });

        }

        function changeGeolocationInterface() {
            // Open geolocation if not yet active
            $('#mapmenu li.geolocation:not(.active) a').click();

            // Update mini dock size
            lizMap.updateMiniDockSize();

            // EDITION
            // Expand geometry menu
            if( $("#edition-point-coord-form-group:visible").length == 0 ) {
                $("#edition-point-coord-form-expander").click();
            }
            // Link edition node X and Y to geolocation
            if (lizMap.editionPending
                && !($('#geolocation-edition-linked').prop( "checked")) ) {
                $('#edition-point-coord-geolocation').prop('checked', true).change();
            }
        }

        // Add dock
        lizMap.addDock('mobile', 'Menu', 'dock', slide_content, 'icon-list');

        // Trigger action when button is clicked
        // It opens the corresponding mapmenu item
        $('#mobile_menu_container button').click(function(){
            var aid = $(this).val();

            if (aid == 'home') {
                var url = $(this).attr('data-href');
                window.open(url, '_top');
                return false;
            }

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

        // Hide mapmenu
        $('#mapmenu').css('width', '0px').hide();
        $('#dock').css('left', '0px').css('border-left', 'none');
        $('#map-content').css('margin-left', '0px');
        lizMap.updateContentSize();

        // Hide active dock
        $('#mapmenu li.nav-dock.active a').click();

        // Show hamburger button when dock is closed
        // (de)Activate popup to let the user close the dock when clicking in the map
        lizMap.events.on({
            'dockopened': function() {
                if ('featureInfo' in lizMap.controls) {
                    lizMap.controls.featureInfo.deactivate();
                }
            },
            'bottomdockopened': function() {
                if ('featureInfo' in lizMap.controls) {
                    lizMap.controls.featureInfo.deactivate();
                }
            },
            'minidockopened': function() {
                lizMap.updateMiniDockSize();
            },
            'dockclosed': function(e){
                $('#mobile_hamburger').show();

                if ('featureInfo' in lizMap.controls) {
                    lizMap.controls.featureInfo.activate();
                }
                if (e.id == 'edition' && lizMap.editionPending) {
                    changeGeolocationInterface();
                }
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

                if ('featureInfo' in lizMap.controls) {
                    lizMap.controls.featureInfo.activate();
                }
            }
        });

        // Move dock-close button at the left
        $('#dock-close').css('left', '5px').css('right', 'unset');

        // Hide dock if map is clicked
        $('#content.mobile #map').click(function(event){
            var active_dock_a = $('#mapmenu ul li.nav-dock.active a, #mapmenu ul li.nav-bottomdock.active a, #mapmenu ul li.nav-rightdock.active a');
            if (active_dock_a.length) {
                active_dock_a.click();
                return false;
            }
        });


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
            // Make geolocation button larger
            $('div#geolocation button.btn')
            .removeClass('btn-small')
            .addClass('btn-large');
        } else {
            $('head style[data-name="geopoppy"]').remove();
            // Make geolocation button smaller
            $('div#geolocation button.btn')
            .removeClass('btn-large')
            .addClass('btn-small');
        }
        css_scale_active = !css_scale_active;
    }


    function reactivateLocateAutocomplete() {
        $('div.locate-layer select').hide();
        $('span.custom-combobox').show();
        $('span.custom-combobox input').autocomplete(
            "option",
            "position",
            { my : "right top", at: "right bottom" }
        );
    }


    function toggleAutoCenter(toggle) {
        var geolocate = lizMap.controls.geolocation;
        if (toggle) {
            setAutoCenter()
        } else {
            clearAutoCenter();
        }
    }

    function setAutoCenter() {
        autoCenterTm = setTimeout(
            function() {
                autoCenterStatus = true;
                // Zoom
                $('#geolocation-center').click();
                //console.log('center = ' + (new Date()).getSeconds());
                // Re-run
                setAutoCenter();
            },
            autoCenterTimeout
        );
    }
    function clearAutoCenter() {
        console.log('deactivate auto center');
        autoCenterStatus = false;
        clearTimeout(autoCenterTm);
    }

    function replaceGeolocationAutoCenterButton() {
        // Run only if needed
        if (!('geolocation' in lizMap.controls)) {
            return false;
        }
        // Hide Lizmap original auto center button
        $('#geolocation-bind').hide();

        // Replace with new button
        var but = '&nbsp;<button id="geolocation-auto-center" class="btn btn-large btn-primary start"><span class="icon"></span>&nbsp;'+geopoppyLocales['ui.button.geolocation.auto.center.title']+'</button>';

        $('#geolocation-center').after(but);
        $('#geolocation-auto-center').click(function(){
            if ($(this).hasClass('start')) {
                $(this).removeClass('start');
                var set_active = true;
            } else {
                var set_active = !autoCenterStatus;
            }
            $(this)
                .toggleClass('btn-success', set_active)
                .toggleClass('btn-primary', !set_active);
            toggleAutoCenter(set_active);
        });

        // Remove stop button
        if (removeStopButton) {
            $('#geolocation-stop').hide();
        }

    }


    // Add tools on startup
    lizMap.events.on({
        'uicreated': function(e) {
            // Add Dock
            addGeopoppyDock();

            // Activate tools
            initGeopoppyView(false);

            // Add hamburger menu and button
            // List the lizmap menu item to NOT show in the hamburger menu
            addHamburgerMenu(menu_black_list);

            // Prevent leaving the page without warning (back button in Android)
            window.addEventListener('beforeunload', (event) => {
                // Cancel the event as stated by the standard.
                event.preventDefault();
                // Chrome requires returnValue to be set.
                event.returnValue = '';
            });

            // Reactivate autocompletion for content.mobile
            // And position the panel from bottom to top
            // We change select height because lizMap updatemobile function
            // is triggered lately (and on window resize)
            // and would override code placed here
            setTimeout(() => { reactivateLocateAutocomplete(); }, 2000);
            $('div#locate').click(function(){
                reactivateLocateAutocomplete();
            });

            // Auto activate fullscreen and bigger interfae
            $('#geopoppy_form_container button.geopoppy_scalecss').click();

            // Replace autocenter
            replaceGeolocationAutoCenterButton();

            if ('geolocation' in lizMap.controls) {
                lizMap.controls.geolocation.activate();
                $('#geolocation-auto-center').click();

                // Re-display locate by layer
                if (('locateByLayer' in lizMap.config) && !(jQuery.isEmptyObject(lizMap.config.locateByLayer))) {
                    $('#mapmenu li.locate:not(.active) a').click();
                }
            }

        },
        'minidockclosed': function(e) {
        }
    });

    return {};
}();



