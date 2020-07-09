/**
* @package   lizmap
* @subpackage geopoppy
* @author    Michaël DOUCHIN
* @copyright 2020 3liz
* @link      http://3liz.com
* @license    Mozilla Public Licence
*/

var lizGeopoppy = function() {
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
        html+= '<button class="btn btn-primary btn-large geopoppy geopoppy_action" value="test_central_connection">'+geopoppyLocales['ui.button.test.connection.title']+'</button>';
        html+= '</br>';
        html+= '<button class="btn btn-primary btn-large geopoppy geopoppy_action" value="synchronize">'+geopoppyLocales['ui.button.synchronize.database.title']+'</button>';
        html+= '</br>';
        html+= '<button class="btn btn-primary btn-large geopoppy geopoppy_action" value="ftp_synchronize">'+geopoppyLocales['ui.button.synchronize.media.title']+'</button>';
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

    // Add tools on startup
    lizMap.events.on({
        'uicreated': function(e) {
            // Add Dock
            addGeopoppyDock();

            // Activate tools
            initGeopoppyView(false);

            //if ('geolocation' in lizMap.controls) {
                //lizMap.controls.geolocation.activate();
                //$('#geolocation-auto-center').click();
                //if (('locateByLayer' in lizMap.config) && !(jQuery.isEmptyObject(lizMap.config.locateByLayer))) {
                    //$('#mapmenu li.locate:not(.active) a').click();
                //}
            //}

        },
        'minidockclosed': function(e) {
        }
    });

    return {};
}();



