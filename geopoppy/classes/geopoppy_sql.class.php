<?php
/**
* @package   lizmap
* @subpackage geopoppy
* @author    Michaël DOUCHIN
* @copyright 2020 3liz
* @link      http://3liz.com
* @license    Mozilla Public Licence
*/

class geopoppy_sql {

    protected $actions = array(
        'test_central_connection' => array(
            'sql' => '
                SELECT * FROM central_lizsync.server_metadata
            ',
            'message' => 'Connection to server OK'
        ),
        'synchronize' => array(
            'sql' => '
                SELECT * FROM lizsync.synchronize()
            ',
            'message' => 'Synchronization OK'
        )
        // Add parameters, FROM geopoppy.calcul_num_adr(ST_geomfromtext($1,$2))
    );

    protected function getSql($action) {
        if (isset($this->actions[$action]) and !empty($this->actions[$action]['sql']) ) {
            return $this->actions[$action]['sql'];
        }
        return Null;
    }

    protected function getMessage($action, $data) {

        $message = array();
        if (isset($this->actions[$action]) and !empty($this->actions[$action]['message']) ) {
            $message['title'] = $this->actions[$action]['message'];
            // synchronization
            $description = '';
            if ($action == 'synchronize') {
                foreach($data as $line){
                    $description.= '<b>server to clone</b>: ';
                    $description.= $line->number_replayed_to_central.'</br>';
                    $description.= '<b>clone to server</b>: ';
                    $description.= $line->number_replayed_to_clone.'</br>';
                    $description.= '<b>conflicts resolved</b>: ';
                    $description.= $line->number_conflicts.'</br>';
                }
            } else {
                foreach($data as $line){
                    foreach($line as $k=>$v){
                        $description.= '<b>'.$k.'</b>: '.$v.'</br>';
                    }
                }
            }
            $message['description'] = $description;
            return $message;
        }
        return Null;
    }

    /**
    * Get the Name of the DB profile
    * @param project Project key
    * @param repository Repository key
    * @param layerName Name of the Parcelle layer
    * @param profile The default geopoppy DB profile
    * @return Name of the geopoppy DB profile
    */
    protected function getDatasourceProfile($repository, $project) {
        $p = lizmap::getProject($repository.'~'.$project);
        $profile = 'geopoppy';
        return $profile;
    }

    function start($repository, $project, $token, $action) {

        $profile = $this->getDatasourceProfile($repository, $project);
        $this->repository = $repository;
        $this->project = $project;

        // Get SQL query for action
        $sql = $this->getSql($action);
        if(!$sql){
            return array(
                'status'=>'error',
                'message'=> array(
                    'title'=>'The given action does not exists in this module',
                    'description'=>''
                ),
                'data'=> array()
            );
        }

        // Get connection to local database
        try {
            $cnx = jDb::getConnection( $profile );
        } catch (Exception $e) {
            return array(
                'status'=>'error',
                'message'=> array(
                    'title'=>'Connection error',
                    'description'=>'Cannot connect to local geopoppy database'
                ),
                'data'=> array()
            );
        }

        // Prepare query (prepared statement)
        try {
            $resultset = $cnx->prepare( $sql );
        } catch (Exception $e) {
            return array(
                'status'=>'error',
                'message'=> array(
                    'title'=>'SQL error',
                    'description'=> $e->getMessage()
                ),
                'data'=> array()
            );
        }

        // Execute query (prepared statement)
        $resultset->execute();
        $errorInfo = $cnx->errorInfo();
        if($errorInfo and !empty($errorInfo[1])) {
            return array(
                'status'=>'error',
                'message'=> array(
                    'title'=>'SQL error',
                    'description'=> $errorInfo[1]
                ),
                'data'=> array()
            );
        }

        // Get notices
        //$last_notice = pg_last_notice($cnx, PGSQL_NOTICE_ALL);
        //jLog::log(json_encode($last_notice));

        // Get returned data
        $data = $resultset->fetchAll();
        $errorInfo = $cnx->errorInfo();
        if($errorInfo and !empty($errorInfo[1])) {
            return array(
                'status'=>'error',
                'message'=> array(
                    'title'=>'SQL error',
                    'description'=> $errorInfo[1]
                ),
                'data'=> array()
            );
        }

        // Data has been fetched
        $message = $this->getMessage($action, $data);
        $rdata = array(
            'status'=>'success',
            'message'=>$message,
            'data'=> $data
        );
        return $rdata;

    }
}
?>
