<?php
/**
* @package   lizmap
* @subpackage geopoppy
* @author    Michaël DOUCHIN
* @copyright 2020 3liz
* @link      http://3liz.com
* @license    Mozilla Public Licence
*/

class geopoppyListener extends jEventListener{

    protected function getLizmapGeopoppySource($repository, $project)
    {
        $ok = false;
        $profile = 'geopoppy';

        try {
            // try to get the specific search profile to do not rebuild it
            jProfiles::get('jdb', $profile, true);
        } catch (Exception $e) {
            // else use default
            $profile = null;
        }

        // Try to get data from lizsync table
        try {
            // try to get the specific search profile to do not rebuild it
            $cnx = jDb::getConnection($profile);
            $sql = ' SELECT *';
            $sql.= ' FROM lizsync.server_metadata;';
            $res = $cnx->query($sql);
            $sources = $res->fetchAll();
            return $sources;
        } catch (Exception $e) {
            $ok = false;
        }

        return $ok;
    }

    function ongetMapAdditions ($event) {

        // Check Lizmap project
        $repository = $event->repository;
        $project = $event->project;
        $p = lizmap::getProject($repository.'~'.$project);
        if( !$p ){
             return;
        }

        // Check acl
        if (!$p->checkAcl()) {
            return;
        }

        // Check if table lizmap_geopoppy_sources can be found
        $sources = $this->getLizmapGeopoppySource($repository, $project);
        if (!$sources) {
            return;
        }

        // Prepare config
        $geopoppyConfig = array();
        $geopoppyConfig['urls'] = array();
        $geopoppyConfig['urls']['service'] = jUrl::get('geopoppy~service:action');

        // Set content
        $js = array();
        $js[] = jUrl::get('jelix~www:getfile', array('targetmodule'=>'geopoppy', 'file'=>'geopoppy.js'));
        $jscode = array(
            'var geopoppyConfig = ' . json_encode($geopoppyConfig) . ';'
        );
        // Add translation
        $locales = $this->getLocales();
        $jscode[] = 'var geopoppyLocales = ' . json_encode($locales) . ';';
        $css = array();
        $css[] = jUrl::get('jelix~www:getfile', array('targetmodule'=>'geopoppy', 'file'=>'geopoppy.css'));

        // Return content
        $event->add(
            array(
                'css' => $css,
                'js' => $js,
                'jscode' => $jscode
            )
        );
    }

    private function getLocales ($lang=Null) {

        if (!$lang) {
            $lang = jLocale::getCurrentLang().'_'.jLocale::getCurrentCountry();
        }

        $data = array();
        $path = jApp::getModulePath('geopoppy').'locales/'.$lang.'/geopoppy.UTF-8.properties';
        if (file_exists($path)) {
            $lines = file($path);
            foreach ($lines as $lineNumber => $lineContent) {
                if (!empty($lineContent) and $lineContent != '\n') {
                    $exp = explode('=', trim($lineContent));
                    if (!empty($exp[0])) {
                        $data[$exp[0]] = jLocale::get('geopoppy~geopoppy.'.$exp[0], null, $lang);
                    }
                }
            }
        }
        return $data;
    }
}
?>
