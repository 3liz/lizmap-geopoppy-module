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

    private function getServiceParameters() {

        $project = $this->param('project');
        $repository = $this->param('repository');

        if(!$project){
            $data = array(
                'status'=>'error',
                'message'=>array(
                    'title'=>'Project not found',
                    'description' => ''
                )
            );
            return $data;
        }
        if(!$repository){
            $data = array(
                'status'=>'error',
                'message'=>array(
                    'title'=>'Repository not found',
                    'description' => ''
                )
            );
            return $data;
        }

        // Check lizmap project and acl
        $p = lizmap::getProject($repository.'~'.$project);
        if( !$p ){
            $data = array(
                'status'=>'error',
                'message'=>array(
                    'title'=>'A problem occured while loading project with Lizmap',
                    'description' => ''
                )
            );
            return $data;
        }
        if (!$p->checkAcl()) {
            $data = array(
                'status'=>'error',
                'message'=>array(
                    'title'=>jLocale::get('view~default.repository.access.denied'),
                    'description' => ''
                )
            );
            return $data;
        }

        return array(
            'status'=>'success',
            'message'=>array()
        );
    }

    function action() {
        $rep = $this->getResponse('json');

        // Check request
        $check = $this->getServiceParameters();
        if ($check['status'] == 'error') {
            $rep->data = $check;
            return $rep;
        }

        // Request params
        $project = $this->param('project');
        $repository = $this->param('repository');
        $action = $this->param('geopoppy_action');
        $token = $this->param('geopoppy_token');

        // actions type
        $sql_actions = array('test_central_connection', 'synchronize');
        $ftp_actions = array('ftp_synchronize', 'ftp_status');

        // Get corresponding class: sql or ftp
        if (in_array($action, $sql_actions)) {
            $geopoppy = jClasses::getService('geopoppy~geopoppy_sql');
        } else {
            $geopoppy = jClasses::getService('geopoppy~geopoppy_ftp');
        }

        // Create token if needed
        if (empty($token)) {
            $token = md5($repository . $project . $action . microtime(true));
            // We must start the action
            $rdata = $geopoppy->start( $repository, $project, $token, $action);
        } else {
            // There is a token: we must get action status
            $rdata = $geopoppy->status( $repository, $project, $token, $action);
        }

        // Get data and return answer
        $rep->data = $rdata;
        return $rep;
    }

    function status() {
        // Check request
        $check = $this->getServiceParameters();
        if ($check['status'] == 'error') {
            $rep->data = $check;
            return $rep;
        }

        // Request params
        $project = $this->param('project');
        $repository = $this->param('repository');
        $action = $this->param('geopoppy_action');


    }


}
