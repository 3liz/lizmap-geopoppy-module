<?php
/**
* @package   lizmap
* @subpackage geopoppy
* @author    your name
* @copyright 2011-2019 3liz
* @link      http://3liz.com
* @license    All rights reserved
*/


class geopoppyModuleInstaller extends jInstallerModule {

    function install() {
        //if ($this->firstDbExec())
        //    $this->execSQLScript('sql/install');

        /*if ($this->firstExec('acl2')) {
            jAcl2DbManager::addSubject('my.subject', 'adresse~acl.my.subject', 'subject.group.id');
            jAcl2DbManager::addRight('admins', 'my.subject'); // for admin group
        }
        */
    }
}
