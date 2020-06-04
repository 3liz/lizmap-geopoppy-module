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
        html+= '<button class="btn btn-primary geopoppy_action" value="test_central_connection">Test connection</button>';
        html+= '</br>';
        html+= '<button class="btn btn-primary geopoppy_action" value="synchronize">Synchronize</button>';
        html+= '</br>';
        html+= '<button class="btn btn-primary geopoppy_fullscreen" value="Fullscreen">Fullscreen</button>';
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
            beforeAction();

            // Build URL
            var action = $(this).val();
            var options = {
                geopoppy_action: action,
                options: ''
            };
            var url = geopoppyConfig['urls']['service'];
            var action_url = OpenLayers.Util.urlAppend(
                url,
                OpenLayers.Util.getParameterString(lizUrls.params)
            );

            // Query data
            $.getJSON( action_url, options, function(data) {
                if( data ) {
                    afterAction(action, data);
                }
                else {
                    console.log('no data');
                }
                action_pending = false;
            });

        });

        // Fullscreen
        $('#geopoppy_form_container button.geopoppy_fullscreen').click(function(){
            toggleFullScreen();
        });


    }


    function beforeAction() {
        // message
        $('#geopoppy_message')
        .removeClass('error').removeClass('success')
        .html('')
        .hide();

        // description
        $('#geopoppy_message_description')
        .html('')
        .hide();

        // Disable buttons
        $('#geopoppy_form_container button.geopoppy_action')
        .addClass('disabled');

        return false;
    }

    function afterAction(action, data) {
        // message
        $('#geopoppy_message')
        .removeClass('error').removeClass('success')
        .addClass(data.status)
        .html(data.message.title)
        .show();

        // description
        $('#geopoppy_message_description')
        .html(data.message.description)
        .show();

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


    // Add tools on startup
    lizMap.events.on({
        'uicreated': function(e) {
            // Add Dock
            addGeopoppyDock();

            // Activate tools
            initGeopoppyView(true);
        },
        'minidockclosed': function(e) {
        }
    });
    return {};
}();



