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
        geopoppyMessageTimeoutId = window.setTimeout(cleanGeopoppyMessage, 5000);
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
        html+= '</center>';
        html+= '<p id="geopoppy_message"><i>...</i>';
        html+= '</p>';
        html+= '</div>';

        // Add Lizmap minidock
        lizMap.addDock(
            'geopoppy',
            'GeoPoppy',
            'minidock',
            html,
            'icon-globe'
        );
    }


    function initGeopoppyView(activate) {

        if (activate) {
            $('#mapmenu li.geopoppy:not(.active) a').click();
        }

        $('#geopoppy_form_container button.geopoppy_action').click(function(){
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
            beforeAction();
            $.getJSON( action_url, options, function(data) {
                if( data ) {
                    afterAction(action, data);
                }
                else {
                    console.log('no data');
                }
            });

        });
    }


    function beforeAction(action) {
        $('#geopoppy_message')
        .removeClass('error').removeClass('success')
        .html('...');
        return false;
    }

    function afterAction(action, data) {
        $('#geopoppy_message')
        .removeClass('error').removeClass('success')
        .addClass(data.status)
        .html(data.message);
        return false;
    }

    // Add tools on startup
    lizMap.events.on({
        'uicreated': function(e) {
            // Activate GeoPoppy tool when the map loads
            var activateGeopoppyOnStartup = true;

            // Add Dock
            addGeopoppyDock();

            // Activate tools
            initGeopoppyView(activateGeopoppyOnStartup);
        },
        'minidockclosed': function(e) {
        }
    });
    return {};
}();



