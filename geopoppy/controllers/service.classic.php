<?php
/**
* @package   lizmap
* @subpackage geopoppy
* @author    Michaël DOUCHIN
* @copyright 2020 3liz
* @link      http://3liz.com
* @license    All rights reserved
*/

class serviceCtrl extends jController {

    function action(){
        $rep = $this->getResponse('json');

        $project = $this->param('project');
        $repository = $this->param('repository');
        $action = $this->param('geopoppy_action');
        $options = array();

        if(!$project){
            $rep->data = array('status'=>'error', 'message'=>'Project not found');
            return $rep;
        }
        if(!$repository){
            $rep->data = array('status'=>'error', 'message'=>'Repository not found');
            return $rep;
        }

        // Check lizmap project and acl
        $p = lizmap::getProject($repository.'~'.$project);
        if( !$p ){
            $rep->data = array('status'=>'error', 'message'=>'A problem occured while loading project with Lizmap');
            return $rep;
        }
        if (!$p->checkAcl()) {
            $rep->data = array('status'=>'error', 'message'=>jLocale::get('view~default.repository.access.denied'));
            return $rep;
        }

        // Get geopoppy class
        $geopoppy = jClasses::getService('geopoppy~geopoppy');
        $rdata = $geopoppy->getData( $repository, $project, $action, $options);
        $rep->data = $rdata;
        return $rep;
    }


}
